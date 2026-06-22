"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { parsePhoneNumber } from "libphonenumber-js";
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  NewPasswordSchema,
  UpdateUserSchema,
} from "@/types/data-schemas";
import { signIn, signOut } from "@/auth";
import {
  ExtendedUser,
  FormResponse,
  LoginResponse,
  RegisterResponse,
  VerifyAndLoginResponse,
  ResetPasswordVerifyResponse,
} from "@/types/types";
import { parseStringify } from "@/lib/utils";
import {
  createAuthTokenFromLogin,
  createStaffAuthToken,
  deleteActiveBusinessCookie,
  deleteAuthCookie,
  deleteStaffAuthCookie,
  getAuthToken,
  getStaffAuthToken,
  storePendingVerification,
  getPendingVerification,
  clearPendingVerification,
  updateAuthToken,
} from "@/lib/auth-utils";
import { isStaffToken } from "@/lib/jwt-utils";
import { establishCustomerSession } from "@/lib/customer-session";
import ApiClient from "@/lib/settlo-api-client";
import { parseApiError, getUIErrorMessage } from "@/lib/settlo-api-error-handler";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { clearDestination } from "./destination";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";
const ACCOUNTS_SERVICE_URL =
  process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL || "";
const WHITELABEL_CLIENT_ID =
  process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID || "";

// Verbose/PII-bearing auth logging (full API error bodies, account ids, the
// auth-service URL, request flow markers) must never run in production. Gate it
// behind non-prod; genuine unexpected failures still use console.error below.
const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== "production") console.log(...args);
};

// Cookies must carry `Secure` on any HTTPS deployment, not just prod, so an
// HTTPS staging/preview deploy (NODE_ENV !== production) doesn't ship auth
// cookies without Secure. Local http dev leaves both unset → secure stays false.
const COOKIE_SECURE =
  process.env.NODE_ENV === "production" ||
  process.env.COOKIE_SECURE === "true";

export async function logout() {
  // Always clear local state, regardless of whether the API call succeeds
  const authToken = await getAuthToken();

  // Best-effort: call the auth service to revoke tokens server-side
  if (authToken?.accessToken || authToken?.refreshToken) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      };
      if (authToken.accessToken) {
        headers["Authorization"] = `Bearer ${authToken.accessToken}`;
      }

      await fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          refreshToken: authToken.refreshToken || undefined,
          logoutAll: false,
        }),
      });
    } catch {
      // API might be down — continue with local cleanup
    }
  }

  // Clear all local auth data
  try {
    await deleteAuthCookie();
  } catch {
    // Cookie deletion might fail in some contexts — continue anyway
  }

  // Sign out from NextAuth and redirect to login
  try {
    await signOut({ redirectTo: "/login" });
  } catch (error) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      throw error;
    }
  }
}

/**
 * Ends a staff impersonation ("login on behalf") session from the customer
 * side: best-effort revokes the short-lived impersonation token at the auth
 * service, then clears the local customer session (cookie + NextAuth). Returns
 * a result instead of redirecting so the banner's client handler can close the
 * impersonation tab afterwards.
 */
export async function endImpersonation(): Promise<FormResponse> {
  const authToken = await getAuthToken();

  if (authToken?.accessToken || authToken?.refreshToken) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      };
      if (authToken.accessToken) {
        headers["Authorization"] = `Bearer ${authToken.accessToken}`;
      }
      await fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          refreshToken: authToken.refreshToken || undefined,
          logoutAll: false,
        }),
      });
    } catch {
      // Auth service unreachable — still clear local state below.
    }
  }

  try {
    await deleteAuthCookie();
  } catch {
    // Cookie deletion can fail outside an action/route context — ignore.
  }

  try {
    await signOut({ redirect: false });
  } catch {
    // With redirect:false signOut resolves normally; guard just in case.
  }

  return parseStringify({
    responseType: "success",
    message: "Impersonation ended",
  });
}

/**
 * Pulls the `mfaToken` out of a 412 MFA-challenge response body. The shared
 * `parseApiError` helper only surfaces code/message, so the login/oauth paths
 * read the raw JSON here. Defensive against a non-JSON or already-consumed body.
 */
async function extractMfaToken(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json();
    const token = body?.mfaToken ?? body?.metadata?.mfaToken;
    return typeof token === "string" && token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Shared post-login session establisher. Runs the identical work both the
 * password-login success path and the MFA-verify path need: auto-accept a
 * pending invite, compute `hasInvitedAccess` from /me/accounts, fetch the
 * Accounts profile, establish the first-party customer session, pre-select an
 * invited single business/location, and apply remember-me persistence.
 *
 * Returns a ready-to-return FormResponse — `success` when the session is live,
 * or an `error` when the profile fetch fails (in which case the partial auth
 * cookie is cleared so the user can safely retry).
 */
async function establishSessionFromLogin(
  loginData: LoginResponse,
  rememberMe: boolean = false,
): Promise<FormResponse> {
  // Auto-accept a pending invitation BEFORE computing routing flags, so
  // /me/accounts reflects the new membership and hasInvitedAccess is correct.
  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get("pendingInvite")?.value;
  // Capture before deletion so we can use it later in the pre-select block.
  const cameFromInvite = !!pendingInvite;
  if (pendingInvite) {
    try {
      const res = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/account-members/${pendingInvite}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Content-Type": "application/json",
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
        },
      );
      if (!res.ok) console.error("[LOGIN] auto-accept invite returned", res.status);
    } catch (e) {
      console.error("[LOGIN] auto-accept invite failed:", e);
    } finally {
      try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
    }
  }

  // Determine whether the user has access to any account they don't own.
  let hasInvitedAccess = false;
  try {
    const meRes = await fetch(`${ACCOUNTS_SERVICE_URL}/api/v1/me/accounts`, {
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
    });
    if (meRes.ok) {
      const accounts = (await meRes.json()) as Array<{ owner?: boolean }>;
      hasInvitedAccess = Array.isArray(accounts) && accounts.some((a) => a?.owner === false);
    } else {
      console.error("[LOGIN] /me/accounts returned", meRes.status);
    }
  } catch (e) {
    console.error("[LOGIN] /me/accounts fetch failed:", e);
  }

  let profileData: any = {};
  let profileFetchError:
    | { status: number; code?: string; message?: string }
    | null = null;
  try {
    devLog("[LOGIN] Fetching profile from:", `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`);
    const profileResponse = await fetch(
      `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
      },
    );
    devLog("[LOGIN] Profile response status:", profileResponse.status);
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
      devLog("[LOGIN] Profile fetched for:", profileData.firstName, profileData.lastName);
    } else {
      const apiError = await parseApiError(profileResponse);
      console.error("[LOGIN] Profile fetch failed:", profileResponse.status, apiError.code);
      devLog("[LOGIN] Profile fetch error body:", JSON.stringify(apiError));
      profileFetchError = {
        status: profileResponse.status,
        code: apiError.code,
        message: apiError.message,
      };
    }
  } catch (profileErr: any) {
    console.error("[LOGIN] Profile fetch error:", profileErr);
    profileFetchError = {
      status: 0,
      code: "NETWORK_ERROR",
      message: profileErr?.message,
    };
  }

  // Profile fetch is required for routing decisions (business/location
  // completion flags drive the onboarding redirect). If it failed, abort
  // the login and surface the error so the user can retry — defaulting
  // the flags to false sends fully-onboarded users back to the business
  // registration screen.
  if (profileFetchError) {
    await deleteAuthCookie();
    const fallback =
      profileFetchError.status >= 500 || profileFetchError.status === 0
        ? "We couldn't load your account right now. Please try again in a moment."
        : "We couldn't load your account. Please try again.";
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(
        profileFetchError.code,
        profileFetchError.message,
        fallback,
      ),
      error: new Error(
        profileFetchError.code || `HTTP ${profileFetchError.status}`,
      ),
    });
  }

  devLog("[LOGIN] Establishing customer session...");
  await establishCustomerSession(loginData, {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    phoneNumber: profileData.phoneNumber,
    pictureUrl: profileData.pictureUrl || profileData.avatar,
    isBusinessRegistrationComplete:
      profileData.isBusinessRegistrationComplete ??
      profileData.businessComplete,
    isLocationRegistrationComplete:
      profileData.isLocationRegistrationComplete ??
      profileData.locationComplete,
    countryId: profileData.countryId || profileData.country,
    countryCode: profileData.countryCode,
    theme: profileData.theme,
    hasInvitedAccess,
  });
  devLog("[LOGIN] Customer session established");

  // Best-effort: pre-select the invited business/location so the user
  // lands directly in context instead of having to choose at /select-business.
  // Only fires for invited logins that have exactly one business — for
  // multi-business users we leave the choice to them. Any failure here is
  // silently swallowed; the user still reaches /select-business normally.
  if (cameFromInvite && hasInvitedAccess) {
    try {
      const bizHeaders: Record<string, string> = {
        Authorization: `Bearer ${loginData.accessToken}`,
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      };

      const bizRes = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/me/businesses`,
        { headers: bizHeaders },
      );
      if (bizRes.ok) {
        const bizzes = await bizRes.json();
        if (Array.isArray(bizzes) && bizzes.length === 1) {
          const biz = bizzes[0];
          const isProduction = process.env.NODE_ENV === "production";
          const cookieOpts = {
            httpOnly: true,
            secure: COOKIE_SECURE,
            sameSite: isProduction ? ("strict" as const) : ("lax" as const),
          };

          // Mirror the minimalBusiness shape from lib/actions/auth/business.tsx ~line 319
          const minimalBusiness = {
            id: biz.id,
            identifier: biz.identifier ?? biz.slug ?? "",
            name: biz.name,
            businessTypeId: biz.businessTypeId ?? "",
            businessTypeName: biz.businessTypeName ?? "",
            logoUrl: biz.logoUrl ?? null,
            active: biz.active,
            accountId: biz.accountId,
            countryId: biz.countryId ?? "",
          };

          cookieStore.set({
            name: "currentBusiness",
            value: JSON.stringify(minimalBusiness),
            ...cookieOpts,
          });

          // Fetch first location for this business
          const locRes = await fetch(
            `${ACCOUNTS_SERVICE_URL}/api/v1/me/locations?businessId=${biz.id}`,
            { headers: bizHeaders },
          );
          if (locRes.ok) {
            const locs = await locRes.json();
            if (Array.isArray(locs) && locs.length >= 1) {
              const loc = locs[0];
              // Mirror the full location object shape from lib/actions/auth/location.tsx ~line 95
              const locationObj = {
                id: loc.id,
                accountId: loc.accountId ?? "",
                businessId: loc.businessId ?? biz.id,
                businessName: loc.businessName ?? biz.name ?? "",
                identifier: loc.identifier ?? loc.id,
                name: loc.name,
                description: loc.description ?? "",
                phoneNumber: loc.phoneNumber ?? "",
                email: loc.email ?? "",
                active: loc.active,
                countryId: loc.countryId ?? "",
                region: loc.region ?? "",
                district: loc.district ?? "",
                ward: loc.ward ?? "",
                address: loc.address ?? "",
                postalCode: loc.postalCode ?? "",
                latitude: loc.latitude ?? null,
                longitude: loc.longitude ?? null,
                timezone: loc.timezone ?? "",
                website: loc.website ?? "",
                createdAt: loc.createdAt ?? "",
                updatedAt: loc.updatedAt ?? "",
              };
              cookieStore.set({
                name: "currentLocation",
                value: JSON.stringify(locationObj),
                ...cookieOpts,
              });
              devLog("[LOGIN] Pre-selected invited business/location:", biz.id, loc.id);
            }
          }
        }
      }
    } catch (e) {
      // Non-critical — user falls back to /select-business
      console.warn("[LOGIN] Pre-select invited business/location failed (non-critical):", e);
    }
  }

  await setSessionPersistence(rememberMe);

  return parseStringify({
    responseType: "success",
    message: "Login successful",
  });
}

export const login = async (
  credentials: z.infer<typeof LoginSchema>,
  rememberMe: boolean = false,
  recaptchaToken?: string,
): Promise<FormResponse> => {
  const validatedData = LoginSchema.safeParse(credentials);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error("Incomplete credentials"),
    });
  }

  await deleteAuthCookie();
  await deleteActiveBusinessCookie();
  await clearDestination();

  try {
    devLog("[LOGIN] Attempting login to:", `${AUTH_SERVICE_URL}/auth/login`);

    const loginBody: Record<string, string> = {
      email: validatedData.data.email,
      password: validatedData.data.password,
    };
    if (recaptchaToken) {
      loginBody.recaptchaToken = recaptchaToken;
      loginBody.recaptchaAction = "login";
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      body: JSON.stringify(loginBody),
    });

    devLog("[LOGIN] Auth response status:", response.status);

    // MFA challenge: the backend returns 412 with { mfaRequired, mfaToken } and
    // does NOT issue a session. parseApiError() only surfaces code/message, so
    // read the raw body here to pull out mfaToken and hand it to the MFA step.
    if (response.status === 412) {
      const mfaToken = await extractMfaToken(response);
      devLog("[LOGIN] MFA required, mfaToken present:", !!mfaToken);
      if (mfaToken) {
        return parseStringify({
          responseType: "mfa_required",
          message: "Enter your authentication code to continue.",
          data: { mfaToken },
        });
      }
      // 412 without a usable token — surface a generic error rather than
      // dropping the user into an MFA step we can't complete.
      return parseStringify({
        responseType: "error",
        message:
          "Multi-factor authentication is required but the challenge could not be started. Please try again.",
        error: new Error("MFA_TOKEN_MISSING"),
      });
    }

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[LOGIN] Auth error response:", JSON.stringify(apiError));

      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Authentication failed. Please try again."),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const loginData: LoginResponse = await response.json();
    devLog("[LOGIN] Login successful, emailVerified:", loginData.emailVerified, "userId:", loginData.userId);

    if (!loginData.emailVerified) {
      await storePendingVerification({
        userId: loginData.userId,
        email: loginData.email,
        verificationResendToken: loginData.verificationResendToken,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });

      // Create auth cookie so middleware sees isLoggedIn=true with emailVerified=false
      await createAuthTokenFromLogin(loginData);

      return parseStringify({
        responseType: "needs_verification",
        message:
          "Please verify your email address. Check your inbox for a verification code.",
        data: {
          userId: loginData.userId,
          email: loginData.email,
        },
      });
    }

    // Post-login work (invite accept, hasInvitedAccess, profile fetch,
    // session establish, invited business/location pre-select) is shared with
    // the MFA-verify path so the resulting session is byte-for-byte identical.
    return await establishSessionFromLogin(loginData, rememberMe);
  } catch (error: any) {
    console.error("[LOGIN] Caught error:", {
      name: error?.name,
      type: error?.type,
      message: error?.message,
      cause: error?.cause,
      digest: error?.digest,
      stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
    });

    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (
      error?.type === "CredentialsSignin" ||
      error?.name === "CredentialsSignin" ||
      error?.message?.includes("CredentialsSignin")
    ) {
      return parseStringify({
        responseType: "error",
        message: "Wrong credentials! Invalid email address and/or password",
        error: new Error("Wrong credentials"),
      });
    }

    return parseStringify({
      responseType: "error",
      message: "An unexpected error occurred. Please try again.",
      error: new Error(error?.message || "Unexpected"),
    });
  }
};

// Error codes / statuses that mean the MFA challenge can no longer be completed
// (token expired/revoked, account locked, rate-limited). These send the user
// back to the credentials step rather than letting them keep retrying a code.
const MFA_FATAL_CODES = new Set([
  "TOKEN_EXPIRED",
  "TOKEN_INVALID_SIGNATURE",
  "TOKEN_MALFORMED",
  "TOKEN_REVOKED",
  "MFA_TOKEN_EXPIRED",
  "MFA_TOKEN_INVALID",
  "MFA_TOKEN_NOT_FOUND",
  "SESSION_EXPIRED",
  "ACCOUNT_LOCKED",
  "RATE_LIMITED",
]);

/**
 * Second step of an MFA login. The first step (password OR OAuth) returned a
 * 412 with an mfaToken and issued NO session; here we POST that token plus the
 * user's 6-digit TOTP or a recovery code to /auth/mfa/verify. On success the
 * endpoint returns a full LoginResponse and we establish the session via the
 * shared establishSessionFromLogin so it is identical to a normal login.
 *
 * A wrong code does NOT consume the mfaToken (the backend allows retries until
 * success, lockout, or ~5min expiry), so on a retryable failure we keep the
 * caller on the MFA step. On a fatal failure (expired token / lockout) we flag
 * `mfaExpired` so the caller can return the user to the credentials step.
 */
export const verifyMfaLogin = async (
  mfaToken: string,
  code: string,
  rememberMe: boolean = false,
): Promise<FormResponse> => {
  if (!mfaToken || !code?.trim()) {
    return parseStringify({
      responseType: "error",
      message: "Please enter your verification code.",
      error: new Error("Incomplete MFA challenge"),
    });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/mfa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      body: JSON.stringify({ mfaToken, code: code.trim() }),
    });

    devLog("[MFA_VERIFY] Response status:", response.status);

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[MFA_VERIFY] Error response:", JSON.stringify(apiError));

      // Token-level failures (expired/revoked/locked/rate-limited) can't be
      // recovered by retrying a code — tell the caller to restart from creds.
      const fatal =
        (apiError.code && MFA_FATAL_CODES.has(apiError.code)) ||
        response.status === 401 ||
        response.status === 404 ||
        response.status === 410 ||
        response.status === 429;

      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(
          apiError.code,
          apiError.message,
          fatal
            ? "Your verification session has expired. Please sign in again."
            : "That code wasn't right. Please try again.",
        ),
        error: new Error(apiError.code || `HTTP ${response.status}`),
        data: { mfaExpired: fatal },
      });
    }

    const loginData: LoginResponse = await response.json();
    devLog("[MFA_VERIFY] Verified, establishing session for userId:", loginData.userId);

    // Mirror login()'s pre-session cleanup so a stale cookie/business never
    // leaks into the new session.
    await deleteAuthCookie();
    await deleteActiveBusinessCookie();
    await clearDestination();

    return await establishSessionFromLogin(loginData, rememberMe);
  } catch (error: any) {
    console.error("[MFA_VERIFY] Caught error:", error?.message, error?.cause);

    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message, "Could not verify the code. Please try again."),
      error: new Error(error?.message || "MFA verification failed"),
    });
  }
};

export const loginAsStaff = async (
  credentials: z.infer<typeof LoginSchema>,
  recaptchaToken?: string,
): Promise<FormResponse> => {
  const validatedData = LoginSchema.safeParse(credentials);
  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error("Incomplete credentials"),
    });
  }

  await deleteStaffAuthCookie();

  try {
    const loginBody: Record<string, string> = {
      email: validatedData.data.email,
      password: validatedData.data.password,
    };
    if (recaptchaToken) {
      loginBody.recaptchaToken = recaptchaToken;
      loginBody.recaptchaAction = "login";
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      body: JSON.stringify(loginBody),
    });

    if (!response.ok) {
      const apiError = await parseApiError(response);
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(
          apiError.code,
          apiError.message,
          "Authentication failed. Please try again.",
        ),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const loginData: LoginResponse = await response.json();

    // Reject customer tokens — this portal is staff-only. The JWT subject_type
    // claim is the canonical signal; internalRole presence is a belt-and-braces
    // fallback for tokens issued before subject_type rolled out.
    if (!isStaffToken(loginData.accessToken)) {
      return parseStringify({
        responseType: "error",
        message: "This portal is for Settlo staff only. Use the customer dashboard instead.",
        error: new Error("NOT_STAFF"),
      });
    }

    // Skip the Accounts Service profile fetch — staff users have the sentinel
    // accountId and no Accounts row exists for them. Skip NextAuth signIn —
    // staff sessions live entirely in the staffAuthToken cookie.
    await createStaffAuthToken(loginData);

    return parseStringify({
      responseType: "success",
      message: "Login successful",
    });
  } catch (error: any) {
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return parseStringify({
      responseType: "error",
      message: "An unexpected error occurred. Please try again.",
      error: new Error(error?.message || "Unexpected"),
    });
  }
};

export async function logoutStaff() {
  const token = await getStaffAuthToken();
  if (token?.accessToken || token?.refreshToken) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      };
      if (token.accessToken) {
        headers["Authorization"] = `Bearer ${token.accessToken}`;
      }
      await fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          refreshToken: token.refreshToken || undefined,
          logoutAll: false,
        }),
      });
    } catch {
      // API might be down — continue with local cleanup
    }
  }

  try {
    await deleteStaffAuthCookie();
  } catch {
    // Cookie deletion may fail outside Server Action context
  }
}

async function setSessionPersistence(rememberMe: boolean) {
  if (!rememberMe) return; // Session cookies are fine for non-remember-me

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const cookieOpts = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: isProduction ? ("strict" as const) : ("lax" as const),
    maxAge: THIRTY_DAYS,
  };

  // Re-set authToken chunks with maxAge
  // Check both plain and chunked variants
  const plainAuth = cookieStore.get("authToken")?.value;
  if (plainAuth) {
    cookieStore.set({ name: "authToken", value: plainAuth, ...cookieOpts });
  }
  for (let i = 0; i < 10; i++) {
    const chunk = cookieStore.get(`authToken.${i}`)?.value;
    if (!chunk) break;
    cookieStore.set({ name: `authToken.${i}`, value: chunk, ...cookieOpts });
  }

  const sessionCookieNames = [
    "authjs.session-token",
    "next-auth.session-token",
  ];
  for (const name of sessionCookieNames) {
    const value = cookieStore.get(name)?.value;
    if (value) {
      cookieStore.set({
        name,
        value,
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: "lax",
        path: "/",
        ...(rememberMe ? { maxAge: THIRTY_DAYS } : {}),
      });
    }
  }
}

export const oauthLogin = async (
  provider: "GOOGLE" | "APPLE",
  idToken: string,
): Promise<FormResponse> => {
  await deleteAuthCookie();
  await deleteActiveBusinessCookie();
  await clearDestination();

  try {
    devLog(`[OAUTH] Attempting ${provider} login`);

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/oauth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      body: JSON.stringify({ provider, idToken }),
    });

    devLog("[OAUTH] Response status:", response.status);

    // MFA challenge: OAuth sign-in for an MFA user now returns 412 +
    // { mfaRequired, mfaToken } with NO session, exactly like password login.
    // Route it into the same MFA step (verifyMfaLogin) by surfacing the token.
    if (response.status === 412) {
      const mfaToken = await extractMfaToken(response);
      devLog("[OAUTH] MFA required, mfaToken present:", !!mfaToken);
      if (mfaToken) {
        return parseStringify({
          responseType: "mfa_required",
          message: "Enter your authentication code to continue.",
          data: { mfaToken },
        });
      }
      return parseStringify({
        responseType: "error",
        message:
          "Multi-factor authentication is required but the challenge could not be started. Please try again.",
        error: new Error("MFA_TOKEN_MISSING"),
      });
    }

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[OAUTH] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Social sign-in failed. Please try again."),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const loginData: LoginResponse = await response.json();
    devLog("[OAUTH] Login successful, emailVerified:", loginData.emailVerified, "userId:", loginData.userId);

    if (!loginData.emailVerified) {
      await storePendingVerification({
        userId: loginData.userId,
        email: loginData.email,
        verificationResendToken: loginData.verificationResendToken,
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
      });

      return parseStringify({
        responseType: "needs_verification",
        message: "Please verify your email address.",
        data: { userId: loginData.userId, email: loginData.email },
      });
    }

    // Auto-accept a pending invitation BEFORE computing routing flags, so
    // /me/accounts reflects the new membership and hasInvitedAccess is correct.
    // Mirrors login() — without this an existing user accepting an invite via
    // Google/Apple is never accepted and gets trapped at /business-registration.
    const cookieStore = await cookies();
    const pendingInvite = cookieStore.get("pendingInvite")?.value;
    if (pendingInvite) {
      try {
        const res = await fetch(
          `${ACCOUNTS_SERVICE_URL}/api/v1/account-members/${pendingInvite}/accept`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${loginData.accessToken}`,
              "Content-Type": "application/json",
              ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
            },
          },
        );
        if (!res.ok) console.error("[OAUTH] auto-accept invite returned", res.status);
      } catch (e) {
        console.error("[OAUTH] auto-accept invite failed:", e);
      } finally {
        try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
      }
    }

    // Determine whether the user has access to any account they don't own.
    let hasInvitedAccess = false;
    try {
      const meRes = await fetch(`${ACCOUNTS_SERVICE_URL}/api/v1/me/accounts`, {
        headers: {
          Authorization: `Bearer ${loginData.accessToken}`,
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
      });
      if (meRes.ok) {
        const accounts = (await meRes.json()) as Array<{ owner?: boolean }>;
        hasInvitedAccess = Array.isArray(accounts) && accounts.some((a) => a?.owner === false);
      } else {
        console.error("[OAUTH] /me/accounts returned", meRes.status);
      }
    } catch (e) {
      console.error("[OAUTH] /me/accounts fetch failed:", e);
    }

    let profileData: any = {};
    let profileFetchError:
      | { status: number; code?: string; message?: string }
      | null = null;
    try {
      const profileResponse = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Content-Type": "application/json",
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
        },
      );
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
      } else {
        const apiError = await parseApiError(profileResponse);
        console.error("[OAUTH] Profile fetch failed:", profileResponse.status, apiError.code);
        devLog("[OAUTH] Profile fetch error body:", JSON.stringify(apiError));
        profileFetchError = {
          status: profileResponse.status,
          code: apiError.code,
          message: apiError.message,
        };
      }
    } catch (profileErr: any) {
      console.error("[OAUTH] Profile fetch error:", profileErr);
      profileFetchError = {
        status: 0,
        code: "NETWORK_ERROR",
        message: profileErr?.message,
      };
    }

    // See comment in login() — abort instead of defaulting the
    // onboarding flags to false, which would wrongly bounce returning
    // users to the business registration screen.
    if (profileFetchError) {
      await deleteAuthCookie();
      const fallback =
        profileFetchError.status >= 500 || profileFetchError.status === 0
          ? "We couldn't load your account right now. Please try again in a moment."
          : "We couldn't load your account. Please try again.";
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(
          profileFetchError.code,
          profileFetchError.message,
          fallback,
        ),
        error: new Error(
          profileFetchError.code || `HTTP ${profileFetchError.status}`,
        ),
      });
    }

    await createAuthTokenFromLogin(loginData, {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phoneNumber,
      pictureUrl: profileData.pictureUrl || profileData.avatar,
      isBusinessRegistrationComplete:
        profileData.isBusinessRegistrationComplete ?? false,
      isLocationRegistrationComplete:
        profileData.isLocationRegistrationComplete ?? false,
      countryId: profileData.countryId,
      countryCode: profileData.countryCode,
      theme: profileData.theme,
      hasInvitedAccess,
    });

    await signIn("credentials", {
      __preAuthenticated: "true",
      userId: loginData.userId,
      email: loginData.email,
      name: `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim(),
      firstName: profileData.firstName || "",
      lastName: profileData.lastName || "",
      phoneNumber: profileData.phoneNumber || "",
      accessToken: loginData.accessToken,
      refreshToken: loginData.refreshToken,
      emailVerified: String(loginData.emailVerified),
      isBusinessRegistrationComplete: String(
        profileData.isBusinessRegistrationComplete ?? false,
      ),
      isLocationRegistrationComplete: String(
        profileData.isLocationRegistrationComplete ?? false,
      ),
      countryId: profileData.countryId || "",
      countryCode: profileData.countryCode || "",
      accountId: loginData.accountId || "",
      theme: profileData.theme || "",
      pictureUrl: profileData.pictureUrl || profileData.avatar || "",
      redirect: false,
    });

    await setSessionPersistence(true);

    return parseStringify({
      responseType: "success",
      message: "Login successful",
    });
  } catch (error: any) {
    console.error("[OAUTH] Caught error:", {
      name: error?.name,
      message: error?.message,
      digest: error?.digest,
    });

    if (
      error instanceof Error &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message, "Social sign-in failed. Please try again."),
      error: new Error(error?.message || "OAuth failed"),
    });
  }
};

export const getUserById = async (
  userId: string | undefined,
): Promise<ExtendedUser> => {
  if (!userId) throw new Error("User data is required");

  const apiClient = new ApiClient();

  try {
    // userId here is the auth service user ID (authId in accounts service)
    const accountData: any = await apiClient.get(
      `/api/v1/accounts/by-auth-id/${userId}`,
    );

    // Map AccountResponse fields to ExtendedUser format
    return parseStringify({
      id: userId,
      name: accountData.fullName || `${accountData.firstName || ""} ${accountData.lastName || ""}`.trim(),
      email: accountData.email,
      firstName: accountData.firstName,
      lastName: accountData.lastName,
      bio: accountData.bio,
      avatar: accountData.pictureUrl,
      phoneNumber: accountData.phoneNumber,
      theme: accountData.theme,
      consent: null,
      emailVerified: accountData.active ? new Date() : null,
      isBusinessRegistrationComplete: accountData.isBusinessRegistrationComplete ?? false,
      isLocationRegistrationComplete: accountData.isLocationRegistrationComplete ?? false,
      accountId: accountData.id,
      countryId: accountData.countryId,
      countryCode: accountData.countryCode,
    } as ExtendedUser);
  } catch (error) {
    throw error;
  }
};

export const register = async (
  credentials: z.infer<typeof RegisterSchema>,
  recaptchaToken?: string,
  invitationMemberId?: string,
): Promise<FormResponse> => {
  const validatedData = RegisterSchema.safeParse(credentials);

  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    await deleteAuthCookie();

    let phoneRegion = "TZ";
    try {
      const parsed = parsePhoneNumber(validatedData.data.phoneNumber);
      if (parsed?.country) phoneRegion = parsed.country;
    } catch {
      // Fall back to TZ if parsing fails
    }

    const payload: Record<string, unknown> = {
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
      email: validatedData.data.email,
      password: validatedData.data.password,
      phoneNumber: validatedData.data.phoneNumber,
      phoneRegion,
      countryId: validatedData.data.countryId,
      gender: validatedData.data.gender,
      accountType: "OWNER",
      referredByCode: validatedData.data.referredByCode || undefined,
      invitationMemberId: invitationMemberId || undefined,
    };
    if (recaptchaToken) {
      payload.recaptchaToken = recaptchaToken;
      payload.recaptchaAction = "register";
    }

    const regResponse = await fetch(
      `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify(payload),
      },
    );

    if (!regResponse.ok) {
      const apiError = await parseApiError(regResponse);
      devLog("[REGISTER] Error response:", JSON.stringify(apiError));

      if (regResponse.status === 400 && apiError.errors) {
        const fieldMessages = Object.values(apiError.errors).join(", ");
        return parseStringify({
          responseType: "error",
          message: fieldMessages || getUIErrorMessage(apiError.code, apiError.message),
          error: new Error(apiError.code || "Validation error"),
        });
      }

      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Registration failed. Please try again."),
        error: new Error(apiError.code || `HTTP ${regResponse.status}`),
      });
    }

    const regData: RegisterResponse = await regResponse.json();

    // Only stash a pending-verification session when the backend actually
    // requires email verification. Invited signups are created already-verified
    // (the invite link proved email ownership), so there is nothing to verify and
    // storing a pending-verification session would wrongly divert them to verify.
    if (regData.emailVerificationRequired) {
      // Auto-login to get verificationResendToken
      try {
        const loginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
          body: JSON.stringify({
            email: validatedData.data.email,
            password: validatedData.data.password,
          }),
        });

        if (loginResponse.ok) {
          const loginData: LoginResponse = await loginResponse.json();

          await storePendingVerification({
            userId: loginData.userId || regData.authId,
            email: loginData.email || regData.email,
            verificationResendToken: loginData.verificationResendToken,
            accessToken: loginData.accessToken,
            refreshToken: loginData.refreshToken,
          });
        } else {
          // Login failed after registration - store auth ID for verification
          await storePendingVerification({
            userId: regData.authId,
            email: regData.email,
          });
        }
      } catch {
        await storePendingVerification({
          userId: regData.authId,
          email: regData.email,
        });
      }
    }

    return parseStringify({
      responseType: "success",
      message: regData.emailVerificationRequired
        ? "Registration successful! Please check your email for a verification code."
        : "Account created successfully.",
      data: {
        userId: regData.authId,
        email: regData.email,
        emailVerificationRequired: regData.emailVerificationRequired,
      },
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error.message || "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const verifyEmailCode = async (code: string): Promise<FormResponse> => {
  try {
    const pendingVerification = await getPendingVerification();

    if (!pendingVerification) {
      return parseStringify({
        responseType: "error",
        message: "Verification session expired. Please log in again.",
        error: new Error("No pending verification"),
      });
    }

    // If we have a verificationResendToken, use the verify-and-login endpoint
    if (pendingVerification.verificationResendToken) {
      const response = await fetch(
        `${AUTH_SERVICE_URL}/auth/verify/email/code/verify-and-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pendingVerification.verificationResendToken}`,
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
          body: JSON.stringify({ code }),
        },
      );

      if (!response.ok) {
        const apiError = await parseApiError(response);
        devLog("[VERIFY_EMAIL] Error response:", JSON.stringify(apiError));
        return parseStringify({
          responseType: "error",
          message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired verification code. Please try again."),
          error: new Error(apiError.code || "Verification failed"),
        });
      }

      const verifyData: VerifyAndLoginResponse = await response.json();

      // Fetch user profile
      let profileData: any = {};
      let profileFetchError:
        | { status: number; code?: string; message?: string }
        | null = null;
      try {
        const profileResponse = await fetch(
          `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${verifyData.accountId}`,
          {
            headers: {
              Authorization: `Bearer ${verifyData.accessToken}`,
              "Content-Type": "application/json",
              ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
            },
          },
        );
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
        } else {
          const apiError = await parseApiError(profileResponse);
          console.error("[VERIFY_EMAIL] Profile fetch failed:", profileResponse.status, apiError.code);
          devLog("[VERIFY_EMAIL] Profile fetch error body:", JSON.stringify(apiError));
          profileFetchError = {
            status: profileResponse.status,
            code: apiError.code,
            message: apiError.message,
          };
        }
      } catch (profileErr: any) {
        console.error("[VERIFY_EMAIL] Profile fetch error:", profileErr);
        profileFetchError = {
          status: 0,
          code: "NETWORK_ERROR",
          message: profileErr?.message,
        };
      }

      // See comment in login() — without the profile we can't make the
      // right onboarding routing decision, so fail loudly and let the
      // user retry rather than dropping them on business-registration.
      if (profileFetchError) {
        const fallback =
          profileFetchError.status >= 500 || profileFetchError.status === 0
            ? "We couldn't load your account right now. Please try again in a moment."
            : "We couldn't load your account. Please try again.";
        return parseStringify({
          responseType: "error",
          message: getUIErrorMessage(
            profileFetchError.code,
            profileFetchError.message,
            fallback,
          ),
          error: new Error(
            profileFetchError.code || `HTTP ${profileFetchError.status}`,
          ),
        });
      }

      // Defense-in-depth: an invited user who still had to verify (e.g. skip
      // verification didn't apply) must come out with invited access, exactly
      // like the login() path — otherwise middleware traps them at onboarding.
      const cookieStore = await cookies();
      const pendingInvite = cookieStore.get("pendingInvite")?.value;
      if (pendingInvite) {
        try {
          const acceptRes = await fetch(
            `${ACCOUNTS_SERVICE_URL}/api/v1/account-members/${pendingInvite}/accept`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${verifyData.accessToken}`,
                "Content-Type": "application/json",
                ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
              },
            },
          );
          if (!acceptRes.ok)
            console.error("[VERIFY_EMAIL] auto-accept invite returned", acceptRes.status);
        } catch (e) {
          console.error("[VERIFY_EMAIL] auto-accept invite failed:", e);
        } finally {
          try { cookieStore.delete("pendingInvite"); } catch { /* ok */ }
        }
      }

      let hasInvitedAccess = false;
      try {
        const meRes = await fetch(`${ACCOUNTS_SERVICE_URL}/api/v1/me/accounts`, {
          headers: {
            Authorization: `Bearer ${verifyData.accessToken}`,
            "Content-Type": "application/json",
            ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
          },
        });
        if (meRes.ok) {
          const accounts = (await meRes.json()) as Array<{ owner?: boolean }>;
          hasInvitedAccess =
            Array.isArray(accounts) && accounts.some((a) => a?.owner === false);
        } else {
          console.error("[VERIFY_EMAIL] /me/accounts returned", meRes.status);
        }
      } catch (e) {
        console.error("[VERIFY_EMAIL] /me/accounts fetch failed:", e);
      }

      // Clear pending verification before setting new cookies to avoid 431
      await clearPendingVerification();

      // Create auth token with full access
      await createAuthTokenFromLogin(
        {
          accessToken: verifyData.accessToken,
          refreshToken: verifyData.refreshToken,
          tokenType: verifyData.tokenType,
          expiresIn: verifyData.expiresIn,
          accessTokenExpiresAt: verifyData.accessTokenExpiresAt,
          refreshTokenExpiresAt: verifyData.refreshTokenExpiresAt,
          userId: verifyData.userId,
          accountId: verifyData.accountId,
          email: verifyData.email,
          emailVerified: true,
        },
        {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
          pictureUrl: profileData.pictureUrl || profileData.avatar,
          isBusinessRegistrationComplete:
            profileData.isBusinessRegistrationComplete ??
            profileData.businessComplete ??
            false,
          isLocationRegistrationComplete:
            profileData.isLocationRegistrationComplete ??
            profileData.locationComplete ??
            false,
          countryId: profileData.countryId || profileData.country,
          countryCode: profileData.countryCode,
          theme: profileData.theme,
          hasInvitedAccess,
        },
      );

      // Create NextAuth session
      await signIn("credentials", {
        __preAuthenticated: "true",
        userId: verifyData.userId,
        email: verifyData.email,
        name: `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim(),
        firstName: profileData.firstName || "",
        lastName: profileData.lastName || "",
        phoneNumber: profileData.phoneNumber || "",
        accessToken: verifyData.accessToken,
        refreshToken: verifyData.refreshToken,
        emailVerified: "true",
        isBusinessRegistrationComplete: String(
          profileData.isBusinessRegistrationComplete ?? false,
        ),
        isLocationRegistrationComplete: String(
          profileData.isLocationRegistrationComplete ?? false,
        ),
        countryId: profileData.countryId || "",
        countryCode: profileData.countryCode || "",
        accountId: verifyData.accountId || "",
        theme: profileData.theme || "",
        pictureUrl: profileData.pictureUrl || "",
        redirect: false,
      });

      return parseStringify({
        responseType: "success",
        message: "Email verified successfully!",
      });
    }

    // Fallback: standalone verification (no verificationResendToken)
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/verify/email/code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({
          userId: pendingVerification.userId,
          code,
        }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[VERIFY_EMAIL_STANDALONE] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired verification code. Please try again."),
        error: new Error(apiError.code || "Verification failed"),
      });
    }

    await clearPendingVerification();

    return parseStringify({
      responseType: "success",
      message:
        "Email verified successfully! Please log in to continue.",
      data: { requiresLogin: true },
    });
  } catch (error: any) {
    console.error("[VERIFY_EMAIL] Caught error:", error?.message, error?.cause);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const verifyEmailToken = async (token: string): Promise<FormResponse> => {
  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/verify/email/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({ token }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired verification link. Please request a new code."),
        error: new Error(apiError.code || "Token verification failed"),
      });
    }

    const data = await response.json();

    // Auto-login after token verification: call login would require password.
    // Instead, redirect to login with a success message.
    return parseStringify({
      responseType: "success",
      message: "Email verified successfully! Please log in to continue.",
      data: { userId: data.userId, email: data.email, requiresLogin: true },
    });
  } catch (error: any) {
    console.error("[VERIFY_EMAIL_TOKEN] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const verifyResetToken = async (token: string): Promise<FormResponse> => {
  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/verify/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({ token }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired reset link. Please request a new one."),
        error: new Error(apiError.code || "Token verification failed"),
      });
    }

    const data: ResetPasswordVerifyResponse = await response.json();

    return parseStringify({
      responseType: "success",
      message: "Link verified. You can now set your new password.",
      data: { resetToken: data.resetToken },
    });
  } catch (error: any) {
    console.error("[VERIFY_RESET_TOKEN] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const resendVerificationCode = async (): Promise<FormResponse> => {
  try {
    const pendingVerification = await getPendingVerification();

    if (!pendingVerification?.userId) {
      return parseStringify({
        responseType: "error",
        message: "Verification session expired. Please register or log in again.",
        error: new Error("No pending verification"),
      });
    }

    // Use the userId-based resend endpoint (no auth required)
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/verify/email/resend/${pendingVerification.userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[RESEND_CODE] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Failed to resend verification code."),
        error: new Error(apiError.code || "Resend failed"),
      });
    }

    return parseStringify({
      responseType: "success",
      message: "Verification code sent! Please check your email.",
    });
  } catch (error: any) {
    console.error("[RESEND_CODE] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const resetPassword = async (
  email: z.infer<typeof ResetPasswordSchema>,
): Promise<FormResponse> => {
  const validateEmail = ResetPasswordSchema.safeParse(email);

  if (!validateEmail.success) {
    return parseStringify({
      responseType: "error",
      message: "Please enter a valid email address.",
      error: new Error(validateEmail.error.message),
    });
  }

  const emailAddress = validateEmail.data.email;
  // Neutral, account-enumeration-safe copy. The backend always returns a
  // uniform 200 regardless of whether the account exists, so the UX must
  // never reveal a USER_NOT_FOUND / "no account" distinction.
  const neutralSuccess = {
    responseType: "success",
    message:
      "If an account exists for this email, a reset code has been sent.",
    // Thread the EMAIL the user typed into the verify-code step. The backend
    // no longer returns a userId from this endpoint.
    data: { email: emailAddress },
  };

  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({
          identifier: emailAddress,
        }),
      },
    );

    // A USER_NOT_FOUND (or any not-ok) must still advance to the code step
    // with the neutral message so existence of the account can't be probed.
    // Only genuine infrastructure failures (5xx) should surface an error.
    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[RESET_PASSWORD] Non-ok response:", JSON.stringify(apiError));
      if (response.status >= 500) {
        return parseStringify({
          responseType: "error",
          message: getUIErrorMessage(apiError.code, apiError.message, "Failed to send password reset code."),
          error: new Error(apiError.code || `HTTP ${response.status}`),
        });
      }
      return parseStringify(neutralSuccess);
    }

    return parseStringify(neutralSuccess);
  } catch (error: any) {
    console.error("[RESET_PASSWORD] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const verifyResetCode = async (
  identifier: string,
  code: string,
): Promise<FormResponse> => {
  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/verify/code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({ identifier, code }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[VERIFY_RESET_CODE] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired code. Please try again."),
        error: new Error(apiError.code || "Code verification failed"),
      });
    }

    const data: ResetPasswordVerifyResponse = await response.json();

    return parseStringify({
      responseType: "success",
      message: "Code verified successfully.",
      data: { resetToken: data.resetToken },
    });
  } catch (error: any) {
    console.error("[VERIFY_RESET_CODE] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const confirmNewPassword = async (
  token: string,
  newPassword: string,
): Promise<FormResponse> => {
  const validatedPassword = NewPasswordSchema.safeParse({
    password: newPassword,
  });

  if (!validatedPassword.success) {
    return parseStringify({
      responseType: "error",
      message: "Password must be at least 8 characters long.",
      error: new Error(validatedPassword.error.message),
    });
  }

  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        body: JSON.stringify({
          token,
          newPassword: validatedPassword.data.password,
        }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      devLog("[CONFIRM_PASSWORD] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Failed to reset password. Please try again."),
        error: new Error(apiError.code || "Password reset failed"),
      });
    }

    return parseStringify({
      responseType: "success",
      message:
        "Password reset successfully! Please log in with your new password.",
    });
  } catch (error: any) {
    console.error("[CONFIRM_PASSWORD] Caught error:", error?.message);
    return parseStringify({
      responseType: "error",
      message: getUIErrorMessage(null, error?.message),
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const updateUser = async (
  credentials: z.infer<typeof UpdateUserSchema>,
): Promise<FormResponse> => {
  const validatedData = UpdateUserSchema.safeParse(credentials);

  if (!validatedData.success) {
    return parseStringify({
      responseType: "error",
      message: "Please fill in all the fields marked with * before proceeding",
      error: new Error(validatedData.error.message),
    });
  }

  try {
    const authToken = await getAuthToken();
    if (!authToken?.accountId) {
      return parseStringify({
        responseType: "error",
        message: "Session expired, please login to proceed.",
        error: new Error("No auth token or account ID"),
      });
    }

    // Map frontend field names to Accounts Service field names
    const payload: Record<string, unknown> = {
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
    };
    if (validatedData.data.bio !== undefined) payload.bio = validatedData.data.bio;
    if (validatedData.data.email !== undefined) payload.email = validatedData.data.email;
    if (validatedData.data.phoneNumber !== undefined) payload.phoneNumber = validatedData.data.phoneNumber;
    if (validatedData.data.avatar !== undefined) payload.pictureUrl = validatedData.data.avatar;
    if (validatedData.data.country !== undefined) payload.countryId = validatedData.data.country;

    const apiClient = new ApiClient();
    await apiClient.put(`/api/v1/accounts/${authToken.accountId}`, payload);

    // Update local auth token with new profile data
    await updateAuthToken({
      ...authToken,
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
      ...(validatedData.data.avatar !== undefined && { pictureUrl: validatedData.data.avatar }),
    });

    revalidatePath("/", "layout");

    return parseStringify({
      responseType: "success",
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("[UPDATE_USER] Error:", error);
    return parseStringify({
      responseType: "error",
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

// Staff-specific auth endpoints used to live here
// (staffResetPassword / staffVerifyResetCode / staffConfirmNewPassword /
// staffSelectBusiness). Business staff with dashboard access are regular
// `SubjectType.USER`s and go through the same password-reset and login flows
// as account owners. `SubjectType.STAFF` still exists in the Auth Service, but
// it is reserved for POS/device tokens — bulk-minted, carried via X-Staff-Token,
// and never present in the browser — so the dashboard never logs in a
// `SubjectType.STAFF`. POS-only staff don't have Auth-Service credentials at
// all — their PIN is verified locally on the paired device.


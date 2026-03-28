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
  deleteActiveBusinessCookie,
  deleteActiveLocationCookie,
  deleteAuthCookie,
  getAuthToken,
  getUser,
  storePendingVerification,
  getPendingVerification,
  clearPendingVerification,
  updateAuthToken,
} from "@/lib/auth-utils";
import ApiClient from "@/lib/settlo-api-client";
import { parseApiError, getUIErrorMessage } from "@/lib/settlo-api-error-handler";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { deleteActiveWarehouseCookie } from "./warehouse/current-warehouse-action";

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || process.env.SERVICE_URL || "";
const ACCOUNTS_SERVICE_URL =
  process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL || "";

export async function logout() {
  // Always clear local state, regardless of whether the API call succeeds
  const authToken = await getAuthToken();

  // Best-effort: call the auth service to revoke tokens server-side
  if (authToken?.accessToken || authToken?.refreshToken) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
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

export const login = async (
  credentials: z.infer<typeof LoginSchema>,
  rememberMe: boolean = false,
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
  await deleteActiveLocationCookie();
  await deleteActiveWarehouseCookie();

  try {
    console.log("[LOGIN] Attempting login to:", `${AUTH_SERVICE_URL}/auth/login`);

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: validatedData.data.email,
        password: validatedData.data.password,
      }),
    });

    console.log("[LOGIN] Auth response status:", response.status);

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[LOGIN] Auth error response:", JSON.stringify(apiError));

      if (response.status === 412) {
        return parseStringify({
          responseType: "error",
          message: getUIErrorMessage(apiError.code, apiError.message),
          error: new Error(apiError.code || "MFA required"),
          data: { mfaRequired: true, mfaToken: (apiError as any).mfaToken },
        });
      }

      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Authentication failed. Please try again."),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const loginData: LoginResponse = await response.json();
    console.log("[LOGIN] Login successful, emailVerified:", loginData.emailVerified, "userId:", loginData.userId);

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
        message:
          "Please verify your email address. Check your inbox for a verification code.",
        data: {
          userId: loginData.userId,
          email: loginData.email,
        },
      });
    }

    let profileData: any = {};
    try {
      console.log("[LOGIN] Fetching profile from:", `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`);
      const profileResponse = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      console.log("[LOGIN] Profile response status:", profileResponse.status);
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
        console.log("[LOGIN] Profile fetched for:", profileData.firstName, profileData.lastName);
      } else {
        const profileError = await profileResponse.text().catch(() => "");
        console.error("[LOGIN] Profile fetch failed:", profileResponse.status, profileError);
      }
    } catch (profileErr) {
      console.error("[LOGIN] Profile fetch error:", profileErr);
    }

    console.log("[LOGIN] Creating auth token cookie...");
    await createAuthTokenFromLogin(loginData, {
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
    });

    // Verify the cookie was actually set
    const verifyToken = await getAuthToken();
    console.log("[LOGIN] Auth token cookie set:", {
      hasAccessToken: !!verifyToken?.accessToken,
      accessTokenLength: verifyToken?.accessToken?.length,
      hasRefreshToken: !!verifyToken?.refreshToken,
      emailVerified: verifyToken?.emailVerified,
      bizComplete: verifyToken?.isBusinessRegistrationComplete,
      locComplete: verifyToken?.isLocationRegistrationComplete,
    });

    console.log("[LOGIN] Signing into NextAuth session...");
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
      emailVerified: "true",
      isBusinessRegistrationComplete: String(
        profileData.isBusinessRegistrationComplete ??
          profileData.businessComplete ??
          false,
      ),
      isLocationRegistrationComplete: String(
        profileData.isLocationRegistrationComplete ??
          profileData.locationComplete ??
          false,
      ),
      countryId: profileData.countryId || profileData.country || "",
      countryCode: profileData.countryCode || "",
      accountId: loginData.accountId || "",
      theme: profileData.theme || "",
      pictureUrl: profileData.pictureUrl || profileData.avatar || "",
      redirect: false,
    });
    console.log("[LOGIN] NextAuth signIn completed");

    // Verify cookie survived signIn (event handler might overwrite)
    const postSignInToken = await getAuthToken();
    console.log("[LOGIN] Auth token AFTER signIn:", {
      hasAccessToken: !!postSignInToken?.accessToken,
      accessTokenLength: postSignInToken?.accessToken?.length,
      hasRefreshToken: !!postSignInToken?.refreshToken,
    });

    await setSessionPersistence(rememberMe);

    return parseStringify({
      responseType: "success",
      message: "Login successful",
    });
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

async function setSessionPersistence(rememberMe: boolean) {
  if (!rememberMe) return; // Session cookies are fine for non-remember-me

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
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
        secure: isProduction,
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
  await deleteActiveLocationCookie();
  await deleteActiveWarehouseCookie();

  try {
    console.log(`[OAUTH] Attempting ${provider} login`);

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/oauth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, idToken }),
    });

    console.log("[OAUTH] Response status:", response.status);

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[OAUTH] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Social sign-in failed. Please try again."),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const loginData: LoginResponse = await response.json();
    console.log("[OAUTH] Login successful, emailVerified:", loginData.emailVerified, "userId:", loginData.userId);

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

    let profileData: any = {};
    try {
      const profileResponse = await fetch(
        `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${loginData.accountId}`,
        {
          headers: {
            Authorization: `Bearer ${loginData.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (profileResponse.ok) {
        profileData = await profileResponse.json();
      }
    } catch {
      // Best-effort
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

    const payload = {
      firstName: validatedData.data.firstName,
      lastName: validatedData.data.lastName,
      email: validatedData.data.email,
      password: validatedData.data.password,
      phoneNumber: validatedData.data.phoneNumber,
      phoneRegion,
      countryId: validatedData.data.countryId,
      accountType: "OWNER",
      referredByCode: validatedData.data.referredByCode || undefined,
    };

    const regResponse = await fetch(
      `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/register`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!regResponse.ok) {
      const apiError = await parseApiError(regResponse);
      console.log("[REGISTER] Error response:", JSON.stringify(apiError));

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

    // Auto-login to get verificationResendToken
    try {
      const loginResponse = await fetch(`${AUTH_SERVICE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    return parseStringify({
      responseType: "success",
      message:
        "Registration successful! Please check your email for a verification code.",
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
          },
          body: JSON.stringify({ code }),
        },
      );

      if (!response.ok) {
        const apiError = await parseApiError(response);
        console.log("[VERIFY_EMAIL] Error response:", JSON.stringify(apiError));
        return parseStringify({
          responseType: "error",
          message: getUIErrorMessage(apiError.code, apiError.message, "Invalid or expired verification code. Please try again."),
          error: new Error(apiError.code || "Verification failed"),
        });
      }

      const verifyData: VerifyAndLoginResponse = await response.json();

      // Fetch user profile
      let profileData: any = {};
      try {
        const profileResponse = await fetch(
          `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${verifyData.accountId}`,
          {
            headers: {
              Authorization: `Bearer ${verifyData.accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (profileResponse.ok) {
          profileData = await profileResponse.json();
        }
      } catch {
        // Best-effort
      }

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

      await clearPendingVerification();

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingVerification.userId,
          code,
        }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[VERIFY_EMAIL_STANDALONE] Error response:", JSON.stringify(apiError));
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
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[RESEND_CODE] Error response:", JSON.stringify(apiError));
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

  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: validateEmail.data.email,
        }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[RESET_PASSWORD] Error response:", JSON.stringify(apiError));
      return parseStringify({
        responseType: "error",
        message: getUIErrorMessage(apiError.code, apiError.message, "Failed to send password reset code."),
        error: new Error(apiError.code || `HTTP ${response.status}`),
      });
    }

    const data = await response.json();

    return parseStringify({
      responseType: "success",
      message:
        "A password reset code has been sent to your email address.",
      data: { userId: data.userId },
    });
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
  userId: string,
  code: string,
): Promise<FormResponse> => {
  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/auth/password/reset/verify/code`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[VERIFY_RESET_CODE] Error response:", JSON.stringify(apiError));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: validatedPassword.data.password,
        }),
      },
    );

    if (!response.ok) {
      const apiError = await parseApiError(response);
      console.log("[CONFIRM_PASSWORD] Error response:", JSON.stringify(apiError));
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
    const user = await getUser();

    const apiClient = new ApiClient();
    await apiClient.put(`/api/users/${user?.id}`, validatedData.data);

    return parseStringify({
      responseType: "success",
      message: "Profile updated successful",
    });
  } catch (error) {
    console.error("Error is: ", error);
    return parseStringify({
      responseType: "error",
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
};

export const resendVerificationEmail = async (
  _name: any,
  _email: any,
): Promise<FormResponse> => {
  return resendVerificationCode();
};

import "server-only";

import { signIn } from "@/auth";
import { createAuthTokenFromLogin } from "@/lib/auth-utils";
import { LoginResponse } from "@/types/types";

export interface CustomerProfileFields {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  pictureUrl?: string | null;
  isBusinessRegistrationComplete?: boolean;
  isLocationRegistrationComplete?: boolean;
  hasInvitedAccess?: boolean;
  countryId?: string;
  countryCode?: string;
  theme?: string | null;
}

/** The signed-in identity's own row in the account — GET /api/v1/me/profile. */
export interface CallerIdentity {
  /** OWNER | MEMBER | STAFF | ACCOUNT. */
  relationship?: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  pictureUrl?: string | null;
}

/**
 * The caller's OWN identity in the account they just logged into.
 *
 * `GET /accounts/{accountId}` returns the account HOLDER — invited members and
 * dashboard-staff resolve to the owner's account, so using it for the display
 * name greeted every one of them as the owner. `/me/profile` resolves the
 * caller's own `account_members` / `staff` row instead (and still answers with
 * the holder for owners and for impersonation tokens).
 *
 * Best-effort: returns null on any failure, so a hiccup here degrades the name
 * rather than blocking the login.
 */
export async function fetchCallerIdentity(
  accessToken: string,
): Promise<CallerIdentity | null> {
  const ACCOUNTS_SERVICE_URL = process.env.ACCOUNTS_SERVICE_URL || "";
  const WHITELABEL_CLIENT_ID =
    process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID || "";
  try {
    const res = await fetch(`${ACCOUNTS_SERVICE_URL}/api/v1/me/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[SESSION] /me/profile returned", res.status);
      return null;
    }
    return (await res.json()) as CallerIdentity;
  } catch (e) {
    console.error("[SESSION] /me/profile fetch failed:", e);
    return null;
  }
}

/**
 * Overlay the caller's own identity fields on the account profile, leaving the
 * account-context fields (onboarding flags, country, theme) untouched — those
 * belong to the account, not the person. The avatar is the caller's own too
 * (members and staff each have a picture_url), never the owner's inherited.
 */
export function withCallerIdentity(
  profile: CustomerProfileFields,
  identity: CallerIdentity | null,
): CustomerProfileFields {
  if (!identity?.firstName && !identity?.lastName) return profile;
  return {
    ...profile,
    firstName: identity.firstName ?? "",
    lastName: identity.lastName ?? "",
    phoneNumber: identity.phoneNumber ?? profile.phoneNumber,
    pictureUrl: identity.pictureUrl ?? null,
  };
}

/**
 * Establish a first-party customer session: write the chunked `authToken`
 * cookie AND a NextAuth credentials session. Shared by the normal email/
 * password login (`lib/actions/auth-actions.tsx`) and the staff-impersonation
 * consume route (`app/impersonate/consume/route.ts`), so both paths produce an
 * identical session — the only difference is the impersonating markers stamped
 * on the cookie via `opts`.
 *
 * The identity half of `profile` (name/phone/picture) is re-resolved here from
 * `/me/profile` so an invited member or dashboard-staff user is greeted by
 * their own name instead of the account owner's.
 *
 * Must be called from a server action or route handler (it sets cookies and
 * runs NextAuth `signIn`).
 */
export async function establishCustomerSession(
  loginData: LoginResponse,
  accountProfile: CustomerProfileFields,
  opts?: { impersonating?: boolean; impersonatorId?: string | null },
): Promise<void> {
  const profile = withCallerIdentity(
    accountProfile,
    await fetchCallerIdentity(loginData.accessToken),
  );

  await createAuthTokenFromLogin(loginData, profile, opts);

  await signIn("credentials", {
    __preAuthenticated: "true",
    userId: loginData.userId,
    email: loginData.email,
    name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    phoneNumber: profile.phoneNumber || "",
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    emailVerified: "true",
    isBusinessRegistrationComplete: String(
      profile.isBusinessRegistrationComplete ?? false,
    ),
    isLocationRegistrationComplete: String(
      profile.isLocationRegistrationComplete ?? false,
    ),
    hasInvitedAccess: String(profile.hasInvitedAccess ?? false),
    countryId: profile.countryId || "",
    countryCode: profile.countryCode || "",
    accountId: loginData.accountId || "",
    theme: profile.theme || "",
    pictureUrl: profile.pictureUrl || "",
    redirect: false,
  });
}

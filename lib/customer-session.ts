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
  countryId?: string;
  countryCode?: string;
  theme?: string | null;
}

/**
 * Establish a first-party customer session: write the chunked `authToken`
 * cookie AND a NextAuth credentials session. Shared by the normal email/
 * password login (`lib/actions/auth-actions.tsx`) and the staff-impersonation
 * consume route (`app/impersonate/consume/route.ts`), so both paths produce an
 * identical session — the only difference is the impersonating markers stamped
 * on the cookie via `opts`.
 *
 * Must be called from a server action or route handler (it sets cookies and
 * runs NextAuth `signIn`).
 */
export async function establishCustomerSession(
  loginData: LoginResponse,
  profile: CustomerProfileFields,
  opts?: { impersonating?: boolean; impersonatorId?: string | null },
): Promise<void> {
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
    countryId: profile.countryId || "",
    countryCode: profile.countryCode || "",
    accountId: loginData.accountId || "",
    theme: profile.theme || "",
    pictureUrl: profile.pictureUrl || "",
    redirect: false,
  });
}

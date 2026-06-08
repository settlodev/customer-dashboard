import { NextRequest, NextResponse } from "next/server";

import { establishCustomerSession } from "@/lib/customer-session";
import { openHandoff } from "@/lib/impersonation-handoff";
import { extractEmail, extractSubjectId } from "@/lib/jwt-utils";
import { LoginResponse } from "@/types/types";

// Node runtime: uses node:crypto (openHandoff) + NextAuth signIn + cookies.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCOUNTS_SERVICE_URL =
  process.env.ACCOUNTS_SERVICE_URL || process.env.SERVICE_URL || "";
const WHITELABEL_CLIENT_ID = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID || "";

/**
 * Customer-origin landing for staff impersonation ("login on behalf"). The
 * admin action opens `…/impersonate/consume?h=<sealed blob>` in a new tab; we
 * unseal the minted customer tokens, fetch the customer profile (so the session
 * carries the real onboarding/geography state — impersonation respects the
 * customer's actual gates), establish a first-party session marked
 * `impersonating`, and drop into the dashboard. The `?h=` param is dropped by
 * the redirect, so the blob never lingers in history.
 */
export async function GET(request: NextRequest) {
  const handoff = openHandoff(request.nextUrl.searchParams.get("h"));
  if (!handoff) {
    return NextResponse.redirect(
      new URL("/login?impersonation=expired", request.url),
    );
  }

  // userId + email aren't in the impersonation response — decode from the JWT.
  const userId = extractSubjectId(handoff.accessToken) ?? "";
  const email = extractEmail(handoff.accessToken) ?? "";

  let profile: Record<string, any> = {};
  try {
    const res = await fetch(
      `${ACCOUNTS_SERVICE_URL}/api/v1/accounts/${handoff.accountId}`,
      {
        headers: {
          Authorization: `Bearer ${handoff.accessToken}`,
          "Content-Type": "application/json",
          ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
        },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return NextResponse.redirect(
        new URL("/login?impersonation=error", request.url),
      );
    }
    profile = await res.json();
  } catch {
    return NextResponse.redirect(
      new URL("/login?impersonation=error", request.url),
    );
  }

  const loginData: LoginResponse = {
    accessToken: handoff.accessToken,
    refreshToken: handoff.refreshToken,
    tokenType: "Bearer",
    expiresIn: 0,
    accessTokenExpiresAt: "",
    refreshTokenExpiresAt: "",
    userId,
    accountId: handoff.accountId,
    appId: handoff.appId,
    email,
    emailVerified: true,
    impersonating: true,
    impersonatorId: handoff.impersonatorId,
  };

  await establishCustomerSession(
    loginData,
    {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phoneNumber,
      pictureUrl: profile.pictureUrl || profile.avatar,
      isBusinessRegistrationComplete:
        profile.isBusinessRegistrationComplete ?? profile.businessComplete,
      isLocationRegistrationComplete:
        profile.isLocationRegistrationComplete ?? profile.locationComplete,
      countryId: profile.countryId || profile.country,
      countryCode: profile.countryCode,
      theme: profile.theme,
    },
    { impersonating: true, impersonatorId: handoff.impersonatorId ?? null },
  );

  return NextResponse.redirect(new URL("/dashboard", request.url));
}

"use server";

import { headers } from "next/headers";

import { getStaffAuthToken } from "@/lib/auth-utils";
import { sealHandoff } from "@/lib/impersonation-handoff";
import { parseStringify } from "@/lib/utils";
import { FormResponse, InternalRole, LoginResponse } from "@/types/types";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "";
const WHITELABEL_CLIENT_ID = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID || "";

/**
 * Roles allowed to start an impersonation session. The auth service is the
 * authoritative gate (`/auth/impersonate` re-checks `canImpersonate`); this is
 * a UX guard so the button fails fast with a clear message.
 */
const IMPERSONATE_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

/**
 * Resolve the customer origin to hand the session off to. The admin and
 * customer dashboards are the same app on different hosts (e.g.
 * admin.settlo.co.tz vs beta.settlo.co.tz), and that mapping isn't a simple
 * prefix strip — so we prefer the canonical public app URL, which is the same
 * value already used for email + share links (`NEXT_PUBLIC_APP_URL`):
 *   1. `NEXT_PUBLIC_CUSTOMER_HOST` — explicit override, if set.
 *   2. `NEXT_PUBLIC_APP_URL`       — the customer-facing base URL per env
 *      (https://beta.settlo.co.tz in prod, http://localhost:3000 in dev).
 *   3. Fallback: strip a leading `admin.` off the request host — only correct
 *      when admin/customer share a base domain (e.g. admin.localhost).
 */
async function customerOrigin(): Promise<string> {
  const hdrs = await headers();
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  const toOrigin = (v: string): string =>
    (/^https?:\/\//.test(v) ? v : `${proto}://${v}`).replace(/\/+$/, "");

  const override = process.env.NEXT_PUBLIC_CUSTOMER_HOST;
  if (override) return toOrigin(override);
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return toOrigin(process.env.NEXT_PUBLIC_APP_URL);
  }

  const reqHost = hdrs.get("host") || "";
  return `${proto}://${reqHost.replace(/^admin\./, "")}`;
}

/**
 * Staff "log in as" — mints a short-lived customer session for `accountId` and
 * returns a one-time URL on the customer origin that establishes it. The button
 * opens that URL in a new tab; the `/impersonate/consume` route there turns the
 * sealed blob into a real first-party session. Raw tokens never travel in the
 * URL — only the AES-GCM ciphertext from {@link sealHandoff}.
 */
export async function impersonateAccount(
  accountId: string,
  reason?: string,
): Promise<FormResponse<{ url: string }>> {
  const staff = await getStaffAuthToken();
  if (!staff?.accessToken) {
    return parseStringify({
      responseType: "error",
      message: "Your staff session has expired. Sign in again to continue.",
    });
  }

  const role = staff.internalRole;
  if (!role || !IMPERSONATE_ROLES.includes(role)) {
    return parseStringify({
      responseType: "error",
      message: "Your role isn't permitted to log in as customers.",
    });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/impersonate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${staff.accessToken}`,
        ...(WHITELABEL_CLIENT_ID ? { "X-Client-Id": WHITELABEL_CLIENT_ID } : {}),
      },
      body: JSON.stringify({
        targetAccountId: accountId,
        ...(reason && reason.trim() ? { reason: reason.trim() } : {}),
      }),
    });

    if (!response.ok) {
      let message =
        "Couldn't start the impersonation session. Please try again.";
      if (response.status === 401 || response.status === 403) {
        message = "You're not authorized to impersonate this account.";
      } else if (response.status === 404) {
        message = "That account no longer exists or has no owner.";
      }
      return parseStringify({
        responseType: "error",
        message,
        error: new Error(`HTTP ${response.status}`),
      });
    }

    const data: LoginResponse = await response.json();
    if (!data.accessToken || !data.refreshToken || !data.accountId) {
      return parseStringify({
        responseType: "error",
        message: "The impersonation service returned an incomplete session.",
        error: new Error("INCOMPLETE_IMPERSONATION_RESPONSE"),
      });
    }

    const blob = sealHandoff({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accountId: data.accountId,
      appId: data.appId,
      impersonatorId: data.impersonatorId,
    });

    const origin = await customerOrigin();
    const url = `${origin}/impersonate/consume?h=${encodeURIComponent(blob)}`;

    return parseStringify({
      responseType: "success",
      message: "Opening customer session…",
      data: { url },
    });
  } catch (error: any) {
    // Covers network failures and a missing IMPERSONATION_HANDOFF_SECRET.
    console.error("[IMPERSONATE] Failed to start session:", error?.message);
    return parseStringify({
      responseType: "error",
      message:
        "Couldn't start the impersonation session. Please try again or contact engineering.",
      error: new Error(error?.message || "Impersonation failed"),
    });
  }
}

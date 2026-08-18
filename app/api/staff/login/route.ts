import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { loginAsStaff } from "@/lib/actions/auth-actions";
import { FormResponse } from "@/types/types";

const STAFF_COOKIE = "staffAuthToken";

/**
 * Staff (internal operator) login endpoint.
 *
 * WHY A ROUTE HANDLER (not the server action directly):
 * The admin subdomain serves the login page by rewriting `/login` →
 * `/admin/login`. `handleAdminMiddleware` passes all `/api/*` paths through with
 * `NextResponse.next()` (no rewrite), so this route is a rewrite-free place to
 * establish the session.
 *
 * WHY WE RE-APPLY THE COOKIE ONTO THE RESPONSE:
 * `loginAsStaff` sets `staffAuthToken` via `cookies()` (next/headers). In Next 15
 * those mutations are NOT flushed onto a `NextResponse` returned from a route
 * handler — the cookie was staged server-side (confirmed) but never reached the
 * browser, so every login bounced back to `/login`. The reliable way to set a
 * cookie from a route handler is on the returned response object. We read the
 * cookie(s) `loginAsStaff` staged and copy them onto THIS response with the same
 * options the writer uses (see getCookieOptions in lib/auth-utils.ts).
 */
export async function POST(request: Request): Promise<NextResponse<FormResponse>> {
  let body: { email?: string; password?: string; recaptchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({
      responseType: "error",
      message: "Invalid request. Please try again.",
    });
  }

  // loginAsStaff validates with LoginSchema and handles the MFA/error branches.
  // On success it stages the staffAuthToken cookie(s) into the request cookie
  // store via cookies().
  const result = await loginAsStaff(
    { email: body.email ?? "", password: body.password ?? "" },
    body.recaptchaToken,
  );

  const response = NextResponse.json(result);

  if (result?.responseType === "success") {
    const store = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    // Mirrors getCookieOptions() in lib/auth-utils.ts (Secure follows
    // COOKIE_SECURE on non-prod HTTPS; session cookie, so no maxAge).
    const options = {
      httpOnly: true,
      secure: isProd || process.env.COOKIE_SECURE === "true",
      sameSite: (isProd ? "strict" : "lax") as "strict" | "lax",
      path: "/",
    };
    for (const c of store.getAll()) {
      if (c.name === STAFF_COOKIE || c.name.startsWith(`${STAFF_COOKIE}.`)) {
        if (c.value) response.cookies.set(c.name, c.value, options);
        else response.cookies.delete(c.name);
      }
    }
  }

  return response;
}

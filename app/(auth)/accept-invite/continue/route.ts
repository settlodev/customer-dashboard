import { NextRequest, NextResponse } from "next/server";

import { getAuthToken, updateAuthToken } from "@/lib/auth-utils";

// Mutates cookies and must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cookie-mutating continuation for the invite flow. The /accept-invite page is a
 * Server Component and cannot write cookies during render, so it hands off here
 * once it has validated the invite and inspected the session:
 *   - to=create / to=login / to=setpassword: remember which invite to accept
 *     after auth (pendingInvite cookie) then route the unauthenticated invitee to
 *     the invited-signup form (new account), sign-in (existing account with a
 *     password), or set-password (existing PASSWORDLESS identity — e.g. an invited
 *     staff member who never set one, whom /login would dead-end).
 *   - to=refresh: a signed-in invitee just accepted (or had already accepted)
 *     the invite, so flip the hasInvitedAccess flag the middleware reads — this
 *     stops it trapping an invited-only user at /business-registration — then
 *     drop them into business selection. No forced re-login.
 * Destinations are a fixed allow-list, so `to`/`member`/`email` can never form
 * an arbitrary redirect target.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const to = sp.get("to");
  const member = sp.get("member") ?? "";
  const email = sp.get("email") ?? "";
  const emailQ = email ? `?email=${encodeURIComponent(email)}` : "";

  if (to === "refresh") {
    const token = await getAuthToken();
    if (token?.accessToken) {
      // They accepted (or had accepted) an invite to an account they don't own,
      // so they now have invited access. The session token was minted at login
      // and predates it; update the flag the middleware routes on.
      await updateAuthToken({ ...token, hasInvitedAccess: true });
    }
    return NextResponse.redirect(new URL("/select-business", request.url));
  }

  let dest: string;
  if (to === "login") {
    dest = `/login${emailQ}`;
  } else if (to === "setpassword") {
    // The invited email already has a PASSWORDLESS Settlo identity (e.g. a
    // dashboard-staff invite that was never completed). Send them to set a
    // password; the pendingInvite cookie set below means the invite auto-accepts
    // once they set one and log in — no dead-end at /login.
    dest = `/reset-password?action=create${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  } else {
    dest = `/accept-invite/create?member=${encodeURIComponent(member)}&email=${encodeURIComponent(email)}`;
  }

  const res = NextResponse.redirect(new URL(dest, request.url));
  if (member) {
    res.cookies.set({
      name: "pendingInvite",
      value: member,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // lax (not strict) so the cookie survives the top-level cross-site
      // navigations the invited flow depends on — the email-link entry and the
      // OAuth round-trip back from the provider — where strict would not be sent.
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
    });
  }
  return res;
}

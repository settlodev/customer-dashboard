// Shared between lib/auth-utils.ts (server actions, "use server" — can't
// export plain constants) and auth.ts (NextAuth config). Keeping the
// NextAuth session cookie's maxAge aligned with the authToken cookie's
// default prevents the two from drifting apart: middleware.ts gates access
// purely on authToken, so if the NextAuth session outlived it, a stale
// session for a previous account could still be read by server components
// (e.g. the root layout's `auth()` call) after authToken expired.
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LOGOUT_REDIRECT = "/login";

/**
 * Only allow same-origin, relative redirect targets. An absolute value
 * (`?redirect=https://evil.com`) or a protocol-relative one (`//evil.com`)
 * could send a just-logged-out user to a phishing site, so anything that
 * isn't a plain `/path` is rejected in favour of the default.
 */
function safeRedirectPath(target: string | null): string {
    if (!target) return DEFAULT_LOGOUT_REDIRECT;
    // Must be a relative path rooted at "/", but not "//" (protocol-relative)
    // or "/\" (backslash trick some browsers normalise to "//").
    if (!target.startsWith("/")) return DEFAULT_LOGOUT_REDIRECT;
    if (target.startsWith("//")) return DEFAULT_LOGOUT_REDIRECT;
    if (target.startsWith("/\\")) return DEFAULT_LOGOUT_REDIRECT;
    return target;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = safeRedirectPath(
        searchParams.get("redirect") ?? searchParams.get("returnTo"),
    );
    const cookieStore = await cookies();

    // Clear all auth-related cookies
    cookieStore.delete("authToken");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("next-auth.pkce.code-verifier");

    // Build the absolute URL from a vetted same-origin relative path.
    const baseUrl = request.nextUrl.origin;
    const redirectUrl = new URL(redirectTo, baseUrl).toString();

    // Use 307 to ensure the redirect method stays as GET
    return NextResponse.redirect(redirectUrl, 307);
}

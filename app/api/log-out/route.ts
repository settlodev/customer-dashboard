import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get("redirect") || "/login";
    const cookieStore = await cookies();

    // Clear all auth-related cookies
    cookieStore.delete("authToken");
    cookieStore.delete("next-auth.session-token");
    cookieStore.delete("next-auth.csrf-token");
    cookieStore.delete("next-auth.callback-url");
    cookieStore.delete("next-auth.pkce.code-verifier");

    // Ensure to construct absolute URL for redirect
    const baseUrl = request.nextUrl.origin;
    const redirectUrl = new URL(redirectTo, baseUrl).toString();

    // Use 307 to ensure the redirect method stays as GET
    return NextResponse.redirect(redirectUrl, 307);
}

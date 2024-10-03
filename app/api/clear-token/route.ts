import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const redirectTo = searchParams.get("redirect") || "/login";

    // Clear the authToken cookie
    cookies().delete("authToken");

    // Redirect to the specified page
    return NextResponse.redirect(new URL(redirectTo, request.url));
}

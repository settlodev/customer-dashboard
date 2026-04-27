import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  SELECT_BUSINESS_URL,
  DEFAULT_LOGIN_REDIRECT_URL,
  specialAuthRoutes,
  COMPLETE_BUSINESS_REGISTRATION_URL,
  VERIFICATION_REDIRECT_URL,
  SELECT_BUSINESS_LOCATION_URL,
} from "@/routes";
import { cookies } from "next/headers";
import { AuthToken } from "./types/types";

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[")) {
      const pattern = route.replace(/\[\.\.\..*?\]/g, ".+").replace(/\[.*?\]/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname === route;
  });
  const isAuthRoute = authRoutes.includes(pathname);
  const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);

  // Always allow public and API auth routes through first
  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  const session = await auth();
  const isLoggedIn = !!session;
  const cookieStore = await cookies();

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    if (isAuthRoute) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // ── Logged in — parse authToken ──────────────────────────────────────────────
  let authToken: AuthToken | null = null;
  try {
    const tokenCookie = cookieStore.get("authToken");
    if (tokenCookie?.value) {
      authToken = JSON.parse(tokenCookie.value);
    }
  } catch (error) {
    console.error("Failed to parse auth token:", error);
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Session exists but authToken cookie is missing or unparseable.
  // This is a broken/partial auth state — redirect to login to re-establish it.
  if (!authToken) {
    console.warn(
      "Session exists but authToken cookie is missing — redirecting to login",
    );

    // Allow auth routes so the login page itself can render
    if (isAuthRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // ── Logged in + authToken present ────────────────────────────────────────────

  // Email not verified
  if (
    authToken.emailVerified === null &&
    pathname !== VERIFICATION_REDIRECT_URL
  ) {
    console.warn("Email not verified — redirecting to verification page");
    return NextResponse.redirect(
      new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
    );
  }

  // Special auth routes (business-registration, business-location, user-verification)
  if (isSpecialAuthRoute) {
    return NextResponse.next();
  }

  // Business / location registration incomplete
  if (
    (!authToken.businessComplete || !authToken.locationComplete) &&
    pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
  ) {
    console.warn(
      "Registration incomplete — redirecting to business registration",
    );
    return NextResponse.redirect(
      new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
    );
  }

  // Already logged in — don't allow access to login/register
  if (isAuthRoute) {
    return NextResponse.redirect(
      new URL(DEFAULT_LOGIN_REDIRECT_URL, request.nextUrl),
    );
  }

  const currentBusinessToken = cookieStore.get("currentBusiness");
  const currentWarehouseToken = cookieStore.get("currentWarehouse");
  const currentLocationToken = cookieStore.get("currentLocation");

  // No business selected
  if (!currentBusinessToken?.value && pathname !== SELECT_BUSINESS_URL) {
    console.warn("No business selected — redirecting to select business");
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, request.nextUrl));
  }

  // No location/warehouse selected
  if (
    currentBusinessToken?.value &&
    !currentWarehouseToken?.value &&
    !currentLocationToken?.value &&
    pathname !== SELECT_BUSINESS_LOCATION_URL
  ) {
    console.warn("No location selected — redirecting to select location");
    return NextResponse.redirect(
      new URL(SELECT_BUSINESS_LOCATION_URL, request.nextUrl),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};

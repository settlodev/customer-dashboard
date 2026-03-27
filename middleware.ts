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
import { AuthToken } from "./types/types";

const { auth } = NextAuth(authConfig);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[")) {
      const pattern = route.replace(/\[.*?\]/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    }
    return pathname === route;
  });
  const isAuthRoute = authRoutes.includes(pathname);
  const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);
  const session = await auth();

  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  let authToken: AuthToken | null = null;
  const isLoggedIn = !!session;

  try {
    const tokenCookie = request.cookies.get("authToken");
    if (tokenCookie?.value) {
      authToken = JSON.parse(tokenCookie.value);
    }
  } catch (error) {
    console.error("Failed to parse auth token:", error);
  }

  if (!isLoggedIn) {
    if (isAuthRoute) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && authToken) {
    const currentBusinessToken = request.cookies.get("currentBusiness");
    const currentWarehouseToken = request.cookies.get("currentWarehouse");
    const currentLocationToken = request.cookies.get("currentLocation");

    // Email is not verified, force user to verify email
    if (
      !authToken.emailVerified &&
      pathname !== VERIFICATION_REDIRECT_URL
    ) {
      return NextResponse.redirect(
        new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
      );
    }

    // Allow access to special routes (e.g., business registration, verification)
    if (isSpecialAuthRoute) {
      return NextResponse.next();
    }

    // Business and location registration must be complete
    if (
      (!authToken.isBusinessRegistrationComplete ||
        !authToken.isLocationRegistrationComplete) &&
      pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
    ) {
      return NextResponse.redirect(
        new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
      );
    }

    // If accessing auth routes while logged in, redirect to dashboard
    if (isAuthRoute) {
      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT_URL, request.nextUrl),
      );
    }

    // Check if user has selected a business
    if (!currentBusinessToken?.value && pathname !== SELECT_BUSINESS_URL) {
      return NextResponse.redirect(
        new URL(SELECT_BUSINESS_URL, request.nextUrl),
      );
    }

    // Check if user has selected a location/warehouse
    if (
      currentBusinessToken?.value &&
      !currentWarehouseToken?.value &&
      !currentLocationToken?.value &&
      pathname !== SELECT_BUSINESS_LOCATION_URL
    ) {
      return NextResponse.redirect(
        new URL(SELECT_BUSINESS_LOCATION_URL, request.nextUrl),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};

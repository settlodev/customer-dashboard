import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import type { Session } from "next-auth";
import {
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  SELECT_BUSINESS_URL,
  DEFAULT_LOGIN_REDIRECT_URL,
  specialAuthRoutes,
  COMPLETE_BUSINESS_REGISTRATION_URL,
  COMPLETE_BUSINESS_LOCATION_SETUP_URL,
  VERIFICATION_REDIRECT_URL,
  SELECT_BUSINESS_LOCATION_URL,
} from "@/routes";
import { cookies } from "next/headers";
import { AuthToken } from "./types/types";

// Extend NextRequest to include auth property
interface RequestWithAuth extends NextRequest {
  auth: Session | null;
}

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

  // Allow public routes direct access early, no need to process auth tokens
  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  let authToken: AuthToken | null = null;
  const isLoggedIn = !!session;
  const cookieStore = await cookies();

  try {
    const tokenCookie = cookieStore.get("authToken");
    if (tokenCookie?.value) {
      authToken = JSON.parse(tokenCookie.value);
    }
  } catch (error) {
    console.error("Failed to parse auth token:", error);
  }

  if (!isLoggedIn) {
    console.warn("You are not logged in");

    if (isAuthRoute) {
      console.warn("Allowing you to access the auth route", isAuthRoute);
      return NextResponse.next();
    }

    // Redirect to login for all other routes
    console.warn("Redirecting you to login page");
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && authToken) {
    const currentBusinessToken = cookieStore.get("currentBusiness");
    const currentWarehouseToken = cookieStore.get("currentWarehouse");
    const currentLocationToken = cookieStore.get("currentLocation");

    // Email is not verified, force user to verify email
    if (
      authToken.emailVerified === null &&
      pathname !== VERIFICATION_REDIRECT_URL
    ) {
      console.warn(
        "You are not verified, redirecting you to verification page",
      );
      return NextResponse.redirect(
        new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
      );
    }

    // Allow access to special routes
    if (isSpecialAuthRoute) {
      console.warn("You are accessing a special auth route. Allowing access");
      return NextResponse.next();
    }

    // Business registration and location registration are now combined
    // If not complete, redirect to business registration
    if (
      (!authToken.businessComplete || !authToken.locationComplete) &&
      pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
    ) {
      if (!authToken.businessComplete) {
        console.warn(
          "Business registration is not complete, redirecting you to BUSINESS registration page",
        );
      }

      if (!authToken.locationComplete) {
        console.warn(
          "Location registration is not complete, redirecting you to LOCATION registration page",
        );
      }

      return NextResponse.redirect(
        new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
      );
    }

    // If accessing auth routes, redirect to the correct page
    if (isAuthRoute) {
      console.warn(
        "You are already logged in, you can not access auth routes, redirecting you to default route",
      );

      return NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT_URL, request.nextUrl),
      );
    }

    // Check if user has selected a business (avoid redirect loop)
    if (!currentBusinessToken?.value && pathname !== SELECT_BUSINESS_URL) {
      console.warn(
        "You do not have a business selected, redirecting you to select business page",
      );

      return NextResponse.redirect(
        new URL(SELECT_BUSINESS_URL, request.nextUrl),
      );
    }

    // Check if user has selected a location/warehouse (avoid redirect loop)
    if (
      currentBusinessToken?.value &&
      !currentWarehouseToken?.value &&
      !currentLocationToken?.value &&
      pathname !== SELECT_BUSINESS_LOCATION_URL
    ) {
      console.warn(
        "You do not have a location selected, redirecting you to select location page",
      );

      return NextResponse.redirect(
        new URL(SELECT_BUSINESS_LOCATION_URL, request.nextUrl),
      );
    }
  }

  // Default: allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};
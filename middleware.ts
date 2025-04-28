import NextAuth from "next-auth";
import { cookies } from "next/headers";
import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT_URL,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  COMPLETE_ACCOUNT_REGISTRATION_URL,
  COMPLETE_BUSINESS_LOCATION_SETUP_URL,
  UPDATE_PASSWORD_URL,
  VERIFICATION_REDIRECT_URL,
  VERIFICATION_PAGE,
  SELECT_BUSINESS_URL
} from "@/routes";
import { AuthToken } from "@/types/types";
import { Business } from "@/types/business/type";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

// Extend NextRequest to include auth property
interface RequestWithAuth extends NextRequest {
  auth: Session | null;
}

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest) => {
  // Cast the request to include auth property
  const request = req as RequestWithAuth;
  const { nextUrl } = request;
  const isLoggedIn = !!request.auth;

  // Helper function to check if a route matches the pattern
  const matchesRoute = (route: string) => {
    const pattern = route.replace(/\[.*?\]/g, '[\\w-]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(nextUrl.pathname);
  };

  // Early returns for API and public routes
  if (nextUrl.pathname.startsWith(apiAuthPrefix) ||
      publicRoutes.some(matchesRoute) ||
      nextUrl.pathname.endsWith('.txt') ||
      nextUrl.pathname.startsWith(UPDATE_PASSWORD_URL)) {
    return NextResponse.next();
  }

  // Parse auth token and current business
  let authToken: AuthToken | null = null;
  let currentBusiness: Business | null = null;

  try {
    const tokens = cookies().get("authToken")?.value;
    if (tokens) {
      authToken = JSON.parse(tokens);
      const currentBusinessToken = cookies().get("currentBusiness");
      if (currentBusinessToken?.value) {
        currentBusiness = JSON.parse(currentBusinessToken.value);
      }
    }
  } catch (error) {
    console.error("Error parsing tokens:", error);
    // Only redirect to login if we're not already there
    return nextUrl.pathname !== "/login"
      ? NextResponse.redirect(new URL("/login", nextUrl))
      : NextResponse.next();
  }

  // Handle unauthenticated users
  if (!isLoggedIn || !authToken) {
    // Allow access to auth routes
    if (authRoutes.includes(nextUrl.pathname)) {
      return NextResponse.next();
    }
    // Only redirect to login if we're not already there
    return nextUrl.pathname !== "/login"
      ? NextResponse.redirect(new URL("/login", nextUrl))
      : NextResponse.next();
  }

  // Handle authenticated users trying to access auth routes
  if (authRoutes.includes(nextUrl.pathname)) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
  }

  // Priority-based redirect chain
  const redirectChain = [
    {
      condition: () => authToken?.emailVerified === null && nextUrl.pathname !== VERIFICATION_PAGE,
      destination: VERIFICATION_REDIRECT_URL,
      allowedPath: VERIFICATION_PAGE
    },
    {
      condition: () => !authToken?.businessComplete,
      destination: COMPLETE_ACCOUNT_REGISTRATION_URL,
      allowedPath: COMPLETE_ACCOUNT_REGISTRATION_URL
    },
    {
      condition: () => authToken?.businessComplete && !currentBusiness,
      destination: SELECT_BUSINESS_URL,
      allowedPath: SELECT_BUSINESS_URL
    },
    {
      condition: () => authToken?.businessComplete && currentBusiness && !authToken?.locationComplete,
      destination: COMPLETE_BUSINESS_LOCATION_SETUP_URL,
      allowedPath: COMPLETE_BUSINESS_LOCATION_SETUP_URL
    }
  ];

  // Check redirect chain
  for (const { condition, destination, allowedPath } of redirectChain) {
    if (condition()) {
      // Only redirect if we're not already at the allowed path
      return nextUrl.pathname !== allowedPath
        ? NextResponse.redirect(new URL(destination, nextUrl))
        : NextResponse.next();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"]
};

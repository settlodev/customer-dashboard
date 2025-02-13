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

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some(route => {
    const pattern = route.replace(/\[.*?\]/g, '[\\w-]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(nextUrl.pathname);
  });
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isUpdatePasswordRoute = nextUrl.pathname.startsWith(UPDATE_PASSWORD_URL);
  const isLoginPage = nextUrl.pathname === "/login";

  // Allow access to API routes, public routes, and password update routes
  if (isApiAuthRoute || isPublicRoute || isUpdatePasswordRoute) {
    return;
  }

  // Handle login page separately to prevent redirect loops
  if (isLoginPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }
    return;
  }

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
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle unauthenticated users
  if (!isLoggedIn || !authToken) {
    if (isAuthRoute) {
      return;
    }
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle authenticated users
  if (isLoggedIn) {
    // Prevent authenticated users from accessing auth routes
    if (isAuthRoute) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }

    // Email verification check
    if (authToken.emailVerified === null) {
      if (nextUrl.pathname === VERIFICATION_PAGE) {
        return;
      }
      if (nextUrl.pathname !== VERIFICATION_REDIRECT_URL) {
        return Response.redirect(new URL(VERIFICATION_REDIRECT_URL, nextUrl));
      }
      return;
    }

    // Business registration check
    if (!authToken.businessComplete) {
      if (nextUrl.pathname === COMPLETE_ACCOUNT_REGISTRATION_URL) {
        return;
      }
      return Response.redirect(new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl));
    }

    // Business selection check
    if (authToken.businessComplete && !currentBusiness) {
      if (nextUrl.pathname === SELECT_BUSINESS_URL) {
        return;
      }
      return Response.redirect(new URL(SELECT_BUSINESS_URL, nextUrl));
    }

    // Location setup check
    if (authToken.businessComplete && currentBusiness && !authToken.locationComplete) {
      if (nextUrl.pathname === COMPLETE_BUSINESS_LOCATION_SETUP_URL) {
        return;
      }
      return Response.redirect(new URL(COMPLETE_BUSINESS_LOCATION_SETUP_URL, nextUrl));
    }
  }

  return;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ]
};

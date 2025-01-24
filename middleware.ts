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
  VERIFICATION_PAGE
} from "@/routes";
import { AuthToken } from "@/types/types";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isUpdatePasswordRoute = nextUrl.pathname.startsWith(UPDATE_PASSWORD_URL);

  // Allow access to API routes, public routes, and password update routes
  if (isApiAuthRoute || isPublicRoute || isUpdatePasswordRoute) {
    return;
  }

  // Get auth token
  let authToken: AuthToken | null = null;
  try {
    const tokens = cookies().get("authToken")?.value;
    if (tokens) {
      authToken = JSON.parse(tokens);
    }
  } catch (error) {
    console.error("Error parsing auth token:", error);
    // If token is invalid or expired, redirect to login
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle unauthenticated users
  if (!isLoggedIn || !authToken) {
    // Allow access to auth routes
    if (isAuthRoute) {
      return;
    }
    // Redirect to login for protected routes
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle authenticated users
  if (isLoggedIn) {
    // Check email verification
    if (authToken.emailVerified === null) {
      if (nextUrl.pathname === VERIFICATION_PAGE) {
        return;
      }
      if (nextUrl.pathname !== VERIFICATION_REDIRECT_URL) {
        return Response.redirect(new URL(VERIFICATION_REDIRECT_URL, nextUrl));
      }
      return;
    }

    // Prevent authenticated users from accessing auth routes
    if (isAuthRoute) {
      // Only redirect to business registration if they haven't completed it
      if (!authToken.businessComplete) {
        return Response.redirect(new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl));
      }
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }

    // Handle business registration flow
    if (!authToken.businessComplete &&
        nextUrl.pathname !== COMPLETE_ACCOUNT_REGISTRATION_URL) {
      return Response.redirect(new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl));
    }

    // Handle location setup flow
    if (authToken.businessComplete &&
        !authToken.locationComplete &&
        nextUrl.pathname !== COMPLETE_BUSINESS_LOCATION_SETUP_URL) {
      return Response.redirect(new URL(COMPLETE_BUSINESS_LOCATION_SETUP_URL+"?business="+authToken.businessId, nextUrl));
    }
  }

  // Allow access to the requested page if none of the above conditions are met
  return;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/user-verification",
    "/email-verification"
  ],
};

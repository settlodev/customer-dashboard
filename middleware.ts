import NextAuth from "next-auth";
import { cookies } from "next/headers";

import authConfig from "@/auth.config";
import {
  DEFAULT_LOGIN_REDIRECT_URL,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  COMPLETE_ACCOUNT_REGISTRATION_URL,
} from "@/routes";
import { AuthToken } from "@/types/types";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  let authToken = null;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  if (isApiAuthRoute || isPublicRoute) {
    return;
  }

  // Get auth token
  const tokens = cookies().get("settloAuthToken")?.value;

  if (tokens) {
    authToken = JSON.parse(tokens) as AuthToken;
  }

  if (isLoggedIn) {
    // If logged in and trying to access an auth route (like /login),
    // redirect to the default page or account completion page
    if (isAuthRoute) {
      if (authToken?.businessComplete !== true) {
        return Response.redirect(new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl));
      }

      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }

    // For non-auth routes, check if business registration is complete
    if (authToken?.businessComplete !== true && nextUrl.pathname !== COMPLETE_ACCOUNT_REGISTRATION_URL) {
      return Response.redirect(
          new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl),
      );
    }
  } else {
    // If not logged in, allow access to auth routes and public routes
    if (isAuthRoute || isPublicRoute) {
      return;
    }

    // For all other routes, redirect to log in
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Allow access to the requested page if none of the above conditions are met
  return;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

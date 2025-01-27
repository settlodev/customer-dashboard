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
  VERIFICATION_PAGE, SELECT_BUSINESS_URL
} from "@/routes";
import { AuthToken } from "@/types/types";
import {Business} from "@/types/business/type";

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
  let currentBusiness: Business | null = null;

  try {
    const cookieList = cookies().getAll();
    console.log("Available cookies:", cookieList.map(c => c.name));

    const tokens = cookies().get("authToken")?.value;
    if (tokens) {
      authToken = JSON.parse(tokens);

      const currentBusinessToken = cookies().get("currentBusiness");
      console.log("Business cookie details:", {
        exists: !!currentBusinessToken,
        name: currentBusinessToken?.name,
        value: currentBusinessToken?.value
      });

      if (currentBusinessToken?.value) {
        try {
          currentBusiness = JSON.parse(currentBusinessToken.value);
          console.log("Parsed currentBusiness:", currentBusiness);
        } catch (parseError) {
          console.error("Error parsing currentBusiness:", parseError);
        }
      } else {
        console.log("No current business cookie found");
      }
    }
  } catch (error) {
    console.error("Error in middleware:", error);
    // If token is invalid or expired, redirect to log in
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle unauthenticated users
  if (!isLoggedIn || !authToken) {
    // Allow access to auth routes
    if (isAuthRoute) {
      return;
    }
    // Redirect to log in for protected routes
    return Response.redirect(new URL("/login", nextUrl));
  }

  // Handle authenticated users
  if (isLoggedIn) {
    // First check email verification
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
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
    }

    // Then check business registration
    if (!authToken.businessComplete) {
      // Allow access to the registration page
      if (nextUrl.pathname === COMPLETE_ACCOUNT_REGISTRATION_URL) {
        return;
      }
      // Redirect to registration for all other pages
      return Response.redirect(new URL(COMPLETE_ACCOUNT_REGISTRATION_URL, nextUrl));
    }

    // Only check for business selection after business registration is complete
    if (authToken.businessComplete && !currentBusiness) {
      // Allow access to the selection page
      if (nextUrl.pathname === SELECT_BUSINESS_URL) {
        return;
      }
      // Redirect to selection for all other pages
      return Response.redirect(new URL(SELECT_BUSINESS_URL, nextUrl));
    }

    // Finally check location setup
    if (authToken.businessComplete &&
        currentBusiness &&
        !authToken.locationComplete) {
      // Allow access to the location setup page
      if (nextUrl.pathname === COMPLETE_BUSINESS_LOCATION_SETUP_URL) {
        return;
      }
      // Redirect to location setup for all other pages
      return Response.redirect(
          new URL(
              `${COMPLETE_BUSINESS_LOCATION_SETUP_URL}`,
              nextUrl
          )
      );
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

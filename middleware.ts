
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

export default auth(async (req: NextRequest) => {
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

  // Parse auth token and current business with better error handling
  let authToken: AuthToken | null = null;
  let currentBusiness: Business | null = null;
  let currentWarehouse: Business | null = null;
  let cookieParseError = false;

  try {
    const cookieStore = await cookies();
    const tokens = cookieStore.get("authToken")?.value;
    if (tokens) {
      authToken = JSON.parse(tokens);
      const currentBusinessToken = cookieStore.get("currentBusiness");
      if (currentBusinessToken?.value) {
        currentBusiness = JSON.parse(currentBusinessToken.value);
      }

      // Get current warehouse from cookies
      const currentWarehouseToken = cookieStore.get("currentWarehouse");
      if (currentWarehouseToken?.value) {
        currentWarehouse = JSON.parse(currentWarehouseToken.value);
      }
    }
  } catch (error) {
    console.error("Error parsing tokens:", error);
    cookieParseError = true;
  }

  // console.log("  AuthToken exists:", !!authToken);
  // console.log("  Email verified:", authToken?.emailVerified);
  // console.log("  Business complete:", authToken?.businessComplete);
  // console.log("  Current business exists:", !!currentBusiness);

  // Handle unauthenticated users or cookie parse errors
  if (!isLoggedIn || cookieParseError) {
    // console.log("  🚫 User not logged in or cookie error");
    
    // Allow access to auth routes (including user-verification)
    if (authRoutes.includes(nextUrl.pathname)) {
      // console.log("  ✅ Allowing auth route for unauthenticated user");
      return NextResponse.next();
    }
    
    // Only redirect to login if we're not already there
    if (nextUrl.pathname !== "/login") {
      // console.log("  🔄 Redirecting to login");
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // CRITICAL: Check if current path is user-verification - allow it immediately if email not verified
  if (nextUrl.pathname === VERIFICATION_REDIRECT_URL && authToken?.emailVerified === null) {

    // console.log("  ✅ Allowing access to user-verification page");
    return NextResponse.next();
  }

  // Handle authenticated users trying to access other auth routes
  if (authRoutes.includes(nextUrl.pathname) && nextUrl.pathname !== VERIFICATION_REDIRECT_URL) {

    // console.log("  🔄 Redirecting authenticated user away from auth route");
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, nextUrl));
  }

  const isWarehouseRoute = nextUrl.pathname.startsWith('/warehouse');

  // Redirect warehouse routes if no warehouse is selected
  if (isWarehouseRoute && !currentWarehouse) {
    // console.log("  🔄 Redirecting to select location for warehouse route");
    return NextResponse.redirect(new URL("/select-location", nextUrl));
  }

  // Handle case where user is logged in but no authToken in cookies
  if (isLoggedIn && !authToken) {
    // console.log("  ⚠️ Logged in but no authToken");
    
    // Define routes that are safe to access without authToken
    const safeWithoutToken = [
      SELECT_BUSINESS_URL,
      COMPLETE_BUSINESS_LOCATION_SETUP_URL,
      COMPLETE_ACCOUNT_REGISTRATION_URL,
      VERIFICATION_REDIRECT_URL
    ];

    // Check if current path is safe
    const isCurrentPathSafe = safeWithoutToken.some(route => 
      nextUrl.pathname.startsWith(route)
    );

    if (isCurrentPathSafe) {
      // console.log("  ✅ Allowing safe route without authToken");
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'no-store, max-age=0');
      return response;
    } else {
      // console.log("  🔄 Redirecting to select business (no authToken)");
      return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, nextUrl));
    }
  }

  // Priority-based redirect chain - only proceed if we have authToken
  if (authToken) {
    
    const redirectChain = [
      {
        name: "Email Verification",
        condition: () => authToken?.emailVerified === null && nextUrl.pathname !== VERIFICATION_REDIRECT_URL,
        destination: VERIFICATION_REDIRECT_URL,
        allowedPath: VERIFICATION_REDIRECT_URL
      },
      {
        name: "Business Registration",
        condition: () => authToken?.emailVerified !== null && !authToken?.businessComplete,
        destination: COMPLETE_ACCOUNT_REGISTRATION_URL,
        allowedPath: COMPLETE_ACCOUNT_REGISTRATION_URL
      },
      {
        name: "Business Selection",
        condition: () => authToken?.businessComplete && !currentBusiness,
        destination: SELECT_BUSINESS_URL,
        allowedPath: SELECT_BUSINESS_URL
      },
      {
        name: "Location Setup",
        condition: () => authToken?.businessComplete && currentBusiness && !authToken?.locationComplete,
        destination: COMPLETE_BUSINESS_LOCATION_SETUP_URL,
        allowedPath: COMPLETE_BUSINESS_LOCATION_SETUP_URL
      }
    ];

    // Check redirect chain
    for (const { name, condition, destination, allowedPath } of redirectChain) {
      if (condition()) {
        console.log(`  🎯 ${name} condition met`);
        // Only redirect if we're not already at the allowed path
        if (nextUrl.pathname !== allowedPath) {
          // console.log(`  🔄 Redirecting to ${destination}`);
          return NextResponse.redirect(new URL(destination, nextUrl));
        }
        // console.log(`  ✅ Already at correct path: ${allowedPath}`);
        return NextResponse.next();
      }
    }
  }

  // console.log("  ✅ Allowing request to proceed");
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"]
};
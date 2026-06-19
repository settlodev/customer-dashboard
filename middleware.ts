import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_DEFAULT_REDIRECT_URL,
  ADMIN_LOGIN_URL,
  ADMIN_ROUTE_PREFIX,
  apiAuthPrefix,
  authRoutes,
  isAdminHost,
  isAdminPath,
  publicRoutes,
  SELECT_BUSINESS_URL,
  DEFAULT_LOGIN_REDIRECT_URL,
  specialAuthRoutes,
  COMPLETE_BUSINESS_REGISTRATION_URL,
  COMPLETE_LOCATION_REGISTRATION_URL,
  VERIFICATION_REDIRECT_URL,
  SELECT_BUSINESS_LOCATION_URL,
} from "@/routes";
import { AuthToken, InternalRole, SubjectType } from "./types/types";

// ── Cookie constants (matching auth-utils.ts) ────────────────────────
const COOKIE_CHUNK_SIZE = 3800;
const MAX_CHUNKS = 10;

/**
 * Decode a JWT payload without verifying the signature.
 * Used only to check the `exp` claim for token expiry.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/**
 * Check if a JWT access token's `exp` claim has passed.
 */
function isAccessTokenExpired(accessToken: string): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() / 1000 > payload.exp;
}

/**
 * Check if a JWT access token is expired or will expire within `marginSec`
 * seconds. Used for proactive refresh — avoids wasted 401 round-trips.
 */
function isAccessTokenExpiringSoon(accessToken: string, marginSec = 60): boolean {
  const payload = decodeJwtPayload(accessToken);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() / 1000 > payload.exp - marginSec;
}

/**
 * Extract subscription_status claim from a JWT access token.
 */
function extractSubscriptionStatusFromJwt(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  const status = payload.subscription_status as string | undefined;
  if (!status) return null;
  const valid = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED", "CANCELLED"];
  return valid.includes(status) ? status : null;
}

const INTERNAL_ROLES_EDGE: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
  "BOARD_MEMBER",
  "SALES_TEAM",
];

function extractInternalRoleFromJwt(accessToken: string): InternalRole | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  const role = payload.internal_role as string | undefined;
  if (!role) return null;
  return INTERNAL_ROLES_EDGE.includes(role as InternalRole)
    ? (role as InternalRole)
    : null;
}

function extractInternalPermissionsFromJwt(accessToken: string): string[] {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return [];
  const perms = payload.internal_permissions;
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is string => typeof p === "string");
}

function extractSubjectTypeFromJwt(accessToken: string): SubjectType | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  const t = payload.subject_type as string | undefined;
  if (!t) return null;
  return ["USER", "STAFF", "DEVICE"].includes(t) ? (t as SubjectType) : null;
}

/**
 * Attempt to refresh the access token using Edge-compatible fetch.
 * Returns new tokens on success, null on failure.
 */
async function refreshTokenAtEdge(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL;
    if (!authServiceUrl) return null;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
    if (clientId) headers["X-Client-Id"] = clientId;

    const res = await fetch(`${authServiceUrl}/auth/token-refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.accessToken) return null;

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
    };
  } catch {
    return null;
  }
}

/**
 * Set chunked auth token cookies on both the response (browser stores them)
 * and the request (server components read them on this request).
 */
function applyTokenCookies(
  request: NextRequest,
  response: NextResponse,
  tokenValue: string,
  cookieName: string = "authToken",
) {
  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
  };

  // Clear old base + chunk cookies
  response.cookies.delete(cookieName);
  request.cookies.delete(cookieName);
  for (let i = 0; i < MAX_CHUNKS; i++) {
    response.cookies.delete(`${cookieName}.${i}`);
    request.cookies.delete(`${cookieName}.${i}`);
  }

  if (tokenValue.length <= COOKIE_CHUNK_SIZE) {
    response.cookies.set(cookieName, tokenValue, options);
    request.cookies.set(cookieName, tokenValue);
  } else {
    const numChunks = Math.ceil(tokenValue.length / COOKIE_CHUNK_SIZE);
    for (let i = 0; i < numChunks; i++) {
      const chunk = tokenValue.substring(
        i * COOKIE_CHUNK_SIZE,
        (i + 1) * COOKIE_CHUNK_SIZE,
      );
      response.cookies.set(`${cookieName}.${i}`, chunk, options);
      request.cookies.set(`${cookieName}.${i}`, chunk);
    }
  }
}

/**
 * Read a potentially-chunked cookie from the request.
 * Large values are split across authToken.0, authToken.1, etc.
 */
function getChunkedCookieFromRequest(
  request: NextRequest,
  name: string,
): string | null {
  const direct = request.cookies.get(name)?.value;
  if (direct) return direct;

  let value = "";
  for (let i = 0; i < 10; i++) {
    const chunk = request.cookies.get(`${name}.${i}`)?.value;
    if (!chunk) break;
    value += chunk;
  }
  return value || null;
}

/**
 * Create a redirect response that clears all staff auth cookies (force logout).
 */
function forceStaffLogout(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.nextUrl));
  response.cookies.delete("staffAuthToken");
  for (let i = 0; i < MAX_CHUNKS; i++) {
    response.cookies.delete(`staffAuthToken.${i}`);
  }
  return response;
}

/**
 * Create a redirect response that clears all auth cookies (force logout).
 */
function forceLogout(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.nextUrl));
  const cookiesToDelete = [
    "authToken",
    "next-auth.session-token",
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "next-auth.csrf-token",
    "activeBusiness",
    "currentBusiness",
    "currentLocation",
    "currentWarehouse",
    "pendingVerification",
  ];
  for (const name of cookiesToDelete) {
    response.cookies.delete(name);
  }
  // Also delete chunked authToken cookies
  for (let i = 0; i < 10; i++) {
    response.cookies.delete(`authToken.${i}`);
  }
  return response;
}

async function handleAdminMiddleware(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse> {
  // The route group lives at app/(admin)/admin/* — internal paths always
  // start with /admin. Rewrite any inbound path that isn't already prefixed.
  const needsRewrite = !isAdminPath(pathname);
  // Rewrite into the /admin/* route group while PRESERVING the inbound query
  // string and hash. Building a URL from a path-only string —
  // `new URL("/admin/accounts", request.url)` — silently drops the query, which
  // made every ?page/&size/&search/&sort and onboarding/status/date filter
  // param vanish before reaching the page's searchParams. Cloning nextUrl and
  // only swapping the pathname keeps the search params intact.
  const rewriteTarget = (target: string): URL => {
    const url = request.nextUrl.clone();
    url.pathname = needsRewrite ? `${ADMIN_ROUTE_PREFIX}${target}` : target;
    return url;
  };

  // Read staff session cookie
  let staffToken: AuthToken | null = null;
  try {
    const raw = getChunkedCookieFromRequest(request, "staffAuthToken");
    if (raw) staffToken = JSON.parse(raw);
  } catch {
    // Malformed cookie — treat as not logged in
  }

  const isStaffLoggedIn = !!(
    staffToken?.accessToken && staffToken?.internalRole
  );

  // Strip the admin prefix when comparing paths to the login URL — pathname
  // could be either /login (subdomain root) or /admin/login (already rewritten).
  const normalizedPath = isAdminPath(pathname)
    ? pathname.slice(ADMIN_ROUTE_PREFIX.length) || "/"
    : pathname;
  const isLoginPath = normalizedPath === "/login";

  // ── Not logged in ──────────────────────────────────────────────────
  if (!isStaffLoggedIn) {
    if (isLoginPath) {
      return needsRewrite
        ? NextResponse.rewrite(rewriteTarget("/login"))
        : NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Token expiry / refresh ─────────────────────────────────────────
  let refreshedTokenValue: string | null = null;
  if (
    staffToken!.refreshToken &&
    isAccessTokenExpiringSoon(staffToken!.accessToken)
  ) {
    const refreshed = await refreshTokenAtEdge(staffToken!.refreshToken);
    if (refreshed) {
      staffToken = {
        ...staffToken!,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        internalRole: extractInternalRoleFromJwt(refreshed.accessToken),
        internalPermissions: extractInternalPermissionsFromJwt(
          refreshed.accessToken,
        ),
        subjectType:
          extractSubjectTypeFromJwt(refreshed.accessToken) ?? "STAFF",
      };
      refreshedTokenValue = JSON.stringify(staffToken);
    } else if (isAccessTokenExpired(staffToken!.accessToken)) {
      return forceStaffLogout(request);
    }
  }

  const withRefreshedStaffCookies = (response: NextResponse): NextResponse => {
    if (refreshedTokenValue) {
      applyTokenCookies(request, response, refreshedTokenValue, "staffAuthToken");
    }
    return response;
  };

  // ── Logged in: keep them off /login ────────────────────────────────
  if (isLoginPath) {
    return withRefreshedStaffCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
    );
  }

  // ── Logged in: rewrite to /admin/* route group internally ─────────
  if (needsRewrite) {
    return withRefreshedStaffCookies(
      NextResponse.rewrite(rewriteTarget(pathname)),
    );
  }

  return withRefreshedStaffCookies(NextResponse.next());
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  // ── Admin subdomain branch ─────────────────────────────────────────
  // The admin dashboard lives on admin.* hosts. It has its own state
  // machine that bypasses customer onboarding/subscription gates.
  if (isAdminHost(host)) {
    return handleAdminMiddleware(request, pathname);
  }

  // ── Route classification ──────────────────────────────────────────
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[")) {
      const pattern = route.replace(/\[.*?\]/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route;
  });
  const isAuthRoute = authRoutes.includes(pathname);
  const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);

  // Always allow API auth and public routes
  if (isApiAuthRoute || isPublicRoute) {
    return NextResponse.next();
  }

  // ── Parse auth state from cookie ──────────────────────────────────
  // The authToken cookie is the source of truth for routing decisions.
  // It is set by our server actions on login/register/verify and contains
  // all fields needed for onboarding checks.
  let authToken: AuthToken | null = null;
  try {
    const tokenValue = getChunkedCookieFromRequest(request, "authToken");
    if (tokenValue) {
      authToken = JSON.parse(tokenValue);
    }
  } catch {
    // Malformed cookie — treat as not logged in
  }

  const isLoggedIn = !!(authToken?.accessToken);

  // ── Cross-domain leak guard ───────────────────────────────────────
  // A token carrying internalRole was issued for the admin dashboard.
  // If one shows up at the apex domain (bookmark, copy/paste, dev tools)
  // bounce it to the admin subdomain rather than dragging it through the
  // customer onboarding state machine.
  if (isLoggedIn && authToken?.internalRole) {
    const adminHost =
      process.env.NEXT_PUBLIC_ADMIN_HOST ||
      (process.env.NODE_ENV === "production"
        ? "admin.settlo.co.tz"
        : `admin.${host ?? "localhost:3000"}`);
    const protocol = request.nextUrl.protocol;
    return NextResponse.redirect(
      new URL(`${protocol}//${adminHost}/dashboard`),
    );
  }

  console.log(`[MIDDLEWARE] ${pathname} | loggedIn=${isLoggedIn} | hasCookie=${!!request.cookies.get("authToken")?.value} | hasAccessToken=${!!authToken?.accessToken} | emailVerified=${authToken?.emailVerified} | bizComplete=${authToken?.isBusinessRegistrationComplete} | locComplete=${authToken?.isLocationRegistrationComplete}`);

  // ── Not logged in ─────────────────────────────────────────────────
  if (!isLoggedIn) {
    // Allow access to login/register pages
    if (isAuthRoute) {
      return NextResponse.next();
    }
    // Everything else requires login
    console.log(`[MIDDLEWARE] Not logged in, redirecting ${pathname} → /login`);
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // ── Token expiry check ────────────────────────────────────────────
  // If access token is expired AND there is no refresh token, the session
  // is unrecoverable — force logout immediately.
  if (isAccessTokenExpired(authToken!.accessToken) && !authToken!.refreshToken) {
    return forceLogout(request);
  }

  // ── Proactive token refresh ──────────────────────────────────────
  // If the access token is expired or about to expire, attempt to refresh
  // before the page renders. This prevents wasted 401 round-trips and
  // avoids race conditions where the token expires mid-render.
  let refreshedTokenValue: string | null = null;

  if (authToken!.refreshToken && isAccessTokenExpiringSoon(authToken!.accessToken)) {
    const refreshed = await refreshTokenAtEdge(authToken!.refreshToken);
    if (refreshed) {
      const subscriptionStatus = extractSubscriptionStatusFromJwt(refreshed.accessToken);
      authToken = {
        ...authToken!,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        subscriptionStatus: subscriptionStatus as AuthToken["subscriptionStatus"],
      };
      refreshedTokenValue = JSON.stringify(authToken);
      console.log(`[MIDDLEWARE] ${pathname} | token refreshed proactively`);
    } else if (isAccessTokenExpired(authToken!.accessToken)) {
      // Token is fully expired AND refresh failed — session is dead
      console.log(`[MIDDLEWARE] ${pathname} | token expired and refresh failed — forcing logout`);
      return forceLogout(request);
    }
    // If only expiring soon but not yet expired, continue with old token
    // — the API client interceptor will retry refresh on 401.
  }

  // Helper: attach refreshed token cookies to any response
  const withRefreshedCookies = (response: NextResponse): NextResponse => {
    if (refreshedTokenValue) {
      applyTokenCookies(request, response, refreshedTokenValue);
    }
    return response;
  };

  // ── Auth routes for logged-in users ─────────────────────────────
  // Redirect them to wherever they need to be in the onboarding flow
  // rather than showing login again.
  if (isAuthRoute) {
    if (!authToken!.emailVerified) {
      return withRefreshedCookies(NextResponse.redirect(
        new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
      ));
    }
    if (!authToken!.isBusinessRegistrationComplete && !authToken!.hasInvitedAccess) {
      return withRefreshedCookies(NextResponse.redirect(
        new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
      ));
    }
    if (authToken!.isBusinessRegistrationComplete && !authToken!.isLocationRegistrationComplete) {
      return withRefreshedCookies(NextResponse.redirect(
        new URL(COMPLETE_LOCATION_REGISTRATION_URL, request.nextUrl),
      ));
    }
    return withRefreshedCookies(NextResponse.redirect(
      new URL(DEFAULT_LOGIN_REDIRECT_URL, request.nextUrl),
    ));
  }

  // ── Onboarding guards (ordered by completion stage) ───────────────

  // 1. Email not verified → email verification page
  if (!authToken!.emailVerified && pathname !== VERIFICATION_REDIRECT_URL) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
    ));
  }

  // Allow special auth routes through (verification, business-registration,
  // business-location) so the user can complete onboarding steps.
  if (isSpecialAuthRoute) {
    return withRefreshedCookies(NextResponse.next());
  }

  // 2. Neither business nor location registered → business + location setup
  if (
    !authToken!.isBusinessRegistrationComplete &&
    !authToken!.isLocationRegistrationComplete &&
    !authToken!.hasInvitedAccess &&
    pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
  ) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
    ));
  }

  // 3. Business registered but location missing → standalone location setup
  if (
    authToken!.isBusinessRegistrationComplete &&
    !authToken!.isLocationRegistrationComplete &&
    pathname !== COMPLETE_LOCATION_REGISTRATION_URL
  ) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL(COMPLETE_LOCATION_REGISTRATION_URL, request.nextUrl),
    ));
  }

  // ── Fully onboarded user ──────────────────────────────────────────

  // Must have selected a business
  const currentBusinessToken = request.cookies.get("currentBusiness");
  const currentWarehouseToken = request.cookies.get("currentWarehouse");
  const currentLocationToken = request.cookies.get("currentLocation");

  if (!currentBusinessToken?.value && pathname !== SELECT_BUSINESS_URL) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL(SELECT_BUSINESS_URL, request.nextUrl),
    ));
  }

  // Must have selected a location or warehouse
  if (
    currentBusinessToken?.value &&
    !currentWarehouseToken?.value &&
    !currentLocationToken?.value &&
    pathname !== SELECT_BUSINESS_LOCATION_URL
  ) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL(SELECT_BUSINESS_LOCATION_URL, request.nextUrl),
    ));
  }

  // ── Per-location subscription check ───────────────────────────────
  // Runs AFTER business + location are selected so we know which
  // location's subscription to enforce.
  // subscriptionStatus comes from the JWT (refreshed on location switch).
  // null = billing service not configured — allow through.
  const subscriptionStatus = authToken!.subscriptionStatus;

  if (subscriptionStatus === "SUSPENDED" && pathname !== "/account-suspended") {
    return withRefreshedCookies(NextResponse.redirect(
      new URL("/account-suspended", request.nextUrl),
    ));
  }

  if (
    (subscriptionStatus === "EXPIRED" || subscriptionStatus === "CANCELLED") &&
    pathname !== "/billing"
  ) {
    return withRefreshedCookies(NextResponse.redirect(
      new URL("/billing", request.nextUrl),
    ));
  }

  return withRefreshedCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};

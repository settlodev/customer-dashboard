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
import { getDomainConfig } from "@/lib/domain-config";

const { auth } = NextAuth(authConfig);

const { rootDomain, plainDomain, rootUrl, getSubOrigin } = getDomainConfig(); // ← add getSubOrigin

function getSubdomain(host: string): string | null {
  // Strip port and www prefix
  const hostname = host
    .split(":")[0]
    .toLowerCase()
    .replace(/^www\./, "");
  const domain = plainDomain;

  if (hostname === domain) return null;
  if (hostname.endsWith(`.${domain}`)) {
    const sub = hostname.slice(0, -`.${domain}`.length);
    if (sub && !sub.includes("*")) return sub;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const subdomain = getSubdomain(host);

  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.some((route) => {
    if (route.includes("[")) {
      const pattern = route
        .replace(/\[\.\.\..*?\]/g, ".+")
        .replace(/\[.*?\]/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route;
  });
  const isAuthRoute = authRoutes.includes(pathname);
  const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);

  if (isApiAuthRoute || isPublicRoute) return NextResponse.next();

  const session = await auth();
  const isLoggedIn = !!session;

  if (!isLoggedIn) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", rootUrl)); // ← lowercase
  }

  // ── Parse authToken ──────────────────────────────────────────────────────
  let authToken: AuthToken | null = null;
  try {
    const raw = request.cookies.get("authToken")?.value;
    if (raw) authToken = JSON.parse(raw);
  } catch {
    return NextResponse.redirect(new URL("/login", rootUrl));
  }

  if (!authToken) {
    if (isAuthRoute) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", rootUrl));
  }

  // ── Verification / registration guards ──────────────────────────────────
  if (
    authToken.emailVerified === null &&
    pathname !== VERIFICATION_REDIRECT_URL
  ) {
    return NextResponse.redirect(new URL(VERIFICATION_REDIRECT_URL, rootUrl));
  }

  if (isSpecialAuthRoute) return NextResponse.next();

  if (
    (!authToken.businessComplete || !authToken.locationComplete) &&
    pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
  ) {
    return NextResponse.redirect(
      new URL(COMPLETE_BUSINESS_REGISTRATION_URL, rootUrl),
    );
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, rootUrl));
  }

  // ── Read shared cookies ──────────────────────────────────────────────────
  const currentBusiness = request.cookies.get("currentBusiness")?.value;
  const currentLocation = request.cookies.get("currentLocation")?.value;
  const currentWarehouse = request.cookies.get("currentWarehouse")?.value;

  // ── ROOT DOMAIN LOGIC ────────────────────────────────────────────────────
  if (!subdomain) {
    if (!currentBusiness && pathname !== SELECT_BUSINESS_URL) {
      return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
    }

    if (currentBusiness) {
      try {
        const parsed = JSON.parse(currentBusiness);
        const slug: string = parsed.slug;
        if (slug) {
          const subUrl = getSubOrigin(slug); // ← uses getDomainConfig, no hardcoding

          const destination =
            !currentLocation && !currentWarehouse
              ? `${subUrl}${SELECT_BUSINESS_LOCATION_URL}`
              : `${subUrl}${DEFAULT_LOGIN_REDIRECT_URL}`;

          return NextResponse.redirect(destination);
        }
      } catch {
        /* malformed cookie — fall through to select-business */
      }
    }

    return NextResponse.next();
  }

  // ── SUBDOMAIN LOGIC ──────────────────────────────────────────────────────
  if (!currentBusiness) {
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  let parsedBusiness: { slug: string } | null = null;
  try {
    parsedBusiness = JSON.parse(currentBusiness);
  } catch {
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  // Security: cookie slug must match the subdomain being accessed
  if (parsedBusiness?.slug !== subdomain) {
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  // No location or warehouse selected yet
  if (
    !currentLocation &&
    !currentWarehouse &&
    pathname !== SELECT_BUSINESS_LOCATION_URL
  ) {
    return NextResponse.redirect(
      new URL(SELECT_BUSINESS_LOCATION_URL, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};

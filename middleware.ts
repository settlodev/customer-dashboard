// import { NextRequest, NextResponse } from "next/server";
// import NextAuth from "next-auth";
// import authConfig from "@/auth.config";
// import {
//   apiAuthPrefix,
//   authRoutes,
//   publicRoutes,
//   SELECT_BUSINESS_URL,
//   DEFAULT_LOGIN_REDIRECT_URL,
//   specialAuthRoutes,
//   COMPLETE_BUSINESS_REGISTRATION_URL,
//   VERIFICATION_REDIRECT_URL,
//   SELECT_BUSINESS_LOCATION_URL,
// } from "@/routes";
// import { AuthToken } from "./types/types";
// import { getDomainConfig } from "@/lib/domain-config";
//
// const { auth } = NextAuth(authConfig);
//
// const { rootDomain, plainDomain, rootUrl, getSubOrigin } = getDomainConfig(); // ← add getSubOrigin
//
// function getSubdomain(host: string): string | null {
//   // Strip port and www prefix
//   const hostname = host
//     .split(":")[0]
//     .toLowerCase()
//     .replace(/^www\./, "");
//   const domain = plainDomain;
//
//   if (hostname === domain) return null;
//   if (hostname.endsWith(`.${domain}`)) {
//     const sub = hostname.slice(0, -`.${domain}`.length);
//     if (sub && !sub.includes("*")) return sub;
//   }
//
//   return null;
// }
//
// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const host = request.headers.get("host") ?? "";
//   const subdomain = getSubdomain(host);
//
//   const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
//   const isPublicRoute = publicRoutes.some((route) => {
//     if (route.includes("[")) {
//       const pattern = route
//         .replace(/\[\.\.\..*?\]/g, ".+")
//         .replace(/\[.*?\]/g, "[^/]+");
//       return new RegExp(`^${pattern}$`).test(pathname);
//     }
//     return pathname === route;
//   });
//   const isAuthRoute = authRoutes.includes(pathname);
//   const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);
//
//   if (isApiAuthRoute || isPublicRoute) return NextResponse.next();
//
//   const session = await auth();
//   const isLoggedIn = !!session;
//
//   if (!isLoggedIn) {
//     if (isAuthRoute) return NextResponse.next();
//     return NextResponse.redirect(new URL("/login", rootUrl)); // ← lowercase
//   }
//
//   // ── Parse authToken ──────────────────────────────────────────────────────
//   let authToken: AuthToken | null = null;
//   try {
//     const raw = request.cookies.get("authToken")?.value;
//     if (raw) authToken = JSON.parse(raw);
//   } catch {
//     return NextResponse.redirect(new URL("/login", rootUrl));
//   }
//
//   if (!authToken) {
//     if (isAuthRoute) return NextResponse.next();
//     return NextResponse.redirect(new URL("/login", rootUrl));
//   }
//
//   // ── Verification / registration guards ──────────────────────────────────
//   if (
//     authToken.emailVerified === null &&
//     pathname !== VERIFICATION_REDIRECT_URL
//   ) {
//     return NextResponse.redirect(new URL(VERIFICATION_REDIRECT_URL, rootUrl));
//   }
//
//   if (isSpecialAuthRoute) return NextResponse.next();
//
//   if (
//     (!authToken.businessComplete || !authToken.locationComplete) &&
//     pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
//   ) {
//     return NextResponse.redirect(
//       new URL(COMPLETE_BUSINESS_REGISTRATION_URL, rootUrl),
//     );
//   }
//
//   if (isAuthRoute) {
//     return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, rootUrl));
//   }
//
//   // ── Read shared cookies ──────────────────────────────────────────────────
//   const currentBusiness = request.cookies.get("currentBusiness")?.value;
//   const currentLocation = request.cookies.get("currentLocation")?.value;
//   const currentWarehouse = request.cookies.get("currentWarehouse")?.value;
//
//   // ── ROOT DOMAIN LOGIC ────────────────────────────────────────────────────
//   if (!subdomain) {
//     if (!currentBusiness && pathname !== SELECT_BUSINESS_URL) {
//       return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
//     }
//
//     if (currentBusiness) {
//       try {
//         const parsed = JSON.parse(currentBusiness);
//         const slug: string = parsed.slug;
//         if (slug) {
//           const subUrl = getSubOrigin(slug); // ← uses getDomainConfig, no hardcoding
//
//           const destination =
//             !currentLocation && !currentWarehouse
//               ? `${subUrl}${SELECT_BUSINESS_LOCATION_URL}`
//               : `${subUrl}${DEFAULT_LOGIN_REDIRECT_URL}`;
//
//           return NextResponse.redirect(destination);
//         }
//       } catch {
//         /* malformed cookie — fall through to select-business */
//       }
//     }
//
//     return NextResponse.next();
//   }
//
//   // ── SUBDOMAIN LOGIC ──────────────────────────────────────────────────────
//   if (!currentBusiness) {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
//   }
//
//   let parsedBusiness: { slug: string } | null = null;
//   try {
//     parsedBusiness = JSON.parse(currentBusiness);
//   } catch {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
//   }
//
//   // Security: cookie slug must match the subdomain being accessed
//   if (parsedBusiness?.slug !== subdomain) {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
//   }
//
//   // No location or warehouse selected yet
//   if (
//     !currentLocation &&
//     !currentWarehouse &&
//     pathname !== SELECT_BUSINESS_LOCATION_URL
//   ) {
//     return NextResponse.redirect(
//       new URL(SELECT_BUSINESS_LOCATION_URL, request.url),
//     );
//   }
//
//   return NextResponse.next();
// }
//
// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
//   ],
// };

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
const { plainDomain, rootUrl, getSubOrigin } = getDomainConfig();

function getSubdomain(host: string): string | null {
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
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  const subdomain = getSubdomain(host);

  console.log(`[middleware] ── NEW REQUEST ──────────────────────`);
  console.log(`[middleware] host: ${host}`);
  console.log(`[middleware] pathname: ${pathname}`);
  console.log(`[middleware] subdomain: ${subdomain ?? "(root)"}`);
  console.log(`[middleware] plainDomain: ${plainDomain}`);
  console.log(`[middleware] rootUrl: ${rootUrl}`);

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

  console.log(
    `[middleware] isApiAuthRoute: ${isApiAuthRoute} | isPublicRoute: ${isPublicRoute} | isAuthRoute: ${isAuthRoute} | isSpecialAuthRoute: ${isSpecialAuthRoute}`,
  );

  if (isApiAuthRoute || isPublicRoute) {
    console.log(`[middleware] ✓ public/api route — passing through`);
    return NextResponse.next();
  }

  const session = await auth();
  const isLoggedIn = !!session;
  console.log(`[middleware] isLoggedIn: ${isLoggedIn}`);

  if (!isLoggedIn) {
    if (isAuthRoute) {
      console.log(
        `[middleware] ✓ not logged in + auth route — passing through`,
      );
      return NextResponse.next();
    }
    console.log(`[middleware] ✗ not logged in — redirecting to /login`);
    return NextResponse.redirect(new URL("/login", rootUrl));
  }

  // ── Parse authToken ────────────────────────────────────────────────────────
  let authToken: AuthToken | null = null;
  try {
    const raw = request.cookies.get("authToken")?.value;
    if (raw) authToken = JSON.parse(raw);
  } catch {
    console.log(
      `[middleware] ✗ authToken parse failed — redirecting to /login`,
    );
    return NextResponse.redirect(new URL("/login", rootUrl));
  }

  console.log(`[middleware] authToken present: ${!!authToken}`);
  console.log(
    `[middleware] authToken details: ${JSON.stringify({
      emailVerified: authToken?.emailVerified,
      businessComplete: authToken?.businessComplete,
      locationComplete: authToken?.locationComplete,
    })}`,
  );

  if (!authToken) {
    if (isAuthRoute) {
      console.log(`[middleware] ✓ no authToken + auth route — passing through`);
      return NextResponse.next();
    }
    console.log(`[middleware] ✗ no authToken — redirecting to /login`);
    return NextResponse.redirect(new URL("/login", rootUrl));
  }

  // ── Verification guard ─────────────────────────────────────────────────────
  if (
    authToken.emailVerified === null &&
    pathname !== VERIFICATION_REDIRECT_URL
  ) {
    console.log(
      `[middleware] ✗ email not verified — redirecting to ${VERIFICATION_REDIRECT_URL}`,
    );
    return NextResponse.redirect(new URL(VERIFICATION_REDIRECT_URL, rootUrl));
  }

  if (isSpecialAuthRoute) {
    console.log(`[middleware] ✓ special auth route — passing through`);
    return NextResponse.next();
  }

  // ── Registration guard ─────────────────────────────────────────────────────
  // Only block on businessComplete — locationComplete is handled by the
  // select-location flow, not at this level
  if (
    !authToken.businessComplete &&
    pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
  ) {
    console.log(
      `[middleware] ✗ businessComplete: ${authToken.businessComplete} — redirecting to ${COMPLETE_BUSINESS_REGISTRATION_URL}`,
    );
    return NextResponse.redirect(
      new URL(COMPLETE_BUSINESS_REGISTRATION_URL, rootUrl),
    );
  }

  // ── Already logged in — block auth routes ──────────────────────────────────
  if (isAuthRoute) {
    console.log(
      `[middleware] ✗ logged in + auth route — redirecting to ${DEFAULT_LOGIN_REDIRECT_URL}`,
    );
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, rootUrl));
  }

  // ── Read shared cookies ────────────────────────────────────────────────────
  const currentBusiness = request.cookies.get("currentBusiness")?.value;
  const currentLocation = request.cookies.get("currentLocation")?.value;
  const currentWarehouse = request.cookies.get("currentWarehouse")?.value;

  console.log(
    `[middleware] cookies — currentBusiness: ${!!currentBusiness} | currentLocation: ${!!currentLocation} | currentWarehouse: ${!!currentWarehouse}`,
  );

  // ── ROOT DOMAIN LOGIC ──────────────────────────────────────────────────────
  if (!subdomain) {
    console.log(`[middleware] ── ROOT DOMAIN ────────────────────────`);

    if (!currentBusiness && pathname !== SELECT_BUSINESS_URL) {
      console.log(
        `[middleware] ✗ no business — redirecting to ${SELECT_BUSINESS_URL}`,
      );
      return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
    }

    if (currentBusiness) {
      try {
        const parsed = JSON.parse(currentBusiness);
        const slug: string = parsed.slug;
        console.log(`[middleware] currentBusiness slug: ${slug}`);

        if (slug) {
          const subUrl = getSubOrigin(slug);
          const destination =
            !currentLocation && !currentWarehouse
              ? `${subUrl}${SELECT_BUSINESS_LOCATION_URL}`
              : `${subUrl}${DEFAULT_LOGIN_REDIRECT_URL}`;

          console.log(
            `[middleware] ✓ business found — redirecting to: ${destination}`,
          );
          return NextResponse.redirect(destination);
        }
      } catch {
        console.log(
          `[middleware] ✗ malformed currentBusiness cookie — falling through to select-business`,
        );
      }
    }

    console.log(`[middleware] ✓ root domain — passing through`);
    return NextResponse.next();
  }

  // ── SUBDOMAIN LOGIC ────────────────────────────────────────────────────────
  console.log(`[middleware] ── SUBDOMAIN: ${subdomain} ──────────────`);

  if (!currentBusiness) {
    console.log(
      `[middleware] ✗ no currentBusiness on subdomain — redirecting to select-business`,
    );
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  let parsedBusiness: { slug: string } | null = null;
  try {
    parsedBusiness = JSON.parse(currentBusiness);
  } catch {
    console.log(
      `[middleware] ✗ malformed currentBusiness — redirecting to select-business`,
    );
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  console.log(
    `[middleware] slug match: cookie="${parsedBusiness?.slug}" vs subdomain="${subdomain}" → ${parsedBusiness?.slug === subdomain ? "✓ match" : "✗ mismatch"}`,
  );

  // Security: cookie slug must match the subdomain being accessed
  if (parsedBusiness?.slug !== subdomain) {
    console.log(
      `[middleware] ✗ slug mismatch — redirecting to select-business`,
    );
    return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, rootUrl));
  }

  if (
    !currentLocation &&
    !currentWarehouse &&
    pathname !== SELECT_BUSINESS_LOCATION_URL
  ) {
    console.log(
      `[middleware] ✗ no location/warehouse — redirecting to ${SELECT_BUSINESS_LOCATION_URL}`,
    );
    return NextResponse.redirect(
      new URL(SELECT_BUSINESS_LOCATION_URL, request.url),
    );
  }

  console.log(`[middleware] ✓ all checks passed — passing through`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
  ],
};

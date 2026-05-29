// // import { NextRequest, NextResponse } from "next/server";
// // import NextAuth from "next-auth";
// // import authConfig from "@/auth.config";
// // import {
// //   apiAuthPrefix,
// //   authRoutes,
// //   publicRoutes,
// //   SELECT_BUSINESS_URL,
// //   DEFAULT_LOGIN_REDIRECT_URL,
// //   specialAuthRoutes,
// //   COMPLETE_BUSINESS_REGISTRATION_URL,
// //   VERIFICATION_REDIRECT_URL,
// //   SELECT_BUSINESS_LOCATION_URL,
// // } from "@/routes";
// // import { cookies } from "next/headers";
// // import { AuthToken } from "./types/types";
// //
// // const { auth } = NextAuth(authConfig);
// //
// // export async function middleware(request: NextRequest) {
// //   const { pathname } = request.nextUrl;
// //
// //   const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
// //   const isPublicRoute = publicRoutes.some((route) => {
// //     if (route.includes("[")) {
// //       const pattern = route
// //         .replace(/\[\.\.\..*?\]/g, ".+")
// //         .replace(/\[.*?\]/g, "[^/]+");
// //       const regex = new RegExp(`^${pattern}$`);
// //       return regex.test(pathname);
// //     }
// //     return pathname === route;
// //   });
// //   const isAuthRoute = authRoutes.includes(pathname);
// //   const isSpecialAuthRoute = specialAuthRoutes.includes(pathname);
// //
// //   // Always allow public and API auth routes through first
// //   if (isApiAuthRoute || isPublicRoute) {
// //     return NextResponse.next();
// //   }
// //
// //   const session = await auth();
// //   const isLoggedIn = !!session;
// //   const cookieStore = await cookies();
// //
// //   // ── Not logged in ────────────────────────────────────────────────────────────
// //   if (!isLoggedIn) {
// //     if (isAuthRoute) {
// //       return NextResponse.next();
// //     }
// //     return NextResponse.redirect(new URL("/login", request.nextUrl));
// //   }
// //
// //   // ── Logged in — parse authToken ──────────────────────────────────────────────
// //   let authToken: AuthToken | null = null;
// //   try {
// //     const tokenCookie = cookieStore.get("authToken");
// //     if (tokenCookie?.value) {
// //       authToken = JSON.parse(tokenCookie.value);
// //     }
// //   } catch (error) {
// //     console.error("Failed to parse auth token:", error);
// //     return NextResponse.redirect(new URL("/login", request.nextUrl));
// //   }
// //
// //   // Session exists but authToken cookie is missing or unparseable.
// //   // This is a broken/partial auth state — redirect to login to re-establish it.
// //   if (!authToken) {
// //     console.warn(
// //       "Session exists but authToken cookie is missing — redirecting to login",
// //     );
// //
// //     // Allow auth routes so the login page itself can render
// //     if (isAuthRoute) {
// //       return NextResponse.next();
// //     }
// //
// //     return NextResponse.redirect(new URL("/login", request.nextUrl));
// //   }
// //
// //   // ── Logged in + authToken present ────────────────────────────────────────────
// //
// //   // Email not verified
// //   if (
// //     authToken.emailVerified === null &&
// //     pathname !== VERIFICATION_REDIRECT_URL
// //   ) {
// //     console.warn("Email not verified — redirecting to verification page");
// //     return NextResponse.redirect(
// //       new URL(VERIFICATION_REDIRECT_URL, request.nextUrl),
// //     );
// //   }
// //
// //   // Special auth routes (business-registration, business-location, user-verification)
// //   if (isSpecialAuthRoute) {
// //     return NextResponse.next();
// //   }
// //
// //   // Business / location registration incomplete
// //   if (
// //     (!authToken.businessComplete || !authToken.locationComplete) &&
// //     pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
// //   ) {
// //     console.warn(
// //       "Registration incomplete — redirecting to business registration",
// //     );
// //     return NextResponse.redirect(
// //       new URL(COMPLETE_BUSINESS_REGISTRATION_URL, request.nextUrl),
// //     );
// //   }
// //
// //   // Already logged in — don't allow access to login/register
// //   if (isAuthRoute) {
// //     return NextResponse.redirect(
// //       new URL(DEFAULT_LOGIN_REDIRECT_URL, request.nextUrl),
// //     );
// //   }
// //
// //   const currentBusinessToken = cookieStore.get("currentBusiness");
// //   const currentWarehouseToken = cookieStore.get("currentWarehouse");
// //   const currentLocationToken = cookieStore.get("currentLocation");
// //
// //   // No business selected
// //   if (!currentBusinessToken?.value && pathname !== SELECT_BUSINESS_URL) {
// //     console.warn("No business selected — redirecting to select business");
// //     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, request.nextUrl));
// //   }
// //
// //   // No location/warehouse selected
// //   if (
// //     currentBusinessToken?.value &&
// //     !currentWarehouseToken?.value &&
// //     !currentLocationToken?.value &&
// //     pathname !== SELECT_BUSINESS_LOCATION_URL
// //   ) {
// //     console.warn("No location selected — redirecting to select location");
// //     return NextResponse.redirect(
// //       new URL(SELECT_BUSINESS_LOCATION_URL, request.nextUrl),
// //     );
// //   }
// //
// //   return NextResponse.next();
// // }
// //
// // export const config = {
// //   matcher: [
// //     "/((?!_next/static|_next/image|images|favicon|manifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.webmanifest|.*\\.txt|.*\\.json|\\.well-known|monitoring).*)",
// //   ],
// // };
//
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
//
// const { auth } = NextAuth(authConfig);
//
// const ROOT_DOMAIN =
//   process.env.NODE_ENV === "production" ? "settlo.co.tz" : "lvh.me";
// const ROOT_URL =
//   process.env.NODE_ENV === "production"
//     ? "https://settlo.co.tz"
//     : "http://lvh.me:3000";
//
// /** Extract subdomain from host, returns null on root domain */
// function getSubdomain(host: string): string | null {
//   // Strip port for local dev (settlo.local:3000 → settlo.local)
//   const hostname = host.split(":")[0];
//   if (hostname === ROOT_DOMAIN) return null;
//   if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
//     return hostname.slice(0, -(ROOT_DOMAIN.length + 1));
//   }
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
//     // Always redirect unauthenticated users to root domain login
//     return NextResponse.redirect(new URL("/login", ROOT_URL));
//   }
//
//   // ── Parse authToken ────────────────────────────────────────────────────────
//   let authToken: AuthToken | null = null;
//   try {
//     const raw = request.cookies.get("authToken")?.value;
//     if (raw) authToken = JSON.parse(raw);
//   } catch {
//     return NextResponse.redirect(new URL("/login", ROOT_URL));
//   }
//
//   if (!authToken) {
//     if (isAuthRoute) return NextResponse.next();
//     return NextResponse.redirect(new URL("/login", ROOT_URL));
//   }
//
//   // ── Verification / registration guards ───────────────────────────────────
//   if (
//     authToken.emailVerified === null &&
//     pathname !== VERIFICATION_REDIRECT_URL
//   ) {
//     return NextResponse.redirect(new URL(VERIFICATION_REDIRECT_URL, ROOT_URL));
//   }
//
//   if (isSpecialAuthRoute) return NextResponse.next();
//
//   if (
//     (!authToken.businessComplete || !authToken.locationComplete) &&
//     pathname !== COMPLETE_BUSINESS_REGISTRATION_URL
//   ) {
//     return NextResponse.redirect(
//       new URL(COMPLETE_BUSINESS_REGISTRATION_URL, ROOT_URL),
//     );
//   }
//
//   if (isAuthRoute) {
//     return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT_URL, ROOT_URL));
//   }
//
//   // ── Read shared cookies ───────────────────────────────────────────────────
//   // These are set with domain=.settlo.co.tz so they arrive on every subdomain
//   const currentBusiness = request.cookies.get("currentBusiness")?.value;
//   const currentLocation = request.cookies.get("currentLocation")?.value;
//   const currentWarehouse = request.cookies.get("currentWarehouse")?.value;
//
//   // ── ROOT DOMAIN LOGIC ─────────────────────────────────────────────────────
//   if (!subdomain) {
//     if (!currentBusiness && pathname !== SELECT_BUSINESS_URL) {
//       return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, ROOT_URL));
//     }
//     // Business selected on root — bounce to the subdomain
//     if (currentBusiness) {
//       try {
//         const parsed = JSON.parse(currentBusiness);
//         const slug: string = parsed.slug;
//         if (slug) {
//           const subUrl =
//             process.env.NODE_ENV === "production"
//               ? `https://${slug}.settlo.co.tz`
//               : `http://${slug}.lvh.me:3000`;
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
//     return NextResponse.next();
//   }
//
//   // ── SUBDOMAIN LOGIC ───────────────────────────────────────────────────────
//   if (!currentBusiness) {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, ROOT_URL));
//   }
//
//   let parsedBusiness: { slug: string } | null = null;
//   try {
//     parsedBusiness = JSON.parse(currentBusiness);
//   } catch {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, ROOT_URL));
//   }
//
//   // Security: cookie slug must match the subdomain being accessed
//   if (parsedBusiness?.slug !== subdomain) {
//     return NextResponse.redirect(new URL(SELECT_BUSINESS_URL, ROOT_URL));
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

const { rootDomain, rootUrl, getSubOrigin } = getDomainConfig(); // ← add getSubOrigin

function getSubdomain(host: string): string | null {
  const hostname = host.split(":")[0];
  const domain = rootDomain.replace(/^\./, "");

  if (hostname === domain) return null;
  if (hostname.endsWith(`.${domain}`)) {
    return hostname.slice(0, -(domain.length + 1));
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

export const publicRoutes = [
  "/",
  "/pricing",
  "/terms",
  "/contact-us",
  "/careers",
  "/menu/[id]",
  "/email-verification",
  "/reset-password",
  "/auth-error",
  "/item/[id]",
  "/reserve/[id]",
  "/r/[slug]",
  "/grn/[token]",
  "/invoice/[token]",
  "/po/[token]",
  "/pr/[token]",
  "/rfq/[token]",
  "/sr/[token]",
  // Staff-impersonation handoff landing — establishes the customer session
  // from a sealed blob, so it must be reachable before any customer cookie.
  "/impersonate/consume",
  "/accept-invite",
  "/accept-invite/create",
];

export const authRoutes = ["/login", "/register"];

export const specialAuthRoutes = [
  "/business-registration",
  "/business-location",
  "/user-verification",
  "/subscription",
  "/account-suspended",
];

export const apiAuthPrefix = "/api/auth";
export const VERIFICATION_REDIRECT_URL = "/user-verification";
export const EMAIL_VERIFICATION_URL = "/email-verification";
export const DEFAULT_LOGIN_REDIRECT_URL = "/dashboard";
export const COMPLETE_BUSINESS_REGISTRATION_URL = "/business-registration";
export const COMPLETE_LOCATION_REGISTRATION_URL = "/business-location";
export const SELECT_BUSINESS_URL = "/select-business";
export const SELECT_BUSINESS_LOCATION_URL = "/select-location";
export const LOCATION_SUBSCRIPTION_URL = "/subscription";

// ── Admin (internal staff) dashboard ─────────────────────────────────
// Routes are served from the `admin.` subdomain. Middleware rewrites
// inbound paths to /admin/* so the route group lives at app/(admin)/admin/*.
export const ADMIN_ROUTE_PREFIX = "/admin";
export const ADMIN_LOGIN_URL = "/admin/login";
export const ADMIN_DEFAULT_REDIRECT_URL = "/admin/dashboard";
export const adminAuthRoutes = [ADMIN_LOGIN_URL];

export const isAdminPath = (pathname: string): boolean =>
  pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);

export const isAdminHost = (host: string | null | undefined): boolean => {
  if (!host) return false;
  // Strip port for matching ("admin.localhost:3000" → "admin.localhost").
  const hostname = host.split(":")[0].toLowerCase();
  return hostname === "admin.localhost" || hostname.startsWith("admin.");
};

// ── Public-route classification (single source of truth) ─────────────
// Middleware uses a public-route ALLOW-by-omission model: anything not matched
// here requires auth. Keep this classifier the only place the matching logic
// lives so the runtime invariant below actually guards what middleware uses.
export const isPublicRoute = (pathname: string): boolean =>
  publicRoutes.some((route) => {
    if (route.includes("[")) {
      const pattern = route.replace(/\[.*?\]/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(pathname);
    }
    return pathname === route;
  });

// ── Default-allow guard (block-list risk) ────────────────────────────
// The route model is a block-list: a NEW protected route added without
// touching publicRoutes is silently public. There is no unit-test harness in
// this project, so we assert the invariant at module load in non-prod: known
// protected segments must NOT be classified as public. If someone ever adds
// e.g. "/dashboard" to publicRoutes (or a wildcard that swallows it), this
// throws loudly in dev/CI builds instead of shipping an open route.
const PROTECTED_ROUTE_INVARIANTS = [
  "/dashboard",
  "/dashboard/anything",
  "/select-business",
  "/select-location",
  "/inventory",
  "/warehouse",
  "/billing",
  "/admin/dashboard",
];

if (process.env.NODE_ENV !== "production") {
  const leaked = PROTECTED_ROUTE_INVARIANTS.filter((p) => isPublicRoute(p));
  if (leaked.length > 0) {
    throw new Error(
      `[routes] Protected route(s) classified as PUBLIC by the public-route ` +
        `allow-list: ${leaked.join(", ")}. A protected path must never match ` +
        `publicRoutes — remove it from publicRoutes or tighten the pattern.`,
    );
  }
}

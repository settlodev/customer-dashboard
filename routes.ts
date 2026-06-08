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

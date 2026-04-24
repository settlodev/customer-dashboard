export const publicRoutes = [
  "/",
  "/pricing",
  "/terms",
  "/receipt/[id]",
  "/contact-us",
  "/careers",
  "/menu/[id]",
  "/purchase-orders/share/[id]",
  "/proforma/shared/[id]",
  "/delivery-note/shared/[id]",
  "/email-verification",
  "/reset-password",
  "/auth-error",
  "/item/[id]",
  "/reserve/[id]",
];

export const authRoutes = ["/login", "/register"];

export const specialAuthRoutes = [
  "/business-registration",
  "/business-location",
  "/user-verification",
  "/subscription",
  "/account-suspended",
  "/renew-subscription",
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

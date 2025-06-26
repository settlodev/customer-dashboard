export const publicRoutes = [
    "/",
    "/pricing", 
    "/verify-email", 
    "/terms",
    "/receipt/[id]", 
    "/contact-us", 
    "/careers",
    "/menu/[id]"
  ];
  
  export const authRoutes = [
    "/login",
    "/register", 
    "/auth-error",
    "/reset-password",
    "/email-verification"
    // REMOVE "/user-verification" from here - it should NOT be in authRoutes
  ];
  
  export const apiAuthPrefix = "/api/auth";
  export const UPDATE_PASSWORD_URL = "/update-password";
  export const VERIFICATION_REDIRECT_URL = "/user-verification"; // This should NOT be in authRoutes
  export const VERIFICATION_PAGE = "/email-verification";
  export const DEFAULT_LOGIN_REDIRECT_URL = "/business-registration";
  export const COMPLETE_ACCOUNT_REGISTRATION_URL = "/business-registration";
  export const COMPLETE_BUSINESS_LOCATION_SETUP_URL = "/business-location";
  export const SELECT_BUSINESS_URL = "/select-business";
  export const LOCATION_SUBSCRIPTION_URL = "/subscription";




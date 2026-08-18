/**
 * Loans / Financing permission keys — mirror the Accounts service catalog
 * (`DefaultPermissions.FINANCING_PERMISSIONS`). Isomorphic: safe to import
 * from client (PermissionGuard) or server (route guards) code.
 *
 *   loans:read   view eligibility, loans and repayment schedules
 *   loans:apply  submit a financing application
 *   loans:repay  make a repayment toward an active loan
 *
 * These match the Loan Management Service's borrower-side @PreAuthorize keys.
 * (The LMS also enforces lender-side keys — approve/disburse/funding_manage/
 * product_manage — which the customer dashboard does not use.)
 */
export const LOAN_PERMISSIONS = {
  read: "loans:read",
  apply: "loans:apply",
  repay: "loans:repay",
} as const;

export type LoanPermission =
  (typeof LOAN_PERMISSIONS)[keyof typeof LOAN_PERMISSIONS];

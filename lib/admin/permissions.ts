/**
 * Capability-based gating for the admin portal. Internal staff access is driven
 * by the `internal_permissions` carried in the staff JWT (exposed on the token
 * as `internalPermissions`), NOT by a fixed role name — so custom/dynamic roles
 * with the right capability get access automatically.
 *
 * The permission strings mirror the Auth `InternalPermissions` catalog.
 */

export const PERM = {
  ACCOUNTS_READ: "internal:accounts:read",
  ACCOUNTS_MANAGE: "internal:accounts:manage",
  ACCOUNTS_SUSPEND: "internal:accounts:suspend",
  ACCOUNTS_DELETE: "internal:accounts:delete",
  USERS_IMPERSONATE: "internal:users:impersonate",
  USERS_MANAGE_INTERNAL: "internal:users:manage_internal",
  ROLES_MANAGE: "internal:roles:manage",
  SAAS_METRICS_READ: "internal:saas:metrics:read",
  SAAS_REVENUE_READ: "internal:saas:revenue:read",
  BUSINESS_ANALYTICS_READ: "internal:business:analytics:read",
  SUPPORT_TICKETS_MANAGE: "internal:support:tickets:manage",
  ACTIVITY_LOG_READ: "internal:activity:read",
  REPAIR_EXECUTE: "internal:repair:execute",
  REPAIR_APPROVE: "internal:repair:approve",
  // Loans / Financing — lender/operator (admin.localhost). Deliberately the
  // unprefixed `loans:*` keys (NOT `internal:*`) so they match the Loan
  // Management Service's PERM_loans:* @PreAuthorize — see Auth InternalPermissions.
  LOANS_READ: "loans:read",
  LOANS_APPLICATIONS_READ: "loans:applications:read",
  LOANS_APPROVE: "loans:approve",
  LOANS_DISBURSE: "loans:disburse",
  LOANS_FUNDING_MANAGE: "loans:funding_manage",
  LOANS_PRODUCT_MANAGE: "loans:product_manage",
  LOANS_WRITE_OFF: "loans:write_off",
} as const;

export type InternalPermission = (typeof PERM)[keyof typeof PERM];

interface TokenLike {
  internalPermissions?: string[] | null;
}

/** True if the caller holds ANY of the given internal permissions. */
export function hasInternalPermission(
  token: TokenLike | null | undefined,
  ...permissions: string[]
): boolean {
  const granted = token?.internalPermissions;
  if (!granted || granted.length === 0) return false;
  return permissions.some((p) => granted.includes(p));
}

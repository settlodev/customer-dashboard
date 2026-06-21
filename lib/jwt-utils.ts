import { InternalRole, SubjectType, SubscriptionStatus } from "@/types/types";

/**
 * Decode a JWT payload (without verifying signature) to extract claims.
 */
function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Use atob for browser/edge compatibility, Buffer for Node
    const json = typeof Buffer !== "undefined"
      ? Buffer.from(base64, "base64").toString("utf-8")
      : atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Extract subscription_status from a JWT access token.
 */
export function extractSubscriptionStatus(accessToken: string): SubscriptionStatus {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return null;
  const status = claims.subscription_status as string | undefined;
  if (!status) return null;
  const valid: SubscriptionStatus[] = ["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED", "CANCELLED"];
  return valid.includes(status as SubscriptionStatus) ? (status as SubscriptionStatus) : null;
}

/**
 * Extract business_id from a JWT access token.
 */
export function extractBusinessId(accessToken: string): string | null {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return null;
  const businessId = claims.business_id;
  return typeof businessId === "string" && businessId.length > 0 ? businessId : null;
}

const INTERNAL_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
  "BOARD_MEMBER",
  "SALES_TEAM",
];

const SUBJECT_TYPES: SubjectType[] = ["USER", "STAFF", "DEVICE"];

export function extractInternalRole(accessToken: string): InternalRole | null {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return null;
  const role = claims.internal_role;
  if (typeof role !== "string") return null;
  return INTERNAL_ROLES.includes(role as InternalRole) ? (role as InternalRole) : null;
}

export function extractInternalPermissions(accessToken: string): string[] {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return [];
  const perms = claims.internal_permissions;
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is string => typeof p === "string");
}

/**
 * Business-permission keys from a USER access token's `permissions` claim,
 * e.g. ["reports:read_all", "orders:read", …]. Mirror of
 * extractInternalPermissions (which reads the STAFF `internal_permissions`
 * claim). Returns [] if the claim is absent or not a string array.
 */
export function extractPermissions(accessToken: string): string[] {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return [];
  const perms = (claims as Record<string, unknown>).permissions;
  if (!Array.isArray(perms)) return [];
  return perms.filter((p): p is string => typeof p === "string");
}

export function extractSubjectType(accessToken: string): SubjectType | null {
  const claims = decodeJwtClaims(accessToken);
  if (!claims) return null;
  const subjectType = claims.subject_type;
  if (typeof subjectType !== "string") return null;
  return SUBJECT_TYPES.includes(subjectType as SubjectType)
    ? (subjectType as SubjectType)
    : null;
}

// NAMING: throughout the dashboard, "staff" (e.g. createStaffAuthToken,
// getStaffAuthToken, the Staff Portal) means INTERNAL SETTLO OPERATORS, gated on
// the `internal_role` claim — NOT customer business staff (those are regular
// `SubjectType.USER`s) and NOT `SubjectType.STAFF` POS/device tokens (bulk-minted,
// X-Staff-Token, never in the browser). This guard is broader than that: it
// returns true for an internal-role token OR a raw `SubjectType.STAFF` token,
// so it's a "not an ordinary customer USER token" check rather than an
// "internal operator" check — don't confuse the two.
export function isStaffToken(accessToken: string): boolean {
  return extractSubjectType(accessToken) === "STAFF" || extractInternalRole(accessToken) !== null;
}

/**
 * Extract the subject id (`sub`) from a JWT — the auth user id. Used by the
 * impersonation consume route, whose minted LoginResponse omits `userId`.
 */
export function extractSubjectId(accessToken: string): string | null {
  const claims = decodeJwtClaims(accessToken);
  const sub = claims?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

/**
 * Extract the `email` claim from a JWT, when present (user tokens carry it).
 */
export function extractEmail(accessToken: string): string | null {
  const claims = decodeJwtClaims(accessToken);
  const email = claims?.email;
  return typeof email === "string" && email.length > 0 ? email : null;
}

/** True when the token was minted via staff impersonation (`impersonating` claim). */
export function extractImpersonating(accessToken: string): boolean {
  const claims = decodeJwtClaims(accessToken);
  return claims?.impersonating === true;
}

/** The impersonator's auth user id (`impersonator_id` claim), when impersonating. */
export function extractImpersonatorId(accessToken: string): string | null {
  const claims = decodeJwtClaims(accessToken);
  const id = claims?.impersonator_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

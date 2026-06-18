"use server";

/**
 * Server-side feature & limit guards.
 *
 * Use these in server actions to enforce feature access and numeric limits
 * before performing mutations. The UI guards (SubscriptionGuard, sidebar
 * filtering) are cosmetic — these are the real enforcement layer.
 *
 * Each guard accepts an optional `entityId` parameter. When provided (or
 * when an active location is found in the `currentLocation` cookie), it
 * checks the per-entity item from `EntitlementResponse.items[]`. When no
 * entity context is available it falls back to the business-aggregated
 * features/limits (back-compat, permissive).
 *
 * Usage in a server action:
 *   import { assertFeature, assertLimit } from "@/lib/feature-guard";
 *
 *   export async function createBomRule(data: RuleInput) {
 *     await assertFeature("bom_rules");
 *     // ... proceed with creation
 *   }
 *
 *   export async function createStaff(data: StaffInput) {
 *     const currentCount = await getStaffCount();
 *     await assertLimit("staff", currentCount);
 *     // ... proceed with creation
 *   }
 */

import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  getEntitlements,
  type EntitlementItem,
  type EntitlementResponse,
} from "@/lib/actions/entitlement-actions";
import type { FeatureKey, LimitKey } from "@/lib/features";
import { getFeatureMeta } from "@/lib/features";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

// ── Error types ─────────────────────────────────────────────────────

export class FeatureGateError extends Error {
  public readonly code = "FEATURE_NOT_AVAILABLE" as const;
  public readonly featureKey: string;
  public readonly featureTitle: string;

  constructor(featureKey: string) {
    const meta = getFeatureMeta(featureKey);
    const title = meta?.title ?? featureKey;
    super(`Feature "${title}" is not available on your current plan.`);
    this.name = "FeatureGateError";
    this.featureKey = featureKey;
    this.featureTitle = title;
  }
}

export class LimitExceededError extends Error {
  public readonly code = "LIMIT_EXCEEDED" as const;
  public readonly limitKey: string;
  public readonly limit: number;
  public readonly currentCount: number;
  public readonly featureTitle: string;

  constructor(limitKey: string, limit: number, currentCount: number) {
    const meta = getFeatureMeta(limitKey);
    const title = meta?.title ?? limitKey;
    super(
      `You've reached the ${title} limit (${limit}) on your current plan.`,
    );
    this.name = "LimitExceededError";
    this.limitKey = limitKey;
    this.limit = limit;
    this.currentCount = currentCount;
    this.featureTitle = title;
  }
}

export class SubscriptionInactiveError extends Error {
  public readonly code = "SUBSCRIPTION_INACTIVE" as const;

  constructor(status: string | null) {
    super(
      status === "EXPIRED"
        ? "Your subscription has expired. Please renew to continue."
        : status === "SUSPENDED"
          ? "Your subscription has been suspended. Please contact support."
          : "No active subscription found.",
    );
    this.name = "SubscriptionInactiveError";
  }
}

// ── Active location resolver ─────────────────────────────────────────
// Delegates to the hardened getCurrentLocation() so feature gating resolves
// the same business-consistent active location as the rest of the app — a
// location lingering from a previous business resolves to null (→ aggregate
// entitlement fallback) instead of matching a stale per-entity item.

async function getActiveLocationId(): Promise<string | null> {
  return (await getCurrentLocation())?.id ?? null;
}

// ── Per-entity item resolver ─────────────────────────────────────────
// Resolves the per-entity EntitlementItem for the given entityId (or the
// active location when no entityId is passed). Returns null when no entity
// context is available — callers fall back to the aggregate.

async function resolveEntityItem(
  ent: EntitlementResponse,
  entityId?: string,
): Promise<EntitlementItem | null> {
  const id = entityId ?? (await getActiveLocationId());
  if (!id) return null;
  return ent.items.find((i) => i.entityId === id) ?? null;
}

// ── Per-request entitlement cache ───────────────────────────────────
// Server actions run in a single request context. We cache the entitlement
// response so multiple guards in the same action don't each call the
// billing service.

let cachedEntitlements: EntitlementResponse | null | undefined;
let cacheRequestId: string | undefined;

async function getEntitlementsOnce(): Promise<EntitlementResponse | null> {
  // Simple request-scoped cache using a random ID per "batch"
  // In Next.js server actions, the module state persists for the request
  // but we need to invalidate between requests. We use a timestamp-based
  // approach: cache is valid for 5 seconds (well within a single request).
  const now = String(Math.floor(Date.now() / 5000));
  if (cacheRequestId === now && cachedEntitlements !== undefined) {
    return cachedEntitlements;
  }
  cacheRequestId = now;
  cachedEntitlements = await getEntitlements();
  return cachedEntitlements;
}

// ── Guard functions ─────────────────────────────────────────────────

/**
 * Assert that the current business subscription is active.
 * Throws SubscriptionInactiveError if EXPIRED or SUSPENDED.
 */
export async function assertActiveSubscription(): Promise<EntitlementResponse> {
  // If billing service is not configured, allow everything (dev mode)
  if (!BILLING_SERVICE_URL) {
    return {
      businessId: "",
      subscriptionId: "",
      subscriptionStatus: "ACTIVE",
      paidThrough: "",
      active: true,
      limits: {},
      features: {},
      items: [],
      locationCount: 0,
      warehouseCount: 0,
      storeCount: 0,
    };
  }

  const entitlements = await getEntitlementsOnce();
  if (!entitlements || !entitlements.active) {
    throw new SubscriptionInactiveError(entitlements?.subscriptionStatus ?? null);
  }
  return entitlements;
}

/**
 * Assert that a boolean feature is enabled on the active entity's plan.
 * Checks the per-entity item for the given `entityId` (or the active
 * location cookie), falling back to the business-aggregated features when
 * no entity context is available.
 *
 * @throws FeatureGateError if feature is not available
 * @throws SubscriptionInactiveError if subscription is not active
 */
export async function assertFeature(
  featureKey: FeatureKey,
  entityId?: string,
): Promise<void> {
  const entitlements = await assertActiveSubscription();
  const item = await resolveEntityItem(entitlements, entityId);
  const enabled =
    item !== null
      ? item.features[featureKey] === true
      : entitlements.features[featureKey] === true;
  if (!enabled) {
    throw new FeatureGateError(featureKey);
  }
}

/**
 * Assert that a numeric limit has not been exceeded.
 * Checks the active entity's per-entity limit for the given `entityId` (or
 * the active location cookie), falling back to the business-aggregated limit
 * when no entity context is available. -1 = unlimited.
 *
 * @throws LimitExceededError if currentCount >= limit
 * @throws SubscriptionInactiveError if subscription is not active
 */
export async function assertLimit(
  limitKey: LimitKey,
  currentCount: number,
  entityId?: string,
): Promise<void> {
  const entitlements = await assertActiveSubscription();
  const item = await resolveEntityItem(entitlements, entityId);
  const limit =
    item !== null ? item.limits[limitKey] : entitlements.limits[limitKey];

  // undefined or -1 = unlimited
  if (limit === undefined || limit === -1) return;

  if (currentCount >= limit) {
    throw new LimitExceededError(limitKey, limit, currentCount);
  }
}

/**
 * Check a feature without throwing. Returns false if not available.
 * Checks the active entity's per-entity item for the given `entityId` (or
 * the active location cookie), falling back to the business-aggregated
 * features when no entity context is available.
 * Useful for conditional logic rather than hard blocking.
 */
export async function checkFeature(
  featureKey: FeatureKey,
  entityId?: string,
): Promise<boolean> {
  if (!BILLING_SERVICE_URL) return true;
  const entitlements = await getEntitlementsOnce();
  if (!entitlements || !entitlements.active) return false;
  const item = await resolveEntityItem(entitlements, entityId);
  return item !== null
    ? item.features[featureKey] === true
    : entitlements.features[featureKey] === true;
}

/**
 * Check a limit without throwing. Returns true if within limit.
 * Checks the active entity's per-entity limit for the given `entityId` (or
 * the active location cookie), falling back to the business-aggregated limit
 * when no entity context is available. -1 = unlimited.
 */
export async function checkLimit(
  limitKey: LimitKey,
  currentCount: number,
  entityId?: string,
): Promise<boolean> {
  if (!BILLING_SERVICE_URL) return true;
  const entitlements = await getEntitlementsOnce();
  if (!entitlements || !entitlements.active) return false;
  const item = await resolveEntityItem(entitlements, entityId);
  const limit =
    item !== null ? item.limits[limitKey] : entitlements.limits[limitKey];
  if (limit === undefined || limit === -1) return true;
  return currentCount < limit;
}

// ── Helper for server action error responses ────────────────────────

/**
 * Convert a feature guard error into a FormResponse-compatible object.
 * Use in catch blocks of server actions.
 */
export function featureGuardErrorToResponse(error: unknown): {
  responseType: "error";
  message: string;
  error: Error;
} | null {
  if (
    error instanceof FeatureGateError ||
    error instanceof LimitExceededError ||
    error instanceof SubscriptionInactiveError
  ) {
    return {
      responseType: "error",
      message: error.message,
      error,
    };
  }
  return null;
}

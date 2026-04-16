"use server";

/**
 * Server-side feature & limit guards.
 *
 * Use these in server actions to enforce feature access and numeric limits
 * before performing mutations. The UI guards (SubscriptionGuard, sidebar
 * filtering) are cosmetic — these are the real enforcement layer.
 *
 * Usage in a server action:
 *   import { assertFeature, assertLimit } from "@/lib/feature-guard";
 *
 *   export async function createConsumptionRule(data: RuleInput) {
 *     await assertFeature("stock_consumption_rules");
 *     // ... proceed with creation
 *   }
 *
 *   export async function createStaff(data: StaffInput) {
 *     const currentCount = await getStaffCount();
 *     await assertLimit("staff", currentCount);
 *     // ... proceed with creation
 *   }
 */

import {
  getEntitlements,
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
 * Assert that a boolean feature is enabled on the current plan.
 * Checks the aggregated features across all subscription items.
 *
 * @throws FeatureGateError if feature is not available
 * @throws SubscriptionInactiveError if subscription is not active
 */
export async function assertFeature(featureKey: FeatureKey): Promise<void> {
  const entitlements = await assertActiveSubscription();
  if (entitlements.features[featureKey] !== true) {
    throw new FeatureGateError(featureKey);
  }
}

/**
 * Assert that a numeric limit has not been exceeded.
 * Uses the aggregated limits (MAX across items). -1 = unlimited.
 *
 * @throws LimitExceededError if currentCount >= limit
 * @throws SubscriptionInactiveError if subscription is not active
 */
export async function assertLimit(
  limitKey: LimitKey,
  currentCount: number,
): Promise<void> {
  const entitlements = await assertActiveSubscription();
  const limit = entitlements.limits[limitKey];

  // undefined or -1 = unlimited
  if (limit === undefined || limit === -1) return;

  if (currentCount >= limit) {
    throw new LimitExceededError(limitKey, limit, currentCount);
  }
}

/**
 * Check a feature without throwing. Returns false if not available.
 * Useful for conditional logic rather than hard blocking.
 */
export async function checkFeature(featureKey: FeatureKey): Promise<boolean> {
  if (!BILLING_SERVICE_URL) return true;
  const entitlements = await getEntitlementsOnce();
  if (!entitlements || !entitlements.active) return false;
  return entitlements.features[featureKey] === true;
}

/**
 * Check a limit without throwing. Returns true if within limit.
 */
export async function checkLimit(
  limitKey: LimitKey,
  currentCount: number,
): Promise<boolean> {
  if (!BILLING_SERVICE_URL) return true;
  const entitlements = await getEntitlementsOnce();
  if (!entitlements || !entitlements.active) return false;
  const limit = entitlements.limits[limitKey];
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

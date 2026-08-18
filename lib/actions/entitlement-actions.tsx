"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getEntitlementSnapshot } from "@/lib/entitlements/snapshot";
import { GRACE_MS } from "@/lib/entitlements/gate";
import { SubscriptionStatus } from "@/types/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

export interface EntitlementItem {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  entityId: string;
  packageName: string;
  features: Record<string, boolean>;
  /** -1 means unlimited */
  limits: Record<string, number>;
  /** Per-entity lifecycle — each entity's subscription expires SEPARATELY. The Billing Service's
   *  EntityEntitlement already ships these. `active` = usable (in its own trial, ACTIVE, or
   *  PAST_DUE grace); false once EXPIRED/SUSPENDED/CANCELLED. `inTrial` = still inside this
   *  entity's own free trial. */
  active: boolean;
  inTrial: boolean;
  trialEndDate?: string | null;
}

export interface EntitlementResponse {
  businessId: string;
  subscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  paidThrough: string;
  /** ISO date string when the business trial ends. Present when the subscription
   *  header is in a trial period; absent or null otherwise. Use this as the
   *  primary signal for trial state (future date = actively trialing). */
  trialEndDate?: string | null;
  active: boolean;
  /** This account bypasses billing (internal / test / demo). It is active because of the
   *  exemption, not because anything was paid — `paidThrough` above keeps its true, often
   *  PAST, value. Render billing state from this flag rather than the date, or an internal
   *  account reads as "active, paid through <date last year>". Optional: absent on billing
   *  builds that predate the exemption feature, which is equivalent to false. */
  billingExempt?: boolean;
  /** Aggregated across all items — dashboard should ignore these and use per-entity items instead */
  limits: Record<string, number>;
  /** Aggregated across all items */
  features: Record<string, boolean>;
  items: EntitlementItem[];
  locationCount: number;
  warehouseCount: number;
  storeCount: number;
}

/**
 * Fetch entitlements for the current business.
 *
 * Returns the live answer, or the last good one when billing is unreachable and that answer is
 * still inside the grace window. Returns null only when there is nothing trustworthy to return —
 * callers that gate access MUST treat null as "deny", not as "allow".
 */
export const getEntitlements = async (): Promise<EntitlementResponse | null> => {
  const snapshot = await getEntitlementSnapshot();
  if (snapshot.status === "live") return snapshot.data;
  if (snapshot.status === "cached" && snapshot.ageMs <= GRACE_MS) return snapshot.data;
  return null;
};

/**
 * Get entitlements for a specific entity (location/warehouse/store)
 * by filtering the items array from the full response.
 */
export const getEntityEntitlements = async (
  entityId: string,
): Promise<EntitlementItem | null> => {
  const entitlements = await getEntitlements();
  if (!entitlements) return null;
  return entitlements.items.find((item) => item.entityId === entityId) ?? null;
};

/**
 * Check if the current entity has a specific feature enabled.
 * Returns true if BILLING_SERVICE_URL is not configured (unconfigured local dev, not a billing
 * failure). Returns false — deny — when there is no trustworthy entitlement data.
 */
export const hasEntityFeature = async (
  entityId: string,
  featureKey: string,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true; // unconfigured local dev, not a billing failure
  const item = await getEntityEntitlements(entityId);
  if (!item) return false; // no trustworthy entitlement data → deny
  return item.features[featureKey] === true;
};

/**
 * Check if the current entity is within a numeric limit.
 * -1 in the limit means unlimited. Returns true if BILLING_SERVICE_URL is not configured
 * (unconfigured local dev, not a billing failure). Returns false — deny — when there is no
 * trustworthy entitlement data.
 */
export const isWithinEntityLimit = async (
  entityId: string,
  limitKey: string,
  currentCount: number,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true; // unconfigured local dev, not a billing failure
  const item = await getEntityEntitlements(entityId);
  if (!item) return false; // no trustworthy entitlement data → deny
  const limit = item.limits[limitKey];
  if (limit === undefined || limit === -1) return true; // unlimited
  return currentCount < limit;
};

/**
 * Get subscription for a business from the Billing Service.
 */
export const getBusinessSubscription = async (businessId: string): Promise<any> => {
  if (!BILLING_SERVICE_URL) return null;

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`${BILLING_SERVICE_URL}/api/v1/subscriptions/business/${businessId}`);
    return parseStringify(data);
  } catch {
    return null;
  }
};

"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { SubscriptionStatus } from "@/types/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

export interface EntitlementItem {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  entityId: string;
  packageName: string;
  features: Record<string, boolean>;
  /** -1 means unlimited */
  limits: Record<string, number>;
}

export interface EntitlementResponse {
  businessId: string;
  subscriptionId: string;
  subscriptionStatus: SubscriptionStatus;
  paidThrough: string;
  active: boolean;
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
 * Fetch entitlements for the current business from the Billing Service.
 * Reads business_id from the JWT — no path variable needed.
 *
 * Returns per-entity breakdown in `items`. Filter by current location/warehouse ID
 * to get that entity's specific features and limits (-1 = unlimited).
 */
export const getEntitlements = async (): Promise<EntitlementResponse | null> => {
  if (!BILLING_SERVICE_URL) {
    console.warn("[ENTITLEMENTS] BILLING_SERVICE_URL not configured");
    return null;
  }

  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(`${BILLING_SERVICE_URL}/api/v1/entitlements`);
    return parseStringify(data);
  } catch (error) {
    console.warn("[ENTITLEMENTS] Failed to fetch entitlements:", (error as Error)?.message);
    return null;
  }
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
 * Returns true if BILLING_SERVICE_URL is not configured (permissive fallback).
 */
export const hasEntityFeature = async (
  entityId: string,
  featureKey: string,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true;
  const item = await getEntityEntitlements(entityId);
  if (!item) return true; // permissive if no entitlement data
  return item.features[featureKey] === true;
};

/**
 * Check if the current entity is within a numeric limit.
 * -1 in the limit means unlimited. Returns true if within limit or no data.
 */
export const isWithinEntityLimit = async (
  entityId: string,
  limitKey: string,
  currentCount: number,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true;
  const item = await getEntityEntitlements(entityId);
  if (!item) return true;
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

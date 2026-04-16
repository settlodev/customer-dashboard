"use server";

/**
 * Centralized usage counters for limit enforcement.
 *
 * Each function returns the current count of an entity type,
 * suitable for passing to assertLimit() or checkLimit().
 *
 * Usage:
 *   import { getStaffUsageCount } from "@/lib/usage-counts";
 *   import { assertLimit } from "@/lib/feature-guard";
 *   import { Limits } from "@/lib/features";
 *
 *   const count = await getStaffUsageCount();
 *   await assertLimit(Limits.STAFF, count);
 */

import ApiClient from "@/lib/settlo-api-client";

interface CountResponse {
  total: number;
  active: number;
  inactive: number;
}

async function fetchCount(path: string): Promise<number> {
  try {
    const apiClient = new ApiClient();
    const data: CountResponse = await apiClient.get(path);
    return data.total ?? 0;
  } catch {
    // If count fails, return 0 so the guard doesn't block on infra errors.
    // The billing service's own check is the ultimate authority.
    return 0;
  }
}

/** Active staff count for the current business/location. */
export async function getStaffUsageCount(): Promise<number> {
  return fetchCount("/api/v1/staff/count");
}

/** Location count for the current business. */
export async function getLocationUsageCount(): Promise<number> {
  return fetchCount("/api/v1/locations/count");
}

/** Store count for the current business. */
export async function getStoreUsageCount(): Promise<number> {
  return fetchCount("/api/v1/stores/count");
}

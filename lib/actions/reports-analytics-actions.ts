"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  RsItemSalesSummary,
  RsMovement,
  RsMovementSummary,
  RsPageResponse,
} from "@/types/reports-analytics/type";

/**
 * Reports Service wrappers scoped to a single stock variant. Whenever a data
 * shape lives in both services, we prefer the Reports Service — it owns
 * reporting and has materialised views sized for this traffic pattern.
 */

const ANALYTICS = "/api/v2/analytics";

export async function getMovementsForVariant(
  locationId: string,
  variantId: string,
  startDate: string,
  endDate: string,
  page = 0,
  size = 50,
  movementType?: string,
): Promise<RsPageResponse<RsMovement>> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      variantId,
      startDate,
      endDate,
      page: String(page),
      size: String(size),
    });
    if (movementType) params.set("movementType", movementType);
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements?${params.toString()}`,
    );
    return parseStringify(data) as RsPageResponse<RsMovement>;
  } catch {
    return {
      content: [],
      page: 0,
      size,
      totalElements: 0,
      totalPages: 0,
      last: true,
    };
  }
}

export async function getMovementSummaryForVariant(
  locationId: string,
  variantId: string,
  startDate: string,
  endDate: string,
): Promise<RsMovementSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      variantId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsMovementSummary;
  } catch {
    return null;
  }
}

/**
 * Location-wide movement summary (no variant filter). Used on the aggregate
 * stock report and as a fallback source when the inventory-service rollup is
 * not yet materialised.
 */
export async function getLocationMovementSummary(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<RsMovementSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/stock-movements/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsMovementSummary;
  } catch {
    return null;
  }
}

/**
 * Item-sales summary for the location — the caller filters to variant IDs
 * owned by the current stock. The Reports Service endpoint doesn't accept a
 * variantId param (it returns everything and callers project).
 */
export async function getItemSalesSummary(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<RsItemSalesSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId,
      startDate,
      endDate,
    });
    const data = await apiClient.get(
      `${ANALYTICS}/item-sales/summary?${params.toString()}`,
    );
    return parseStringify(data) as RsItemSalesSummary;
  } catch {
    return null;
  }
}

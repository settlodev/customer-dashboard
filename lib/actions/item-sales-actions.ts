"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ItemSalesSummary } from "@/types/item-sales/type";

export async function getItemSalesSummary(
  locationId: string,
  startDate: string,
  endDate?: string,
  // Scopes the summary to a single staff member — drives the per-staff
  // Sales tab on the staff detail screen.
  staffId?: string,
): Promise<ItemSalesSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(`/api/v2/analytics/item-sales/summary`, {
      params: {
        locationId,
        startDate,
        ...(endDate && { endDate }),
        ...(staffId && { staffId }),
      },
    });
    return parseStringify(data) as ItemSalesSummary;
  } catch {
    return null;
  }
}

/**
 * Per-staff item sales for the staff detail Sales tab. Hits the reports
 * `my-sales` endpoint, which attributes a line to
 * `coalesce(staff_id, order_staff_id)` — the staff who typed the item, or
 * (when that's null, which is the common case) the order's owner. Plain
 * `getItemSalesSummary(..., staffId)` filters on `staff_id` alone and so
 * misses everything attributed at the order level.
 */
export async function getStaffItemSales(
  locationId: string,
  startDate: string,
  endDate: string | undefined,
  staffId: string,
): Promise<ItemSalesSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(`/api/v2/analytics/item-sales/my-sales`, {
      params: {
        locationId,
        startDate,
        ...(endDate && { endDate }),
        staffId,
      },
    });
    return parseStringify(data) as ItemSalesSummary;
  } catch {
    return null;
  }
}

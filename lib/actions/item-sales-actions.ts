"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { ItemSalesSummary } from "@/types/item-sales/type";

export async function getItemSalesSummary(
  locationId: string,
  startDate: string,
  endDate?: string,
): Promise<ItemSalesSummary | null> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(`/api/v2/analytics/item-sales/summary`, {
      params: {
        locationId,
        startDate,
        ...(endDate && { endDate }),
      },
    });
    return parseStringify(data) as ItemSalesSummary;
  } catch {
    return null;
  }
}

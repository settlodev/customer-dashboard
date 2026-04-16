"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { StockMovement } from "@/types/stock-movement/type";
import { inventoryUrl } from "./inventory-client";

export async function getMovementsByLocation(
  locationId: string,
): Promise<StockMovement[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-movements/locations/${locationId}`),
    );
    return parseStringify(data) as StockMovement[];
  } catch {
    return [];
  }
}

export async function getMovementsByVariant(
  locationId: string,
  variantId: string,
): Promise<StockMovement[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-movements/locations/${locationId}/variants/${variantId}`),
    );
    return parseStringify(data) as StockMovement[];
  } catch {
    return [];
  }
}

"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import { inventoryUrl } from "./inventory-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

/**
 * Resolve the inventory balance for a variant at the user's current location.
 * Returns null when the location can't be resolved or the variant has no
 * balance row yet (treated as zero on hand by callers).
 */
export async function getCurrentLocationBalance(
  variantId: string,
): Promise<InventoryBalance | null> {
  const location = await getCurrentLocation();
  if (!location?.id) return null;
  return getBalance(location.id, variantId);
}

export async function getBalancesByLocation(
  locationId: string,
): Promise<InventoryBalance[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/inventory/locations/${locationId}`),
    );
    return parseStringify(data) as InventoryBalance[];
  } catch {
    return [];
  }
}

export async function getBalance(
  locationId: string,
  variantId: string,
): Promise<InventoryBalance | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/inventory/locations/${locationId}/variants/${variantId}`),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

export async function setLowStockThreshold(
  locationId: string,
  stockVariantId: string,
  threshold: number,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/inventory/locations/${locationId}/low-stock-threshold`),
    { stockVariantId, threshold },
  );
}

export async function setOverstockThreshold(
  locationId: string,
  stockVariantId: string,
  threshold: number,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/inventory/locations/${locationId}/overstock-threshold`),
    { stockVariantId, threshold },
  );
}

export async function setReorderConfig(
  locationId: string,
  stockVariantId: string,
  reorderPoint?: number,
  reorderQuantity?: number,
  preferredSupplierId?: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post(
    inventoryUrl(`/api/v1/inventory/locations/${locationId}/reorder-config`),
    { stockVariantId, reorderPoint, reorderQuantity, preferredSupplierId },
  );
}

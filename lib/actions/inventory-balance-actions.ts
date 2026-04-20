"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { InventoryBalance } from "@/types/inventory-balance/type";
import type { FormResponse } from "@/types/types";
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

/** Refresh any stock-variant related views after a config write. */
function revalidateBalancePaths(variantId: string) {
  revalidatePath("/stock-variants");
  revalidatePath(`/stock-variants/${variantId}`);
}

export async function setLowStockThreshold(
  locationId: string,
  stockVariantId: string,
  threshold: number,
): Promise<FormResponse<InventoryBalance>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/inventory/locations/${locationId}/low-stock-threshold`),
      { stockVariantId, threshold },
    )) as InventoryBalance;
    revalidateBalancePaths(stockVariantId);
    return {
      responseType: "success",
      message: "Low-stock threshold updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to update low-stock threshold",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function setOverstockThreshold(
  locationId: string,
  stockVariantId: string,
  threshold: number,
): Promise<FormResponse<InventoryBalance>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/inventory/locations/${locationId}/overstock-threshold`),
      { stockVariantId, threshold },
    )) as InventoryBalance;
    revalidateBalancePaths(stockVariantId);
    return {
      responseType: "success",
      message: "Overstock threshold updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to update overstock threshold",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function setReorderConfig(
  locationId: string,
  stockVariantId: string,
  input: {
    reorderPoint?: number | null;
    reorderQuantity?: number | null;
    preferredSupplierId?: string | null;
  },
): Promise<FormResponse<InventoryBalance>> {
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(`/api/v1/inventory/locations/${locationId}/reorder-config`),
      {
        stockVariantId,
        reorderPoint: input.reorderPoint,
        reorderQuantity: input.reorderQuantity,
        preferredSupplierId: input.preferredSupplierId,
      },
    )) as InventoryBalance;
    revalidateBalancePaths(stockVariantId);
    return {
      responseType: "success",
      message: "Reorder config updated",
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to update reorder config",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

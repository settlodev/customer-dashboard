"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { SupplierPerformance } from "@/types/supplier-performance/type";

/**
 * Read-only supplier performance metrics. Returns either a single
 * location-scoped record when locationId is supplied, or the array of
 * per-location records when it isn't. The component layer flattens both shapes.
 */
export async function getSupplierPerformance(
  supplierId: string,
  locationId?: string,
): Promise<SupplierPerformance[]> {
  try {
    const apiClient = new ApiClient();
    const params = locationId ? `?locationId=${locationId}` : "";
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/suppliers/${supplierId}/performance${params}`),
    );
    const parsed = parseStringify(data);
    if (!parsed) return [];
    return Array.isArray(parsed)
      ? (parsed as SupplierPerformance[])
      : [parsed as SupplierPerformance];
  } catch {
    return [];
  }
}

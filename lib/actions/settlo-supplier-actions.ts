"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { SettloSupplier } from "@/types/supplier/type";

/**
 * Marketplace-verified supplier catalog. Read-only from the business user's
 * perspective — business users link their local supplier to an entry here via
 * linkSettloSupplier.
 */
export async function fetchSettloSupplierCatalog(): Promise<SettloSupplier[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/supplier-catalog/suppliers"),
    );
    return (parseStringify(data) ?? []) as SettloSupplier[];
  } catch {
    return [];
  }
}

export async function getSettloSupplier(id: string): Promise<SettloSupplier | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-catalog/suppliers/${id}`),
    );
    return parseStringify(data) as SettloSupplier;
  } catch {
    return null;
  }
}

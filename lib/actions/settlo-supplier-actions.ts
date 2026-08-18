"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { SettloSupplierCatalogEntry } from "@/types/supplier/type";

/**
 * Marketplace-verified supplier catalog. Read-only from the business user's
 * perspective — business users link their local supplier to an entry here via
 * linkSettloSupplier. Every entry returned is, by construction, a verified,
 * marketplace-enabled supplier.
 */
export async function fetchSettloSupplierCatalog(): Promise<
  SettloSupplierCatalogEntry[]
> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/supplier-catalog/suppliers"),
    );
    return (parseStringify(data) ?? []) as SettloSupplierCatalogEntry[];
  } catch {
    return [];
  }
}

export async function getSettloSupplier(
  id: string,
): Promise<SettloSupplierCatalogEntry | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/supplier-catalog/suppliers/${id}`),
    );
    return parseStringify(data) as SettloSupplierCatalogEntry;
  } catch {
    return null;
  }
}

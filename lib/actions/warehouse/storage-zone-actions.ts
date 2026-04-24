"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "@/lib/actions/inventory-client";
import type { StorageZone } from "@/types/warehouse/storage-zone";

export async function getStorageZones(): Promise<StorageZone[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/warehouse/zones"));
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

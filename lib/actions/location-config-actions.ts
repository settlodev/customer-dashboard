"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { LocationConfig } from "@/types/location-config/type";

export async function getLocationConfig(): Promise<LocationConfig | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/location-config"));
    return parseStringify(data);
  } catch {
    return null;
  }
}

"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { StockBatch } from "@/types/stock-batch/type";

export async function getBatchesByVariant(
  variantId: string,
  status?: string,
): Promise<StockBatch[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ variantId, size: "100" });
    if (status) params.set("status", status);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches?${params}`),
    );
    const parsed = parseStringify(data);
    return parsed?.content ?? [];
  } catch {
    return [];
  }
}

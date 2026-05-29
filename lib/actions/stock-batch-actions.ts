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

/**
 * Lists ACTIVE batches whose {@code expiryDate} is on or before the
 * supplied date. Backed by {@code GET /api/v1/stock-batches/expiring}.
 *
 * The endpoint takes the location from the {@code X-Location-Id}
 * header (set by ApiClient interceptors) and returns the full
 * unpaginated list — practically bounded by how many batches a
 * location holds open at any time.
 */
export async function getExpiringBatches(
  beforeDate: string,
): Promise<StockBatch[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ before: beforeDate });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches/expiring?${params}`),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

/**
 * Lists EXPIRED batches at the active location. The underlying batch
 * endpoint is paginated; callers should request modest sizes
 * (default 100) for the dashboard report view.
 */
export async function getExpiredBatches(
  page: number = 0,
  size: number = 100,
): Promise<StockBatch[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      status: "EXPIRED",
      page: String(page),
      size: String(size),
      sortBy: "expiryDate",
      sortDirection: "desc",
    });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches?${params}`),
    );
    const parsed = parseStringify(data);
    return parsed?.content ?? [];
  } catch {
    return [];
  }
}

"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type { BatchPage, StockBatch } from "@/types/stock-batch/type";

const emptyBatchPage = (size: number): BatchPage => ({
  content: [],
  number: 0,
  size,
  totalElements: 0,
  totalPages: 0,
  last: true,
});

const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Normalise a paginated batch response.
 *
 * The Inventory Service serialises a raw Spring `Page` (0-based index on
 * `number`), while other Settlo services return a custom envelope keyed on
 * `page`. Accept either rather than depending on which one this endpoint
 * happens to use today, and derive `last` when it isn't sent.
 */
function toBatchPage(raw: unknown, size: number): BatchPage {
  const r = (raw ?? {}) as Record<string, unknown>;
  const content = Array.isArray(r.content) ? (r.content as StockBatch[]) : [];
  const number = num(r.number ?? r.page);
  const totalPages = num(r.totalPages);
  return {
    content,
    number,
    size: num(r.size, size) || size,
    totalElements: num(r.totalElements, content.length),
    totalPages,
    last:
      typeof r.last === "boolean"
        ? r.last
        : totalPages === 0 || number >= totalPages - 1,
  };
}

/**
 * One page of a single variant's batches, newest receipt first.
 *
 * Filters compose server-side, so `status` genuinely narrows within the
 * variant and the returned `totalElements` reflects the filtered set.
 */
export async function getVariantBatchesPage(q: {
  variantId: string;
  status?: string;
  batchNumber?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}): Promise<BatchPage> {
  const size = q.size ?? 25;
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      variantId: q.variantId,
      page: String(q.page ?? 0),
      size: String(size),
      sortBy: q.sortBy ?? "receivedDate",
      sortDirection: q.sortDirection ?? "desc",
    });
    if (q.status) params.set("status", q.status);
    if (q.batchNumber) params.set("batchNumber", q.batchNumber);
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches?${params}`),
    );
    return toBatchPage(parseStringify(data), size);
  } catch {
    return emptyBatchPage(size);
  }
}

/**
 * Every ACTIVE batch for a variant, in the exact order stock will be drawn
 * from them (FEFO for dated batches, then FIFO). Unpaginated — the open-batch
 * set for one variant is naturally small, since batches flip to DEPLETED once
 * consumed.
 *
 * This backs the panel's headline figures (which must span all open batches,
 * not just the visible page) and the "next to consume" ordering.
 */
export async function getBatchConsumptionOrder(
  variantId: string,
): Promise<StockBatch[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ variantId });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches/consumption-order?${params}`),
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as StockBatch[]) : [];
  } catch {
    return [];
  }
}

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

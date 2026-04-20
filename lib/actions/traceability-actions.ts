"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type { SerialNumber, StockBatchSummary } from "@/types/traceability/type";

// ── Serial search ──────────────────────────────────────────────────

export async function searchSerialNumbers(
  serialNumber: string,
): Promise<SerialNumber[]> {
  if (!serialNumber.trim()) return [];
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/serial-numbers/search?serialNumber=${encodeURIComponent(serialNumber.trim())}`,
      ),
    );
    return parseStringify(data) ?? [];
  } catch {
    return [];
  }
}

// ── Batch recall ───────────────────────────────────────────────────

export async function findBatchesByNumber(
  batchNumber: string,
): Promise<StockBatchSummary[]> {
  if (!batchNumber.trim()) return [];
  try {
    const apiClient = new ApiClient();
    // Reuse the batch list endpoint with a batchNumber filter. The backend
    // supports it via the generic list; here we piggy-back on /recall
    // preview by hitting the list and filtering client-side — keeps a single
    // round trip small.
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/stock-batches?size=200&sortBy=createdAt&sortDirection=desc`),
    );
    const all = (parseStringify(data)?.content ?? []) as StockBatchSummary[];
    const q = batchNumber.trim().toLowerCase();
    return all.filter((b) => b.batchNumber.toLowerCase().includes(q));
  } catch {
    return [];
  }
}

export async function recallBatch(batchNumber: string): Promise<FormResponse<StockBatchSummary[]>> {
  if (!batchNumber.trim()) {
    return { responseType: "error", message: "Batch number required" };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      inventoryUrl(
        `/api/v1/stock-batches/recall?batchNumber=${encodeURIComponent(batchNumber.trim())}`,
      ),
      {},
    )) as StockBatchSummary[];
    revalidatePath("/traceability");
    return {
      responseType: "success",
      message: `Recalled ${data?.length ?? 0} batch record(s) across locations`,
      data: parseStringify(data),
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Failed to recall batch",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

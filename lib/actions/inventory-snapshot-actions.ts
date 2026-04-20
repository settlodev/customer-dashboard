"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { inventoryUrl } from "./inventory-client";
import type { FormResponse } from "@/types/types";
import type {
  DailySnapshotSummary,
  InventorySnapshot,
} from "@/types/inventory-snapshot/type";

/**
 * Day-level history for a single stock variant. Drives the per-item time-series
 * charts (qty on hand, value, movement mix).
 */
export async function getVariantSnapshotHistory(
  variantId: string,
  from: string,
  to: string,
): Promise<InventorySnapshot[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/inventory-snapshots/variant/${variantId}?from=${from}&to=${to}`,
      ),
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as InventorySnapshot[]) : [];
  } catch {
    return [];
  }
}

/**
 * Every variant's snapshots across a date range — the raw feed for the
 * location-wide stock report. Callers collapse by date for charts.
 */
export async function getLocationSnapshotRange(
  from: string,
  to: string,
): Promise<InventorySnapshot[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/inventory-snapshots/range?from=${from}&to=${to}`),
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as InventorySnapshot[]) : [];
  } catch {
    return [];
  }
}

/**
 * Read today's snapshot if it exists. Used to show a "closed / open" status on
 * the report page. Returns null when the endpoint errors (e.g. the day hasn't
 * been closed yet and the backend treats it as not-found).
 */
export async function getSnapshotForDate(
  date: string,
): Promise<DailySnapshotSummary | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/inventory-snapshots?date=${date}`),
    );
    const parsed = parseStringify(data) as DailySnapshotSummary | null;
    return parsed && parsed.snapshotDate ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Close the current business day — writes snapshot rows for every variant and
 * publishes the day-closed event. Triggered from the stock report header.
 */
export async function closeBusinessDay(): Promise<
  FormResponse<DailySnapshotSummary>
> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl("/api/v1/inventory-snapshots/close-day"),
      {},
    );
    revalidatePath("/report/stock");
    return {
      responseType: "success",
      message: "Business day closed",
      data: parseStringify(data) as DailySnapshotSummary,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't close the day",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Generate (or re-generate) a snapshot for an arbitrary past date. Useful for
 * backfilling charts or re-running a day after data corrections.
 */
export async function generateSnapshotForDate(
  date: string,
): Promise<FormResponse<DailySnapshotSummary>> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post(
      inventoryUrl(`/api/v1/inventory-snapshots/generate?date=${date}`),
      {},
    );
    revalidatePath("/report/stock");
    return {
      responseType: "success",
      message: `Snapshot generated for ${date}`,
      data: parseStringify(data) as DailySnapshotSummary,
    };
  } catch (error: any) {
    return {
      responseType: "error",
      message: error?.message ?? "Couldn't generate snapshot",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

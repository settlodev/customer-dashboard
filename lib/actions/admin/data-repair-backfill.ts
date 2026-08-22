"use server";

import { omsInternalPost } from "@/lib/oms-internal-client";
import { reportsInternalPost } from "@/lib/reports-internal-client";
import { parseStringify } from "@/lib/utils";
import { FormResponse } from "@/types/types";

/**
 * The parameterized legs of the analytics backfill, proxied through the
 * internal-secret clients so nothing needs curl:
 *
 * - Order resync (OMS): re-broadcasts every non-deleted order's current state
 *   on ORDER_RESYNC — the Reports-only topic — for a business-date range.
 *   Run in month-sized slices, oldest first.
 * - Inventory sweep (Reports): step 2 of the balance reconciliation; archives
 *   fact_inventory_current rows the balance republish did not refresh.
 * - Signup-cohort recompute (Reports): rebuilds saas_signup_cohorts_daily for
 *   a date range from the healed dims (the nightly job only computes
 *   yesterday, so backfilled history needs this once).
 */

export async function resyncOrders(
  from: string,
  to: string,
): Promise<FormResponse<{ ordersReemitted: number }>> {
  try {
    const result = await omsInternalPost<{ ordersReemitted: number }>(
      `/api/v1/admin/orders/resync`,
      undefined,
      { from, to },
    );
    const n = result?.ordersReemitted ?? 0;
    return parseStringify({
      responseType: "success",
      message: `Re-broadcast ${n} order${n === 1 ? "" : "s"} (${from} – ${to}). Sales facts converge as the events drain.`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to resync orders",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function sweepStaleInventoryCurrent(
  olderThanMinutes: number,
): Promise<FormResponse<{ rowsArchived: number }>> {
  try {
    const result = await reportsInternalPost<{ rowsArchived: number }>(
      `/api/v2/internal/maintenance/inventory-current-sweep`,
      { olderThanMinutes },
    );
    const n = result?.rowsArchived ?? 0;
    return parseStringify({
      responseType: "success",
      message:
        n === 0
          ? "No stale rows found — every inventory row was refreshed by the balance backfill."
          : `Archived ${n} phantom inventory row${n === 1 ? "" : "s"}. Totals now reflect live balances only.`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to sweep stale inventory rows",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function recomputeSignupCohorts(
  startDate: string,
  endDate: string,
): Promise<FormResponse<{ status: string }>> {
  try {
    const result = await reportsInternalPost<{ status: string }>(
      `/api/v2/internal/metrics/saas/signups/recompute`,
      { startDate, endDate },
    );
    return parseStringify({
      responseType: "success",
      message: `Signup cohorts recomputed for ${startDate} – ${endDate}.`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to recompute signup cohorts",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

export async function refreshAnalyticsSnapshots(): Promise<
  FormResponse<{ tookMs: number }>
> {
  try {
    const result = await reportsInternalPost<{ tookMs: number }>(
      `/api/v2/internal/maintenance/refresh-snapshots`,
    );
    return parseStringify({
      responseType: "success",
      message: `Snapshots re-published in ${Math.round((result?.tookMs ?? 0) / 1000)}s — the dashboard headline numbers now reflect the backfilled data.`,
      data: result,
    });
  } catch (error: any) {
    return parseStringify({
      responseType: "error",
      message: error?.message || "Failed to refresh snapshots",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

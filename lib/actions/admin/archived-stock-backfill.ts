"use server";

import {
  reportsInternalGet,
  reportsInternalPost,
} from "@/lib/reports-internal-client";

/**
 * Result of an archived-stock backfill scan or apply (Reports Service
 * {@code ArchivedStockBackfillService.BackfillReport}). Stock deleted or
 * archived before the July 2026 propagation fix left its variant dims and
 * {@code fact_inventory_current} rows active, so inventory dashboards kept
 * counting the retired stock's value and units.
 */
export interface ArchivedStockBackfillReport {
  /** Active variant SKUs whose parent stock is archived (dry run) or archived by the run. */
  variantDimsArchived: number;
  /** Live-value rows still counted for archived stock (dry run) or flagged by the run. */
  factRowsFlagged: number;
  /** false = dry run (nothing changed); true = the backfill ran. */
  applied: boolean;
}

const PATH = "/api/v2/internal/maintenance/archived-stock-backfill";

// Long fields arrive as JSON numbers; coerce defensively so a string can
// never leak into the UI's arithmetic.
function normalize(
  r: Partial<ArchivedStockBackfillReport>,
): ArchivedStockBackfillReport {
  return {
    variantDimsArchived: Number(r.variantDimsArchived ?? 0),
    factRowsFlagged: Number(r.factRowsFlagged ?? 0),
    applied: Boolean(r.applied),
  };
}

/** Dry run: report the historical gap without changing anything. Always safe. */
export async function scanArchivedStockBackfill(): Promise<ArchivedStockBackfillReport> {
  return normalize(
    await reportsInternalGet<Partial<ArchivedStockBackfillReport>>(PATH),
  );
}

/**
 * Apply the backfill: archive the orphaned variant SKUs and flag their
 * live-value rows so historical deletes drop out of inventory totals.
 * Idempotent — a second run finds nothing.
 */
export async function applyArchivedStockBackfill(): Promise<ArchivedStockBackfillReport> {
  return normalize(
    await reportsInternalPost<Partial<ArchivedStockBackfillReport>>(
      `${PATH}/apply`,
    ),
  );
}

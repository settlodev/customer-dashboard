"use server";

import {
  reportsInternalGet,
  reportsInternalPost,
} from "@/lib/reports-internal-client";

/**
 * Result of a re-parented-duplicate scan or purge (Reports Service
 * {@code OrderItemDedupService.DedupReport}). A merge/split/transfer that moved
 * a line before the ingest fix shipped left a stale copy in
 * {@code fact_order_items}; these count the copies that would be / were removed.
 */
export interface DedupReport {
  /** How many locations the run covered (1 when scoped, else every location). */
  locationsScanned: number;
  /** Stale duplicate rows found (dry run) or deleted (purge). */
  staleRows: number;
  /** Distinct physical lines those rows belong to. */
  itemsAffected: number;
  /** Summed line value of the stale copies — the sales-report over-count they caused. */
  valueReclaimed: number;
  /** false = dry run (nothing changed); true = the rows were deleted. */
  applied: boolean;
  /**
   * Stale rows whose keeper sits on a DIFFERENT order — a genuine
   * merge/split/transfer re-parent. Any of these dated after the
   * `reparentedItemIds` fix shipped means the forward fix is still leaking.
   */
  crossOrderRows: number;
  /**
   * Stale rows whose keeper is the SAME order on another business date.
   * Nothing was re-parented — the order's events were filed under two dates.
   * A different bug with the same symptom; the re-parent fix never covered it.
   */
  sameOrderRows: number;
  /** Oldest business date carrying a stale row (yyyy-MM-dd), null when none. */
  earliestStaleDate: string | null;
  /** Newest business date carrying a stale row (yyyy-MM-dd), null when none. */
  latestStaleDate: string | null;
  /**
   * Newest business date carrying a CROSS-ORDER stale row — compare against the
   * deploy date to tell an uncleared backlog from an active leak.
   */
  latestCrossOrderDate: string | null;
}

export interface DedupScope {
  /** A single location, or null/undefined to sweep every location. */
  locationId?: string | null;
  /** Optional inclusive business-date bounds (yyyy-MM-dd). */
  from?: string | null;
  to?: string | null;
}

const PATH = "/api/v2/internal/maintenance/reparented-duplicates";

// BigDecimal/long fields arrive as JSON numbers; coerce defensively so a string
// (e.g. big-decimal-as-plain) can never leak into the UI's arithmetic.
function normalize(r: Partial<DedupReport>): DedupReport {
  return {
    locationsScanned: Number(r.locationsScanned ?? 0),
    staleRows: Number(r.staleRows ?? 0),
    itemsAffected: Number(r.itemsAffected ?? 0),
    valueReclaimed: Number(r.valueReclaimed ?? 0),
    applied: Boolean(r.applied),
    crossOrderRows: Number(r.crossOrderRows ?? 0),
    sameOrderRows: Number(r.sameOrderRows ?? 0),
    earliestStaleDate: r.earliestStaleDate ?? null,
    latestStaleDate: r.latestStaleDate ?? null,
    latestCrossOrderDate: r.latestCrossOrderDate ?? null,
  };
}

function query(scope: DedupScope) {
  return {
    locationId: scope.locationId ?? undefined,
    from: scope.from ?? undefined,
    to: scope.to ?? undefined,
  };
}

/** Dry run: report the stale rows without deleting anything. Always safe. */
export async function scanReparentedDuplicates(
  scope: DedupScope = {},
): Promise<DedupReport> {
  return normalize(await reportsInternalGet<Partial<DedupReport>>(PATH, query(scope)));
}

/** Destructive: delete the stale copies, keeping each line's current-owner row. */
export async function purgeReparentedDuplicates(
  scope: DedupScope = {},
): Promise<DedupReport> {
  return normalize(
    await reportsInternalPost<Partial<DedupReport>>(`${PATH}/purge`, query(scope)),
  );
}

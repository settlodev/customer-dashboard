"use server";

import ApiClient from "@/lib/settlo-api-client";

/**
 * One order line whose stock deduction disagrees with what it sold
 * (Inventory Service `DeductionDiscrepancy`).
 */
export interface DeductionDiscrepancy {
  orderId: string;
  orderNumber: string;
  locationId: string;
  businessDate: string;
  orderStatus: string;
  orderItemId: string;
  productVariantId: string;
  stockVariantId: string | null;
  itemName: string;
  removedLine: boolean;
  soldQuantity: number;
  deductedQuantity: number;
  /**
   * sold − deducted. POSITIVE means stock left the building without coming off
   * the books (on-hand reads high); NEGATIVE means it was deducted twice.
   */
  shortfall: number;
}

/** Inventory Service `DeductionReconciliationReport`. */
export interface DeductionReconciliationReport {
  /** null when the run swept every active location. */
  locationId: string | null;
  from: string;
  to: string;
  locationsScanned: number;
  ordersChecked: number;
  linesChecked: number;
  discrepancyCount: number;
  netShortfall: number;
  /** The run hit its cap — these results are PARTIAL, not a clean bill. */
  truncated: boolean;
  discrepancies: DeductionDiscrepancy[];
}

/** Outcome for one line submitted to the repair endpoint. */
export interface RepairLineResult {
  orderId: string;
  orderItemId: string;
  outcome: "CORRECTED" | "SKIPPED" | "FAILED";
  correctedQuantity: number;
  modificationNumber: string | null;
  message: string;
}

export interface RepairResult {
  linesRequested: number;
  linesCorrected: number;
  correctedQuantity: number;
  lines: RepairLineResult[];
}

const PATH = "/api/v1/admin/deduction-reconciliation/preview";

// Quantities arrive as JSON numbers from BigDecimal columns; coerce defensively
// so a string can never reach the UI's arithmetic or formatting.
function normalize(
  r: Partial<DeductionReconciliationReport>,
): DeductionReconciliationReport {
  return {
    locationId: r.locationId ?? null,
    from: String(r.from ?? ""),
    to: String(r.to ?? ""),
    locationsScanned: Number(r.locationsScanned ?? 0),
    ordersChecked: Number(r.ordersChecked ?? 0),
    linesChecked: Number(r.linesChecked ?? 0),
    discrepancyCount: Number(r.discrepancyCount ?? 0),
    netShortfall: Number(r.netShortfall ?? 0),
    truncated: Boolean(r.truncated),
    discrepancies: (r.discrepancies ?? []).map((d) => ({
      ...d,
      soldQuantity: Number(d.soldQuantity ?? 0),
      deductedQuantity: Number(d.deductedQuantity ?? 0),
      shortfall: Number(d.shortfall ?? 0),
    })),
  };
}

/**
 * Compare what each order line sold (Order Management) against what Inventory
 * deducted, over a business-date window.
 *
 * <p>Read-only — it reports, it never corrects. Inventory reaches OMS
 * synchronously to answer this, so a slow or unreachable OMS surfaces as a
 * failure here rather than a partial (and therefore misleading) report.
 */
export async function scanDeductionReconciliation(
  locationId: string | null,
  from: string | null,
  to: string | null,
): Promise<DeductionReconciliationReport> {
  // Omit rather than send empty: the service treats a MISSING param as
  // "all locations" / "default lookback", and an empty string would fail to
  // parse as a UUID or date.
  const params: Record<string, string> = {};
  if (locationId) params.locationId = locationId;
  if (from) params.from = from;
  if (to) params.to = to;

  const report = await new ApiClient("inventory", "staff").get<
    Partial<DeductionReconciliationReport>
  >(PATH, { params });
  return normalize(report);
}

/**
 * Correct the selected lines. Sends identifiers and the ORDER's sold quantity —
 * never a shortfall — so the service re-derives what is owed from live data and
 * a stale preview cannot post a correction that has already been made.
 *
 * Each shortfall becomes a CORRECTION stock modification dated today. Requires
 * internal:repair:execute.
 */
export async function repairDeductionDiscrepancies(
  lines: Array<{
    orderId: string;
    orderItemId: string;
    soldQuantity: number;
  }>,
): Promise<RepairResult> {
  const result = await new ApiClient("inventory", "staff").post<
    Partial<RepairResult>,
    { lines: typeof lines }
  >(`${PATH.replace("/preview", "")}/repair`, { lines });

  return {
    linesRequested: Number(result.linesRequested ?? 0),
    linesCorrected: Number(result.linesCorrected ?? 0),
    correctedQuantity: Number(result.correctedQuantity ?? 0),
    lines: (result.lines ?? []).map((l) => ({
      ...l,
      correctedQuantity: Number(l.correctedQuantity ?? 0),
    })),
  };
}

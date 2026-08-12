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
  locationId: string;
  from: string;
  to: string;
  ordersChecked: number;
  linesChecked: number;
  discrepancyCount: number;
  netShortfall: number;
  discrepancies: DeductionDiscrepancy[];
}

const PATH = "/api/v1/admin/deduction-reconciliation/preview";

// Quantities arrive as JSON numbers from BigDecimal columns; coerce defensively
// so a string can never reach the UI's arithmetic or formatting.
function normalize(
  r: Partial<DeductionReconciliationReport>,
): DeductionReconciliationReport {
  return {
    locationId: String(r.locationId ?? ""),
    from: String(r.from ?? ""),
    to: String(r.to ?? ""),
    ordersChecked: Number(r.ordersChecked ?? 0),
    linesChecked: Number(r.linesChecked ?? 0),
    discrepancyCount: Number(r.discrepancyCount ?? 0),
    netShortfall: Number(r.netShortfall ?? 0),
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
  locationId: string,
  from: string,
  to: string,
): Promise<DeductionReconciliationReport> {
  const report = await new ApiClient("inventory", "staff").get<
    Partial<DeductionReconciliationReport>
  >(PATH, { params: { locationId, from, to } });
  return normalize(report);
}

import type { GrnItem } from "@/types/grn/type";

/**
 * The quantity of a GRN line actually accepted into stock — i.e. what the
 * supplier is owed for. Mirrors the inventory service's GRN receive() logic:
 *   - FAILED inspection  -> 0 (whole line skipped on receipt)
 *   - PARTIAL inspection -> (inspectedQuantity ?? receivedQuantity) - rejectedQuantity
 *   - PASSED / PENDING / no inspection -> receivedQuantity
 */
function acceptedQuantity(item: GrnItem): number {
  if (item.inspectionStatus === "FAILED") return 0;
  if (item.inspectionStatus === "PARTIAL") {
    const inspected = item.inspectedQuantity ?? item.receivedQuantity;
    const rejected = item.rejectedQuantity ?? 0;
    return Math.max(0, inspected - rejected);
  }
  return item.receivedQuantity;
}

/** Round a money amount to 2 decimal places (avoids IEEE754 float artifacts). */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Value of a delivery for supplier-bill payment: Σ(accepted quantity × unitCost)
 * across GRN lines, in the location's base currency, rounded to 2 decimals.
 * Landed costs (freight/duty) are deliberately excluded — they are not part of
 * what is owed to the supplier on the LPO-derived bill. Accepted quantity nets
 * out inspection rejections (see acceptedQuantity), so a line that fails or
 * partially fails QC is not overcharged.
 */
export function grnDeliveryValue(items: GrnItem[]): number {
  const raw = items.reduce(
    (sum, item) => sum + acceptedQuantity(item) * item.unitCost,
    0,
  );
  return round2(raw);
}

/**
 * Amount to prefill into the payment form for a delivery against a bill.
 * Defaults to this delivery's value, clamped to the bill's outstanding balance
 * so it can never exceed what is owed. When the delivery completes the PO (LPO
 * fully received), default to the full outstanding balance so the bill closes
 * cleanly with no rounding/FX remainder. Result is rounded to 2 decimals.
 */
export function computeBillPrefill(
  deliveryValue: number,
  balanceDue: number,
  lpoFullyReceived: boolean,
): number {
  if (lpoFullyReceived) return round2(balanceDue);
  return round2(Math.min(deliveryValue, balanceDue));
}

import type { GrnItem } from "@/types/grn/type";

/**
 * Value of a delivery for supplier-bill payment: Σ(receivedQuantity × unitCost)
 * across GRN lines, in the location's base currency. Landed costs (freight/duty)
 * are deliberately excluded — they are not part of what is owed to the supplier
 * on the LPO-derived bill. Uses receivedQuantity as-is; inspection-adjusted
 * (passed-minus-rejected) quantities are a future refinement.
 */
export function grnDeliveryValue(items: GrnItem[]): number {
  return items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0,
  );
}

/**
 * Amount to prefill into the payment form for a delivery against a bill.
 * Defaults to this delivery's value, clamped to the bill's outstanding balance
 * so it can never exceed what is owed. When the delivery completes the PO (LPO
 * fully received), default to the full outstanding balance so the bill closes
 * cleanly with no rounding/FX remainder.
 */
export function computeBillPrefill(
  deliveryValue: number,
  balanceDue: number,
  lpoFullyReceived: boolean,
): number {
  if (lpoFullyReceived) return balanceDue;
  return Math.min(deliveryValue, balanceDue);
}

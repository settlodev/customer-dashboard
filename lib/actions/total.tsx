/**
 * @/lib/proforma/totals
 *
 * Single source of truth for proforma money logic. Both the wizard
 * (ProformaWizard) and the printable document (InvoiceDocument) import from
 * here so the two can't drift apart.
 */

import type { Proforma } from "@/types/proforma/type";

/** Return the first value in the list that is a number greater than zero. */
export function firstPositive(
  values: Array<number | null | undefined>,
): number {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  }
  return 0;
}

/**
 * Resolve the discount actually applied to a proforma.
 *
 * THE BUG THIS REPLACES: `totalDiscountAmount ?? manualDiscountAmount`.
 * `??` only falls through on null/undefined, and the backend sends
 * `totalDiscountAmount: 0` — a real number — so a manual discount was silently
 * dropped everywhere this pattern appeared.
 */
export function resolveDiscount(
  p: Pick<
    Proforma,
    "totalDiscountAmount" | "manualDiscountAmount" | "appliedDiscountAmount"
  >,
): number {
  return firstPositive([
    p.totalDiscountAmount,
    p.manualDiscountAmount,
    p.appliedDiscountAmount,
  ]);
}

/** Money comparison that tolerates float noise. */
export function nearlyEqual(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
}

/** Derive the VAT rate from the payload rather than hardcoding 18%. */
export function deriveVatRate(
  taxExclusiveGross: number,
  taxAmount: number,
): number | null {
  if (taxExclusiveGross <= 0 || taxAmount <= 0) return null;
  return Math.round((taxAmount / taxExclusiveGross) * 100);
}

export interface ResolvedTotals {
  taxExclusiveGross: number;
  taxAmount: number;
  grossAmount: number;
  discountAmount: number;
  /** What the server said. */
  serverNet: number;
  /** gross - discount. */
  computedNet: number;
  /** True when the server's net doesn't reconcile with gross - discount. */
  mismatch: boolean;
  /** The figure to actually display. */
  netAmount: number;
  vatRate: number | null;
}

/**
 * Resolve every money figure for display.
 *
 * `preferComputed` decides what to show when the server's `netAmount` doesn't
 * equal `gross - discount`. Leave it `true` until the backend correctly applies
 * `manualDiscountAmount` to `netAmount`; then flip it to `false` so the server
 * is authoritative.
 */
export function resolveTotals(
  p: Pick<
    Proforma,
    | "taxExclusiveGrossAmount"
    | "taxAmount"
    | "grossAmount"
    | "netAmount"
    | "totalDiscountAmount"
    | "manualDiscountAmount"
    | "appliedDiscountAmount"
  >,
  preferComputed = true,
): ResolvedTotals {
  const taxExclusiveGross = p.taxExclusiveGrossAmount ?? 0;
  const taxAmount = p.taxAmount ?? 0;
  const grossAmount = p.grossAmount ?? 0;
  const serverNet = p.netAmount ?? 0;

  const discountAmount = resolveDiscount(p);
  const computedNet = Math.max(0, grossAmount - discountAmount);
  const mismatch = discountAmount > 0 && !nearlyEqual(serverNet, computedNet);

  return {
    taxExclusiveGross,
    taxAmount,
    grossAmount,
    discountAmount,
    serverNet,
    computedNet,
    mismatch,
    netAmount: mismatch && preferComputed ? computedNet : serverNet,
    vatRate: deriveVatRate(taxExclusiveGross, taxAmount),
  };
}

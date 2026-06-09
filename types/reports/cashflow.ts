// View-model types + helpers for the cashflow report screen.
//
// The screen is backed by the existing `cashFlowReport` action
// (`GET /api/reports/{location}/cash-flow/summary` → `CashFlow`). That
// endpoint returns period TOTALS plus an inflow split by payment method;
// it does not (yet) return a daily series, so the trend chart consumes a
// modeled distribution (see `lib/reports/cashflow-trend.ts`) until the
// reports service grows a real per-day endpoint.

import type { CashFlow } from "@/types/orders/type";
import type { PaymentMethodBreakdown } from "@/types/reports/payment-methods";

// ─── Trend (chart) ──────────────────────────────────────────────────
// One time bucket on the cash-flow-over-time chart. `cashOut` is a
// positive magnitude — the chart flips it negative so outflow falls
// below the zero line.

export interface CashflowTrendPoint {
  /** Axis label, e.g. "Jun 3". */
  label: string;
  /** yyyy-MM-dd of the bucket. */
  date: string;
  /** Money in (sales receipts) for the bucket. */
  cashIn: number;
  /** Money out (expenses + refunds) for the bucket. */
  cashOut: number;
  /** cashIn − cashOut. */
  net: number;
}

// ─── Inflow breakdown row ───────────────────────────────────────────
// One payment method's contribution to total cash in, with its share of
// the period total computed client-side (the summary endpoint only
// returns name + amount).

export interface CashflowMethodRow {
  name: string;
  amount: number;
  /** Share of total inflow, 0–100. */
  share: number;
  /**
   * Settled transaction count for this tender. Present only when the row is
   * backed by the richer `/by-payment-method` endpoint; the summary
   * fallback (`paymentMethodTotals`) carries amounts only.
   */
  count?: number;
}

/**
 * Map the richer `/api/v2/analytics/transactions/by-payment-method` rows
 * into breakdown rows. Keeps the server-computed `percentage` (falling back
 * to a share computed off the set total when the server omits it) and the
 * per-tender transaction count. Sorted high → low by amount.
 */
export function breakdownToMethodRows(
  rows: PaymentMethodBreakdown[] | null,
): CashflowMethodRow[] {
  const list = rows ?? [];
  const sum = list.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
  return list
    .map((r) => ({
      name: r.acceptedPaymentMethodTypeName?.trim() || "Unknown",
      amount: r.totalAmount || 0,
      share:
        r.percentage != null && r.percentage > 0
          ? r.percentage
          : sum > 0
            ? ((r.totalAmount || 0) / sum) * 100
            : 0,
      count: r.transactionCount ?? 0,
    }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Fallback inflow-by-method rows derived from the cash-flow summary's
 * embedded `paymentMethodTotals` (name + amount only — no counts). Used
 * when the richer by-payment-method endpoint returns nothing.
 */
export function toMethodRows(report: CashFlow | null): CashflowMethodRow[] {
  const totals = report?.paymentMethodTotals ?? [];
  const sum = totals.reduce((acc, m) => acc + (m.amount || 0), 0);
  return totals
    .map((m) => ({
      name: m.paymentMethodName?.trim() || "Unspecified",
      amount: m.amount || 0,
      share: sum > 0 ? ((m.amount || 0) / sum) * 100 : 0,
    }))
    .filter((m) => m.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

// ─── Formatting ─────────────────────────────────────────────────────

/** Thousands-grouped magnitude — the currency code is rendered separately. */
export const fmtAmount = (value: number): string =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );

// View-model types + helpers for the cashflow report screen.
//
// The screen is backed by the Reports Service analytics endpoints:
// `/api/v2/analytics/overview` for the totals, `/cash-flow/daily` for the
// real per-day trend, and `/transactions/by-payment-method` for the inflow
// split. The pre-migration `/api/reports/{location}/cash-flow/summary`
// summary endpoint never existed on the analytics service and has been
// removed along with its `cashFlowReport` action and `CashFlow` type.

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
  /**
   * `acceptedPaymentMethodType` id — the key the transaction drill-down
   * filters on. Null for rows whose tender id never reached the fact table.
   */
  id?: string | null;
  /** When set, the row renders as a link into the transaction drill-down. */
  href?: string;
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
      id: r.acceptedPaymentMethodType ? String(r.acceptedPaymentMethodType) : null,
    }))
    .filter((r) => r.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

// ─── Transaction drill-down (line items) ────────────────────────────
// Shapes mirror the Reports Service DTOs 1:1 (Jackson camelCase):
// `CashFlowTransactionListDto` (`/cash-flow/transactions`),
// `RefundDetailsResponseDto` (`/refunds/details`) and `ExpenseListDto`
// (`/expenses`). All three embed their own filtered totals + paging so
// the section header can never disagree with the table it captions.

/**
 * Detail-section sub-views. The list lives here — not in the client tab
 * nav — because the server page validates `?view=` against it, and a
 * runtime value exported from a "use client" module reaches server
 * components only as an opaque client reference.
 */
export type CashflowDetailView = "payments" | "refunds" | "expenses";

export const CASHFLOW_DETAIL_VIEWS: CashflowDetailView[] = [
  "payments",
  "refunds",
  "expenses",
];

/** One settled transaction (`TransactionReportDto`). */
export interface CashflowTransactionRow {
  transactionId: string | null;
  orderId: string | null;
  orderNumber: string | null;
  locationId: string | null;
  locationName: string | null;
  /** yyyy-MM-dd. */
  businessDate: string | null;
  /** ISO datetime with offset; null for legacy rows. */
  transactionDate: string | null;
  acceptedPaymentMethodType: string | null;
  acceptedPaymentMethodTypeName: string | null;
  /** CASH_PAYMENT / CARD / COMPLIMENTARY / SIGNED_BILL / … */
  paymentType: string | null;
  amount: number;
  tipAmount: number;
  staffId: string | null;
  staffName: string | null;
  orderStaffId: string | null;
  orderStaffName: string | null;
  isRefund: boolean;
}

export interface CashflowTransactionList {
  paymentMethodTypeId: string | null;
  /** sum(amount) over the filtered set — all pages, complimentary included. */
  totalAmount: number;
  totalTips: number;
  /** Portion of `totalAmount` that is complimentary (excluded from cash in). */
  complimentaryAmount: number;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  transactions: CashflowTransactionRow[];
}

/** One refund line (`RefundReportDto`) — one row per refunded order item. */
export interface CashflowRefundRow {
  id: string | null;
  businessDate: string | null;
  orderId: string | null;
  orderItemId: string | null;
  orderNumber: string | null;
  orderItemName: string | null;
  quantity: number;
  refundNetAmount: number;
  stockReturned: boolean;
  reason: string | null;
  refundType: string | null;
  /** ISO datetime with offset. */
  refundDate: string | null;
  refundedBy: string | null;
  refundedByName: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
}

export interface CashflowRefundList {
  totalRefundCount: number;
  totalRefundedAmount: number;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  refunds: CashflowRefundRow[];
}

/** One expense (`ExpenseItemDto`). `paidAmount` is the cash-out figure. */
export interface CashflowExpenseRow {
  expenseId: string | null;
  name: string | null;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  /** PAID / PARTIALLY_PAID / UNPAID. */
  status: string | null;
  categoryId: string | null;
  categoryName: string | null;
  staffId: string | null;
  staffName: string | null;
  /** yyyy-MM-dd business date. */
  date: string | null;
}

export interface CashflowExpenseList {
  totalExpenses: number;
  totalExpenseAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  expenses: CashflowExpenseRow[];
}

// ─── Formatting ─────────────────────────────────────────────────────

/** Thousands-grouped magnitude — the currency code is rendered separately. */
export const fmtAmount = (value: number): string =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );

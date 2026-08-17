// View-model types + helpers for the refunds dashboard.
//
// Everything here mirrors the Reports Service `RefundDashboardDto`
// (`GET /api/v2/analytics/refunds/dashboard`) 1:1 in Jackson camelCase. That
// endpoint answers the whole screen in one read so the KPI strip, the trend
// and every breakdown are provably the same slice of `fact_refunds`.
//
// The detail table under the dashboard still comes from `/refunds/details`
// (see `RefundDetailsResponse` in types/refunds/type.ts) — it pages, and the
// dashboard aggregates don't.

import { format } from "date-fns";

/**
 * One slice of a breakdown — reason, refund type, payback method, item or
 * staff. `share` is server-computed against the range-wide refunded amount,
 * so a top-N truncated list still reports honest proportions of the whole.
 */
export interface RefundBreakdownRow {
  /** Entity id for item/staff rows; null for enum-keyed rows. */
  id: string | null;
  /** Machine key — the enum code, or the entity id as text. */
  key: string;
  /** Display label: the item/staff name, or a humanised enum code. */
  label: string;
  refundCount: number;
  quantity: number;
  refundedAmount: number;
  /** COGS of the refunded units; only populated on the item breakdown. */
  returnedCost: number | null;
  /** Percentage of the range's total refunded amount, 0–100. */
  share: number;
}

/** One business day of refund activity. Days without refunds are absent. */
export interface RefundTrendPoint {
  /** yyyy-MM-dd. */
  businessDate: string | null;
  refundCount: number;
  refundedAmount: number;
  quantity: number;
}

export interface RefundDashboard {
  locationId: string | null;
  locationName: string | null;
  startDate: string | null;
  endDate: string | null;

  totalRefundCount: number;
  totalRefundedAmount: number;
  /** COGS that came back with the refunded units. */
  totalReturnedCost: number;
  /** Units returned across every refund. */
  totalQuantity: number;
  /** Distinct orders touched by at least one refund. */
  refundedOrderCount: number;
  restockedCount: number;
  restockedQuantity: number;
  averageRefundAmount: number;
  largestRefundAmount: number;

  trend: RefundTrendPoint[];
  byReason: RefundBreakdownRow[];
  byRefundType: RefundBreakdownRow[];
  byPaymentMethod: RefundBreakdownRow[];
  topItems: RefundBreakdownRow[];
  byStaff: RefundBreakdownRow[];
}

/**
 * One refund in full (`RefundRecordDto`, `GET /refunds/{id}`) — the detail
 * page's record. Richer than the list row: the picked reason enum alongside
 * the free-text note, how the money went back, the original seller, and the
 * day session it settled in.
 */
export interface RefundRecord {
  id: string | null;
  locationId: string | null;
  locationName: string | null;
  /** yyyy-MM-dd. */
  businessDate: string | null;
  daySessionId: string | null;

  orderId: string | null;
  orderItemId: string | null;
  orderNumber: string | null;
  orderItemName: string | null;

  quantity: number;
  refundNetAmount: number;
  returnedCost: number | null;
  stockReturned: boolean;

  reason: string | null;
  reasonType: string | null;
  refundType: string | null;
  paymentMethodCode: string | null;
  /** ISO datetime with offset. */
  refundDate: string | null;

  refundedBy: string | null;
  refundedByName: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  originalStaffId: string | null;
  originalStaffName: string | null;
}

// ─── Enum vocabulary ────────────────────────────────────────────────
// `RefundReason` / `RefundType` as they're spelled in Settlo Common
// (`co.tz.settlo.common.enums`). Kept here rather than in a component so the
// server pages, the table columns and the detail view all read one list.

export const REFUND_REASON_LABELS: Record<string, string> = {
  CUSTOMER_REQUEST: "Customer request",
  DAMAGED: "Damaged",
  WRONG_ITEM: "Wrong item",
  STAFF_ERROR: "Staff error",
  QUALITY: "Quality",
  LATE_DELIVERY: "Late delivery",
  DUPLICATE: "Duplicate",
  OTHER: "Other",
};

export const REFUND_TYPE_LABELS: Record<string, string> = {
  FULL: "Full",
  PARTIAL: "Partial",
  ITEM_RETURN: "Item return",
  STORE_CREDIT: "Store credit",
};

/** Filter-dropdown choices for the refunds list, in the enum's own order. */
export const REFUND_REASON_FILTER_OPTIONS = Object.entries(
  REFUND_REASON_LABELS,
).map(([value, label]) => ({ label, value }));

/**
 * Humanise an unmapped code rather than showing the raw SCREAMING_CASE.
 * Mirrors the Reports Service's own `humanise` (including the M-Pesa brand
 * spelling) so a payback method reads the same on the dashboard breakdown as
 * it does on a refund's detail page.
 */
export const humaniseCode = (code: string | null | undefined): string => {
  if (!code || !code.trim()) return "—";
  if (code.toUpperCase() === "MPESA") return "M-Pesa";
  const spaced = code.replace(/_/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const refundReasonLabel = (code: string | null | undefined): string =>
  code ? (REFUND_REASON_LABELS[code] ?? humaniseCode(code)) : "—";

export const refundTypeLabel = (code: string | null | undefined): string =>
  code ? (REFUND_TYPE_LABELS[code] ?? humaniseCode(code)) : "—";

/**
 * Tone for a reason pill. Only the reasons that point at something the
 * business did wrong get a warning tint — a customer changing their mind is
 * ordinary trade, and tinting it red would cry wolf.
 */
export const refundReasonTone = (
  code: string | null | undefined,
): "neg" | "warn" | "info" | "muted" => {
  switch (code) {
    case "STAFF_ERROR":
    case "DUPLICATE":
      return "neg";
    case "DAMAGED":
    case "QUALITY":
    case "LATE_DELIVERY":
      return "warn";
    case "WRONG_ITEM":
      return "info";
    default:
      return "muted";
  }
};

// ─── Chart series ───────────────────────────────────────────────────

/** A trend point with its axis label resolved. */
export interface RefundChartPoint {
  /** Axis label, e.g. "Jun 3". */
  label: string;
  /** yyyy-MM-dd. */
  date: string;
  amount: number;
  count: number;
}

/**
 * Beyond this span the axis is plotted from the returned days only. Filling
 * every gap in a year-long window would push thousands of zero points at
 * Recharts for no readability gain.
 */
const MAX_GAP_FILL_DAYS = 120;

/**
 * Expand the sparse server series into a continuous one across [from, to],
 * so a quiet day reads as a gap in the bars rather than being silently
 * skipped over by the axis.
 *
 * <p>Server-only: it formats dates, and a client-side re-render under a
 * different ICU build would produce different labels (see the SSR date
 * hydration gotcha). The page passes the finished array to the chart.
 */
export function buildRefundTrendSeries(
  from: string,
  to: string,
  points: RefundTrendPoint[],
): RefundChartPoint[] {
  const byDate = new Map<string, RefundTrendPoint>();
  for (const p of points) {
    if (p.businessDate) byDate.set(p.businessDate, p);
  }

  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  const spanDays =
    Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;

  const toPoint = (date: string, p?: RefundTrendPoint): RefundChartPoint => ({
    label: format(new Date(`${date}T00:00:00`), "MMM d"),
    date,
    amount: p?.refundedAmount ?? 0,
    count: p?.refundCount ?? 0,
  });

  if (!Number.isFinite(spanDays) || spanDays < 1 || spanDays > MAX_GAP_FILL_DAYS) {
    return points
      .filter((p): p is RefundTrendPoint & { businessDate: string } =>
        Boolean(p.businessDate),
      )
      .map((p) => toPoint(p.businessDate, p));
  }

  const series: RefundChartPoint[] = [];
  for (let i = 0; i < spanDays; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = format(day, "yyyy-MM-dd");
    series.push(toPoint(key, byDate.get(key)));
  }
  return series;
}

// ─── Formatting ─────────────────────────────────────────────────────

/** Thousands-grouped magnitude — the currency code renders separately. */
export const fmtRefundAmount = (value: number): string =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(
    Math.round(value || 0),
  );

/** Quantities can be fractional (weighed goods), so keep up to 2 decimals. */
export const fmtQuantity = (value: number): string =>
  Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value || 0);

export const pluralize = (n: number, word: string) =>
  `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/**
 * Combined daily Z-report — the local (Settlo) close-of-day figures for a
 * business date set against the TRA fiscal (VFD) Z-report for the same date.
 *
 * <p><b>Why a date and not a day session.</b> The Reports Service Z-report is
 * bucketed by {@code sessionId} ("reopen-as-new-session means a single
 * business date may map to multiple sessions"), while the VFD side is bucketed
 * by fiscal date only — the device issues exactly one Z per day. The two can
 * therefore never line up 1:1 on a session, so this model anchors on the
 * calendar date and rolls every session of that date into one local side.
 *
 * <p><b>The dates are not the same clock.</b> {@code zrDate} is TRA's fiscal
 * day in EAT (when the receipt was posted), while the local side keys on the
 * location's business date. A session that runs past midnight posts its late
 * receipts under the NEXT fiscal date, so a non-zero variance on a late-night
 * venue is ordinary drift rather than an error — which is why both sides are
 * always shown side by side instead of being reconciled into one number.
 */

/** One day's fiscal Z-report as DIRM returns it. Mirrors `ZreportResponseDTO`. */
export interface VfdZReportDay {
  /** Fiscal day (EAT) the device issued this Z for — yyyy-MM-dd. */
  zrDate: string;
  /** Time of issue, HH:mm[:ss]; null on rows DIRM returns without one. */
  zrTime: string | null;
  /** Number of fiscal receipts in the Z. Compare against local order count. */
  totalReceipt: number;
  totalTax: number;
  totalSales: number;
  totalSalesVatInc: number;
  totalSalesVatExc: number;
  totalNetAmount: number;
  totalDiscount: number;
  gross: number;
  status: string | null;
}

/** A session that contributed to a date's local side, for drill-down links. */
export interface ZReportSessionRef {
  sessionId: string;
  identifier: string | null;
  status: "OPEN" | "CLOSED" | "SUPERSEDED" | "DELETED";
  openedAt: string;
  closedAt: string | null;
  orderCount: number;
  netSales: number;
}

/** Every session of one business date, rolled up. */
export interface ZReportLocalDay {
  businessDate: string;
  sessions: ZReportSessionRef[];
  sessionCount: number;
  openSessionCount: number;

  orderCount: number;
  gross: number;
  discounts: number;
  /** Selling value billed (comps included — a comped bill closes as paid). */
  net: number;
  tips: number;
  refundCount: number;
  refundAmount: number;

  /** From the date-anchored tax report; the session Z-report carries no tax. */
  taxableAmount: number;
  taxAmount: number;
}

/**
 * Local-minus-VFD deltas. Present only when BOTH sides have a row for the
 * date — a date with one side missing is a gap, not a variance, and the UI
 * says so rather than showing the whole of one side as a difference.
 */
export interface ZReportVariance {
  /** local.net − the VFD's VAT-inclusive sales figure. */
  sales: number;
  /** local.taxAmount − vfd.totalTax. */
  tax: number;
  /** local.orderCount − vfd.totalReceipt. */
  receipts: number;
}

export interface ZReportDayRow {
  /** yyyy-MM-dd. Business date on the local side, zrDate on the VFD side. */
  date: string;
  local: ZReportLocalDay | null;
  vfd: VfdZReportDay | null;
  variance: ZReportVariance | null;
}

/** Why the VFD half of a page is empty — drives the empty-state copy. */
export type VfdAvailability =
  /** Location has a verified VFD registration and DIRM answered. */
  | "available"
  /** Never onboarded for fiscal printing — the normal state for most locations. */
  | "not-registered"
  /** Onboarded but TRA/DIRM hasn't activated the account yet. */
  | "not-verified"
  /** Registered and verified, but the Z-report lookup itself failed. */
  | "error";

export interface ZReportRange {
  locationId: string;
  /** yyyy-MM-dd, inclusive. */
  from: string;
  to: string;
  currency: string;
  vfd: VfdAvailability;
  /** Present when `vfd === "error"` — surfaced verbatim in the banner. */
  vfdError: string | null;
  /** Newest date first. Union of local business dates and VFD fiscal dates. */
  rows: ZReportDayRow[];
  totals: {
    days: number;
    sessionCount: number;
    orderCount: number;
    net: number;
    discounts: number;
    refundAmount: number;
    taxAmount: number;
    /** Null when the VFD side is unavailable, so the UI shows "—" not 0. */
    vfdSales: number | null;
    vfdTax: number | null;
    vfdReceipts: number | null;
  };
}

/**
 * Per-payment-method, per-department and comp lines summed across every
 * session of one date. Field-for-field a subset of the session Z-report
 * (`DaySessionReport`) so the day page can render the same sections.
 */
export interface ZReportDayAggregate {
  orderCount: number;
  sales: {
    gross: number;
    discounts: number;
    net: number;
    /** net − comps: what the day should actually have taken. */
    netCollected: number;
    tips: number;
    itemCount: number;
  };
  refunds: { count: number; amount: number };
  expenses: { count: number; amount: number };
  voids: {
    voidedItemCount: number;
    voidedAmount: number;
    cancelledOrderCount: number;
    cancelledAmount: number;
  };
  complimentaryAmount: number;
  complimentaryCount: number;
  cogs: number;
  grossProfit: number;
  cashNet: number;
  paymentsByMethod: Array<{
    paymentMethodId: string;
    paymentMethodCode: string;
    paymentMethodName: string;
    count: number;
    amount: number;
    tips: number;
  }>;
  salesByDepartment: Array<{
    departmentId: string | null;
    departmentName: string | null;
    quantity: number;
    gross: number;
    net: number;
    grossProfit: number;
  }>;
  /**
   * True when at least one contributing session was still OPEN (its figures
   * came from an X-report). The day's totals are then provisional.
   */
  preliminary: boolean;
  /** Sessions Reports had no report for at all — totals under-count by these. */
  missingSessionCount: number;
}

/** Everything the combined single-day page and its printable render. */
export interface ZReportDayDetail {
  locationId: string;
  date: string;
  currency: string;
  local: ZReportLocalDay | null;
  aggregate: ZReportDayAggregate | null;
  /** Per-session lifecycle + report, in open order — for the sessions table. */
  sessions: Array<{
    session: ZReportSessionRef;
    /** Null when Reports has no report for the session (drift or no activity). */
    hasReport: boolean;
  }>;
  taxByCode: Array<{
    taxCode: string;
    taxName: string | null;
    taxableAmount: number;
    taxAmount: number;
  }>;
  vfd: VfdZReportDay | null;
  vfdAvailability: VfdAvailability;
  vfdError: string | null;
  variance: ZReportVariance | null;
}

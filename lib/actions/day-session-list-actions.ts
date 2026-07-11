"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import {
  DaySession,
  getDaySession,
  listDaySessions as listAccountsDaySessions,
} from "./location-day-sessions-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { getSessionPrepayments } from "./customer-prepayments-actions";
import { getSessionRefunds, getSessionVoids } from "./order-actions";
import { getSessionExpenses } from "./expense-actions";
import type { DaySessionPrepaymentsSummary } from "@/types/customer-prepayments/type";
import type {
  DaySessionRefundsResponse,
  DaySessionVoidsResponse,
} from "@/types/orders/type";
import type { DaySessionExpensesSummary } from "@/types/expense/type";

/**
 * Per-session aggregate row returned by the Reports list endpoint.
 * Mirrors {@code DaySessionListItemDto} on the backend. The dashboard's
 * day-sessions list renders one row per session with these lightweight
 * totals so operators can scan a date range at a glance; the detail
 * page drills into a single session via {@link getDaySessionReport}
 * for the full Z-report.
 */
export interface DaySessionListItem {
  sessionId: string;
  locationId: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "SUPERSEDED" | "DELETED";
  triggerType: "MANUAL" | "AUTO";

  openedAt: string;
  closedAt?: string | null;
  openedBy?: string | null;
  closedBy?: string | null;
  /** "System" when auto-triggered with no recorded actor. */
  openedByLabel?: string | null;
  closedByLabel?: string | null;
  /** Minutes between open and close; null while OPEN. */
  durationMinutes?: number | null;
  forced?: number | null;
  isReopen?: number | null;
  openOrdersAtClose?: number | null;

  orderCount: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalTips: number;
  refundCount: number;
  refundAmount: number;
}

export interface DaySessionListResponse {
  content: DaySessionListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DaySessionListFilters {
  locationId: string;
  from?: string;
  to?: string;
  status?: "OPEN" | "CLOSED" | "SUPERSEDED" | "DELETED";
  page?: number;
  size?: number;
}

/**
 * Paginated list of day sessions for the dashboard.
 *
 * <p>Source-of-truth strategy:
 * <ol>
 *   <li><b>Accounts</b> is the authoritative source of the session
 *       lifecycle (it's the system of record — every session that
 *       exists lives in {@code location_day_session}). We list all
 *       sessions in the date range from Accounts to get the row count
 *       right.</li>
 *   <li><b>Reports</b> enriches each row with aggregates
 *       ({@code orderCount}, {@code grossSales}, {@code netSales},
 *       discounts, tips, refunds). When a session is missing from
 *       Reports (Kafka drift), the row still renders with zeroed
 *       aggregates rather than disappearing.</li>
 * </ol>
 *
 * <p>Pagination is in-memory: Accounts returns the entire date-range
 * list (un-paged), we filter by status, then slice for the requested
 * page. A single location averages dozens of sessions per month, so
 * the in-memory cost is negligible; this also means the page count is
 * always correct regardless of Reports drift.
 */
export async function listDaySessions(
  filters: DaySessionListFilters,
): Promise<DaySessionListResponse> {
  const pageSize = filters.size ?? 20;
  const pageNo = filters.page ?? 0;

  // 1. Accounts — authoritative lifecycle list. Default to the current
  // month if no range is supplied so we don't accidentally page through
  // every session ever opened at the location.
  const from = filters.from ?? defaultFrom();
  const to = filters.to ?? defaultTo();
  let accountsRows: DaySession[] = [];
  try {
    accountsRows = await listAccountsDaySessions(filters.locationId, from, to);
  } catch (error) {
    rethrowIfBoundary(error);
    accountsRows = [];
  }

  // Apply status filter client-side. Default behaviour matches the
  // Reports endpoint: hide SUPERSEDED/DELETED unless explicitly asked.
  const filtered = filters.status
    ? accountsRows.filter((r) => r.status === filters.status)
    : accountsRows.filter(
        (r) => r.status !== "SUPERSEDED" && r.status !== "DELETED",
      );

  // Sort by businessDate DESC, openedAt DESC so the dashboard's "most
  // recent first" expectation holds even when Accounts returns the
  // raw insertion order.
  filtered.sort((a, b) => {
    const dateCmp = b.businessDate.localeCompare(a.businessDate);
    if (dateCmp !== 0) return dateCmp;
    return (b.openedAt ?? "").localeCompare(a.openedAt ?? "");
  });

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const start = pageNo * pageSize;
  const pageSlice = filtered.slice(start, start + pageSize);

  if (pageSlice.length === 0) {
    return {
      content: [],
      page: pageNo,
      size: pageSize,
      totalElements,
      totalPages,
      last: true,
    };
  }

  // 2. Reports — fetch aggregates for the same range and index by
  // sessionId. Best-effort: if Reports is unavailable or hasn't
  // ingested some rows, those rows render with zeros instead of
  // disappearing. Single round-trip per page; oversize the request
  // by the page size so a backlog of sessions in Reports never gives
  // us short results.
  const reportsBySessionId = new Map<string, DaySessionListItem>();
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({
      locationId: filters.locationId,
      from,
      to,
      page: "0",
      // Pull the full Reports range in one shot. The default 20 doesn't
      // line up with our pre-paginated lifecycle list — we'd lose
      // aggregates on later pages.
      size: String(Math.max(200, pageSize * 4)),
    });
    if (filters.status) params.set("status", filters.status);
    const data = (await apiClient.get(
      `/api/v2/analytics/day-sessions?${params.toString()}`,
    )) as DaySessionListResponse | undefined;
    if (data?.content) {
      for (const row of data.content) {
        reportsBySessionId.set(row.sessionId, row);
      }
    }
  } catch {
    // Reports unavailable — every row will fall through to the
    // zero-aggregate path below.
  }

  // 3. Merge — Accounts lifecycle row + Reports aggregates (or zeros).
  const content: DaySessionListItem[] = pageSlice.map((session) =>
    mergeSessionRow(session, reportsBySessionId.get(session.id)),
  );

  return {
    content,
    page: pageNo,
    size: pageSize,
    totalElements,
    totalPages,
    last: pageNo + 1 >= totalPages,
  };
}

/**
 * Default date range — current calendar month. Used when caller didn't
 * supply explicit {@code from}/{@code to}. Computed server-side to
 * match the dashboard list page's own default.
 */
function defaultFrom(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function defaultTo(): string {
  const d = new Date();
  // Last day of the current month — d with day=0 of next month.
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
}

/**
 * Merges an Accounts {@link DaySession} (lifecycle) with the Reports
 * {@link DaySessionListItem} (aggregates) of the same session id. The
 * Accounts row always wins for lifecycle fields ({@code status},
 * trigger, opened/closed timestamps, identifier, notes); Reports
 * provides the aggregates with a safe zero default when missing.
 */
function mergeSessionRow(
  session: DaySession,
  report: DaySessionListItem | undefined,
): DaySessionListItem {
  return {
    sessionId: session.id,
    locationId: session.locationId,
    businessDate: session.businessDate,
    status: session.status as DaySessionListItem["status"],
    triggerType: session.triggerType,
    openedAt: session.openedAt,
    closedAt: session.closedAt ?? null,
    openedBy: session.openedBy ?? null,
    closedBy: session.closedBy ?? null,
    openedByLabel: session.openedByLabel ?? null,
    closedByLabel: session.closedByLabel ?? null,
    durationMinutes: report?.durationMinutes ?? computeDuration(session),
    forced: report?.forced ?? 0,
    isReopen: report?.isReopen ?? 0,
    openOrdersAtClose: report?.openOrdersAtClose ?? null,
    orderCount: report?.orderCount ?? 0,
    grossSales: report?.grossSales ?? 0,
    netSales: report?.netSales ?? 0,
    totalDiscount: report?.totalDiscount ?? 0,
    totalTips: report?.totalTips ?? 0,
    refundCount: report?.refundCount ?? 0,
    refundAmount: report?.refundAmount ?? 0,
  };
}

/**
 * Best-effort duration in minutes from the Accounts row alone, so the
 * column is populated even when Reports hasn't ingested the session.
 * Open sessions report time-since-open.
 */
function computeDuration(session: DaySession): number | null {
  if (!session.openedAt) return null;
  const open = new Date(session.openedAt).getTime();
  const close = session.closedAt
    ? new Date(session.closedAt).getTime()
    : Date.now();
  return Math.max(0, Math.floor((close - open) / 60000));
}

/**
 * Complete Z-report (or X-report when {@code preliminary=true}) for a
 * single session. Used by the day-session detail page. Mirrors
 * {@code ZReportDto} on the backend — full sales breakdown, refunds,
 * expenses, COGS, gross profit, cash net, and per-payment-method
 * breakdown.
 */
export interface DaySessionReport {
  sessionId: string;
  locationId: string;
  businessDate: string;
  status: "OPEN" | "CLOSED" | "DELETED";
  openedAt: string;
  closedAt?: string | null;
  openedBy?: string | null;
  closedBy?: string | null;
  /** True for X-reports (live snapshot of OPEN session); false for end-of-day Z-report. */
  preliminary: boolean;

  orderCount: number;
  openOrdersAtClose?: number | null;

  sales: {
    gross: number;
    discounts: number;
    net: number;
    tips: number;
    itemCount?: number;
    /** Number of orders that had a discount applied (Reports). */
    discountCount?: number;
  };
  /** In-house / complimentary (gifted) transactions this session (Reports). */
  complimentaryAmount?: number;
  complimentaryCount?: number;
  refunds: { count: number; amount: number };
  expenses: { count: number; amount: number };
  cogs: number;
  grossProfit: number;
  cashNet: number;

  /** Cash-drawer count-up, for locations using physical-till reconciliation. */
  physicalTill?: {
    opening: number | null;
    counted: number | null;
    expected: number | null;
    variance: number | null;
  } | null;

  /** Voided items + cancelled orders during the session (distinct from post-sale refunds above). */
  voids?: {
    voidedItemCount: number;
    voidedAmount: number;
    cancelledOrderCount: number;
    cancelledAmount: number;
  };

  paymentsByMethod: Array<{
    paymentMethodId: string;
    paymentMethodCode: string;
    paymentMethodName: string;
    count: number;
    amount: number;
    tips: number;
  }>;
}

export interface DaySessionDetail {
  /** Lifecycle row from the Accounts Service — the authoritative
   *  source for extension window, identifier, notes. */
  session: DaySession | null;
  /** Aggregate financial snapshot from the Reports Service Z-report
   *  (or X-report for OPEN sessions). Null when Reports is unavailable
   *  or the session has had no activity yet. */
  report: DaySessionReport | null;
}

/**
 * Single-session detail used by the day-session detail page. Calls
 * Accounts for the lifecycle row + Reports for the Z-report (or
 * X-report for OPEN sessions). Either half can be null — the UI
 * gracefully renders whichever returned successfully.
 */
export async function getDaySessionDetail(
  locationId: string,
  sessionId: string,
): Promise<DaySessionDetail> {
  // Lifecycle row from Accounts.
  let session: DaySession | null = null;
  try {
    session = await getDaySession(locationId, sessionId);
  } catch {
    session = null;
  }

  // X-report (OPEN) vs Z-report (CLOSED). The Accounts lifecycle status
  // drives the first choice, but Accounts and Reports can disagree — a
  // stale, merged, or superseded session — and the Reports Service rejects
  // an X-report for a session IT considers CLOSED (and a Z-report for one it
  // considers OPEN). So try the status-implied report first, then fall back
  // to the other type, so the user gets whichever report Reports actually
  // has instead of an empty panel.
  let report: DaySessionReport | null = null;
  if (session) {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId }).toString();

    const fetchReport = async (
      kind: "x-report" | "z-report",
    ): Promise<DaySessionReport | null> => {
      try {
        const data = (await apiClient.get(
          `/api/v2/analytics/day-sessions/${sessionId}/${kind}?${params}`,
        )) as DaySessionReport;
        return parseStringify(data) as DaySessionReport;
      } catch {
        return null;
      }
    };

    // Only the second call runs when the first fails, so a matching status
    // costs nothing extra.
    const [primary, fallback] =
      session.status === "OPEN"
        ? (["x-report", "z-report"] as const)
        : (["z-report", "x-report"] as const);
    report = (await fetchReport(primary)) ?? (await fetchReport(fallback));
  }

  return { session, report };
}

/**
 * The four Close-of-Day data sources that live outside the Reports
 * Z-report: prepayments (Accounts), refunds + voids (Order Management),
 * and expenses (Accounting). Each leaf action already catches its own
 * errors and resolves to {@code null} on failure; wrapping the fan-out
 * in {@link Promise.allSettled} is a second line of defence so one
 * service being down (or throwing unexpectedly) can never take the
 * others down with it — every field degrades independently to
 * {@code null} instead of failing the whole Close-of-Day report.
 */
export interface CloseOfDayExtras {
  prepayments: DaySessionPrepaymentsSummary | null;
  refunds: DaySessionRefundsResponse | null;
  voids: DaySessionVoidsResponse | null;
  expenses: DaySessionExpensesSummary | null;
}

export async function getCloseOfDayExtras(
  locationId: string,
  sessionId: string,
): Promise<CloseOfDayExtras> {
  const [prepayments, refunds, voids, expenses] = await Promise.allSettled([
    getSessionPrepayments(locationId, sessionId),
    getSessionRefunds(sessionId),
    getSessionVoids(sessionId),
    getSessionExpenses(sessionId),
  ]);

  return {
    prepayments: prepayments.status === "fulfilled" ? prepayments.value : null,
    refunds: refunds.status === "fulfilled" ? refunds.value : null,
    voids: voids.status === "fulfilled" ? voids.value : null,
    expenses: expenses.status === "fulfilled" ? expenses.value : null,
  };
}

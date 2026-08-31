"use server";

import {
  getDaySessionReport,
  listDaySessions,
  type DaySessionListItem,
  type DaySessionReport,
} from "@/lib/actions/day-session-list-actions";
import { getTaxReport } from "@/lib/actions/tax-report-actions";
import { getVfdZReports } from "@/lib/actions/vfd-z-report-actions";
import { resolveCurrency } from "@/lib/day-sessions/cod-format";
import {
  rollUpLocalDay,
  sumSessionReports,
  varianceOf,
  vfdSalesFigure,
} from "@/lib/z-report/aggregate";
import type {
  VfdZReportDay,
  ZReportDayDetail,
  ZReportDayRow,
  ZReportLocalDay,
  ZReportRange,
} from "@/types/reports/z-report";

/**
 * A single location rarely runs more than a handful of sessions a day, so one
 * page of this size covers any range the filter allows (a full month of a
 * four-session-a-day venue is ~120 rows). The list action paginates in memory
 * anyway — asking for one big page is the cheapest way to get the whole range.
 */
const SESSION_PAGE_SIZE = 500;

/** Sums the tax report's per-day rows into `{ date -> {taxable, tax} }`. */
function taxByDate(
  rows: Array<{ period: string; taxableAmount: number; taxAmount: number }>,
): Map<string, { taxableAmount: number; taxAmount: number }> {
  const index = new Map<string, { taxableAmount: number; taxAmount: number }>();
  for (const row of rows) {
    if (!row?.period) continue;
    const existing = index.get(row.period);
    if (existing) {
      existing.taxableAmount += row.taxableAmount ?? 0;
      existing.taxAmount += row.taxAmount ?? 0;
    } else {
      index.set(row.period, {
        taxableAmount: row.taxableAmount ?? 0,
        taxAmount: row.taxAmount ?? 0,
      });
    }
  }
  return index;
}

/** Groups session rows by their business date. */
function sessionsByDate(
  rows: DaySessionListItem[],
): Map<string, DaySessionListItem[]> {
  const index = new Map<string, DaySessionListItem[]>();
  for (const row of rows) {
    if (!row?.businessDate) continue;
    const bucket = index.get(row.businessDate);
    if (bucket) bucket.push(row);
    else index.set(row.businessDate, [row]);
  }
  return index;
}

/**
 * The combined Z-report for a date range: one row per day, local roll-up
 * beside the fiscal Z, newest first.
 *
 * <p>Three independent sources, none of which can take the page down:
 * sessions (Accounts lifecycle + Reports aggregates), the date-anchored tax
 * report (the session Z-report carries no tax at all), and the VFD Z-reports.
 * Each is settled separately — a Reports outage still leaves the fiscal
 * column readable, and vice versa.
 *
 * <p>Rows are the UNION of local business dates and VFD fiscal dates, not an
 * inner join. A fiscal Z posted against a date the location has no session
 * for is exactly the kind of drift this report exists to surface (a session
 * running past midnight posts its late receipts under the next fiscal date),
 * so dropping it would hide the finding.
 */
export async function getZReportRange(
  locationId: string,
  from: string,
  to: string,
): Promise<ZReportRange> {
  const [sessionsResult, taxResult, vfdResult] = await Promise.allSettled([
    listDaySessions({ locationId, from, to, size: SESSION_PAGE_SIZE }),
    getTaxReport(from, to, "day", "taxCode"),
    getVfdZReports(locationId, from, to),
  ]);

  const sessionRows =
    sessionsResult.status === "fulfilled" ? sessionsResult.value.content : [];
  const tax =
    taxResult.status === "fulfilled" ? taxResult.value : null;
  const vfd =
    vfdResult.status === "fulfilled"
      ? vfdResult.value
      : { availability: "error" as const, days: [], error: "VFD lookup failed" };

  const byDate = sessionsByDate(sessionRows);
  const taxIndex = taxByDate(tax?.rows ?? []);
  const vfdIndex = new Map<string, VfdZReportDay>(
    vfd.days.map((d) => [d.zrDate, d]),
  );

  const dates = [
    ...new Set([...byDate.keys(), ...vfdIndex.keys()]),
  ].sort((a, b) => b.localeCompare(a));

  const rows: ZReportDayRow[] = dates.map((date) => {
    const sessions = byDate.get(date);
    let local: ZReportLocalDay | null = null;
    if (sessions?.length) {
      local = rollUpLocalDay(date, sessions);
      const dayTax = taxIndex.get(date);
      local.taxableAmount = dayTax?.taxableAmount ?? 0;
      local.taxAmount = dayTax?.taxAmount ?? 0;
    }
    const fiscal = vfdIndex.get(date) ?? null;
    return { date, local, vfd: fiscal, variance: varianceOf(local, fiscal) };
  });

  const vfdAvailable = vfd.availability === "available";

  return {
    locationId,
    from,
    to,
    currency: resolveCurrency(tax?.totalsByCurrency?.[0]?.currency),
    vfd: vfd.availability,
    vfdError: vfd.error,
    rows,
    totals: {
      days: rows.length,
      sessionCount: sessionRows.length,
      orderCount: rows.reduce((s, r) => s + (r.local?.orderCount ?? 0), 0),
      net: rows.reduce((s, r) => s + (r.local?.net ?? 0), 0),
      discounts: rows.reduce((s, r) => s + (r.local?.discounts ?? 0), 0),
      refundAmount: rows.reduce((s, r) => s + (r.local?.refundAmount ?? 0), 0),
      taxAmount: rows.reduce((s, r) => s + (r.local?.taxAmount ?? 0), 0),
      // Null, not 0, when there is no fiscal device to compare against —
      // a zeroed KPI would read as "the device rang up nothing today".
      vfdSales: vfdAvailable
        ? rows.reduce((s, r) => s + (r.vfd ? vfdSalesFigure(r.vfd) : 0), 0)
        : null,
      vfdTax: vfdAvailable
        ? rows.reduce((s, r) => s + (r.vfd?.totalTax ?? 0), 0)
        : null,
      vfdReceipts: vfdAvailable
        ? rows.reduce((s, r) => s + (r.vfd?.totalReceipt ?? 0), 0)
        : null,
    },
  };
}

/**
 * The combined Z-report for ONE date: every session of that business date
 * summed into a single set of figures, the per-tax-code split, and the fiscal
 * Z beside them.
 *
 * <p>Cost is one session-list call plus one report call per session of the
 * date (typically 1–3), which is why this is a separate action from the range
 * view rather than something the list page fetches for every row.
 */
export async function getZReportDay(
  locationId: string,
  date: string,
): Promise<ZReportDayDetail> {
  const [sessionsResult, taxResult, vfdResult] = await Promise.allSettled([
    listDaySessions({ locationId, from: date, to: date, size: SESSION_PAGE_SIZE }),
    getTaxReport(date, date, "day", "taxCode"),
    getVfdZReports(locationId, date, date),
  ]);

  const sessionRows =
    sessionsResult.status === "fulfilled" ? sessionsResult.value.content : [];
  const tax = taxResult.status === "fulfilled" ? taxResult.value : null;
  const vfd =
    vfdResult.status === "fulfilled"
      ? vfdResult.value
      : { availability: "error" as const, days: [], error: "VFD lookup failed" };

  let local: ZReportLocalDay | null = null;
  if (sessionRows.length) {
    local = rollUpLocalDay(date, sessionRows);
    local.taxableAmount = tax?.totalTaxableAmount ?? 0;
    local.taxAmount = tax?.totalTaxAmount ?? 0;
  }

  // Per-session figures, fetched in parallel. A session Reports has nothing
  // for resolves to null and is counted as missing rather than dropped, so
  // the page can warn that the day's totals under-count.
  const reports = await Promise.all(
    sessionRows.map((row) =>
      getDaySessionReport(locationId, row.sessionId, row.status).catch(
        () => null,
      ),
    ),
  );
  const present = reports.filter((r): r is DaySessionReport => r !== null);

  const fiscal = vfd.days.find((d) => d.zrDate === date) ?? null;

  return {
    locationId,
    date,
    currency: resolveCurrency(tax?.totalsByCurrency?.[0]?.currency),
    local,
    aggregate: sessionRows.length
      ? sumSessionReports(present, sessionRows.length)
      : null,
    sessions: (local?.sessions ?? []).map((session) => ({
      session,
      hasReport: present.some((r) => r.sessionId === session.sessionId),
    })),
    taxByCode: (tax?.byTaxCode ?? []).map((code) => ({
      taxCode: code.taxCode,
      taxName: code.taxName,
      taxableAmount: code.taxableAmount,
      taxAmount: code.taxAmount,
    })),
    vfd: fiscal,
    vfdAvailability: vfd.availability,
    vfdError: vfd.error,
    variance: varianceOf(local, fiscal),
  };
}

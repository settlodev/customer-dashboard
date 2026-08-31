/**
 * Pure roll-up helpers behind the combined daily Z-report. Kept out of the
 * server actions so the arithmetic — which is the part that has to tie back
 * to what an operator counted — is testable without a network.
 */

import type {
  DaySessionListItem,
  DaySessionReport,
} from "@/lib/actions/day-session-list-actions";
import type {
  VfdZReportDay,
  ZReportDayAggregate,
  ZReportLocalDay,
  ZReportSessionRef,
  ZReportVariance,
} from "@/types/reports/z-report";

const num = (n?: number | null): number => (typeof n === "number" ? n : 0);

/**
 * The VFD figure the local `net` is comparable to: sales INCLUDING VAT, since
 * POS prices in Tanzania are VAT-inclusive and the local net is the billed
 * selling value.
 *
 * <p>DIRM returns four overlapping money fields whose naming is not
 * self-evident and which a device leaves at zero depending on how the
 * merchant is registered (a non-VAT merchant reports no VAT-inclusive split),
 * so this walks them in order of how directly each answers "what did the
 * device ring up". The day page shows all four raw so this choice is always
 * inspectable rather than something the reader has to trust.
 */
export const vfdSalesFigure = (vfd: VfdZReportDay): number =>
  num(vfd.totalSalesVatInc) ||
  num(vfd.totalSales) ||
  num(vfd.gross) ||
  num(vfd.totalNetAmount);

/**
 * Local minus fiscal. Null unless both sides have a row: a date present on
 * only one side is a gap (sales never fiscalised, or a Z posted against a day
 * the location has no session for), and calling one side's whole total a
 * "variance" would read as a reconciliation failure rather than a gap.
 */
export const varianceOf = (
  local: ZReportLocalDay | null,
  vfd: VfdZReportDay | null,
): ZReportVariance | null => {
  if (!local || !vfd) return null;
  return {
    sales: local.net - vfdSalesFigure(vfd),
    tax: local.taxAmount - num(vfd.totalTax),
    receipts: local.orderCount - num(vfd.totalReceipt),
  };
};

export const sessionRef = (row: DaySessionListItem): ZReportSessionRef => ({
  sessionId: row.sessionId,
  identifier: null,
  status: row.status,
  openedAt: row.openedAt,
  closedAt: row.closedAt ?? null,
  orderCount: num(row.orderCount),
  netSales: num(row.netSales),
});

/**
 * Every session of one business date summed into a single local side.
 * Sessions arrive newest-first from the list action; the refs come back in
 * open order because that is how an operator reads a day back.
 */
export const rollUpLocalDay = (
  businessDate: string,
  rows: DaySessionListItem[],
): ZReportLocalDay => {
  const sessions = rows
    .map(sessionRef)
    .sort((a, b) => (a.openedAt ?? "").localeCompare(b.openedAt ?? ""));

  return {
    businessDate,
    sessions,
    sessionCount: sessions.length,
    openSessionCount: sessions.filter((s) => s.status === "OPEN").length,
    orderCount: rows.reduce((s, r) => s + num(r.orderCount), 0),
    gross: rows.reduce((s, r) => s + num(r.grossSales), 0),
    discounts: rows.reduce((s, r) => s + num(r.totalDiscount), 0),
    net: rows.reduce((s, r) => s + num(r.netSales), 0),
    tips: rows.reduce((s, r) => s + num(r.totalTips), 0),
    refundCount: rows.reduce((s, r) => s + num(r.refundCount), 0),
    refundAmount: rows.reduce((s, r) => s + num(r.refundAmount), 0),
    // Filled in by the caller from the date-anchored tax report — the session
    // Z-report carries no tax fields at all.
    taxableAmount: 0,
    taxAmount: 0,
  };
};

/**
 * Sums the per-session Z-reports (X-reports for sessions still open) of one
 * date into the shape the day page renders.
 *
 * @param reports one entry per session Reports answered for; sessions it had
 *   nothing for are counted in `missingSessionCount` instead of being
 *   silently dropped, so the page can say the totals under-count.
 */
export const sumSessionReports = (
  reports: DaySessionReport[],
  totalSessions: number,
): ZReportDayAggregate => {
  const payments = new Map<
    string,
    ZReportDayAggregate["paymentsByMethod"][number]
  >();
  const departments = new Map<
    string,
    ZReportDayAggregate["salesByDepartment"][number]
  >();

  for (const report of reports) {
    for (const pm of report.paymentsByMethod ?? []) {
      // Method id is the stable key; the name is a read-time label that can
      // differ between sessions after a rename, so first one in wins.
      const key = pm.paymentMethodId ?? pm.paymentMethodCode ?? "unknown";
      const existing = payments.get(key);
      if (existing) {
        existing.count += num(pm.count);
        existing.amount += num(pm.amount);
        existing.tips += num(pm.tips);
      } else {
        payments.set(key, {
          paymentMethodId: pm.paymentMethodId,
          paymentMethodCode: pm.paymentMethodCode,
          paymentMethodName: pm.paymentMethodName,
          count: num(pm.count),
          amount: num(pm.amount),
          tips: num(pm.tips),
        });
      }
    }

    for (const dept of report.salesByDepartment ?? []) {
      const key = dept.departmentId ?? "__unassigned__";
      const existing = departments.get(key);
      if (existing) {
        existing.quantity += num(dept.quantity);
        existing.gross += num(dept.gross);
        existing.net += num(dept.net);
        existing.grossProfit += num(dept.grossProfit);
      } else {
        departments.set(key, {
          departmentId: dept.departmentId,
          departmentName: dept.departmentName,
          quantity: num(dept.quantity),
          gross: num(dept.gross),
          net: num(dept.net),
          grossProfit: num(dept.grossProfit),
        });
      }
    }
  }

  const sum = (pick: (r: DaySessionReport) => number | null | undefined) =>
    reports.reduce((total, r) => total + num(pick(r)), 0);

  const net = sum((r) => r.sales?.net);
  const complimentaryAmount = sum((r) => r.complimentaryAmount);

  return {
    orderCount: sum((r) => r.orderCount),
    sales: {
      gross: sum((r) => r.sales?.gross),
      discounts: sum((r) => r.sales?.discounts),
      net,
      // Read per session as `netCollected ?? net` (absent on older payloads)
      // before summing, so one legacy session can't zero the day's figure.
      netCollected: reports.reduce(
        (total, r) => total + num(r.sales?.netCollected ?? r.sales?.net),
        0,
      ),
      tips: sum((r) => r.sales?.tips),
      itemCount: sum((r) => r.sales?.itemCount),
    },
    refunds: {
      count: sum((r) => r.refunds?.count),
      amount: sum((r) => r.refunds?.amount),
    },
    expenses: {
      count: sum((r) => r.expenses?.count),
      amount: sum((r) => r.expenses?.amount),
    },
    voids: {
      voidedItemCount: sum((r) => r.voids?.voidedItemCount),
      voidedAmount: sum((r) => r.voids?.voidedAmount),
      cancelledOrderCount: sum((r) => r.voids?.cancelledOrderCount),
      cancelledAmount: sum((r) => r.voids?.cancelledAmount),
    },
    complimentaryAmount,
    complimentaryCount: sum((r) => r.complimentaryCount),
    cogs: sum((r) => r.cogs),
    grossProfit: sum((r) => r.grossProfit),
    cashNet: sum((r) => r.cashNet),
    paymentsByMethod: [...payments.values()].sort((a, b) => b.amount - a.amount),
    salesByDepartment: [...departments.values()].sort((a, b) => b.net - a.net),
    preliminary: reports.some((r) => r.preliminary),
    missingSessionCount: Math.max(0, totalSessions - reports.length),
  };
};

// Pure CSV builder for the refunds dashboard's "Export CSV" action.
//
// Same contract as `cashflow-csv.ts`: the screen already holds every value it
// shows, so the export is built in the browser from those props — no re-fetch,
// and the file matches the numbers on screen exactly. The output is the
// *summary* (headline totals + every breakdown), not the paged line items,
// which the detail table below the dashboard owns.

import type { RefundBreakdownRow } from "@/types/reports/refunds";

export interface RefundSummaryExport {
  /** Period start, yyyy-MM-dd. */
  from: string;
  /** Period end, yyyy-MM-dd. */
  to: string;
  currency: string;
  refundCount: number;
  refundedAmount: number;
  returnedCost: number;
  unitsReturned: number;
  ordersAffected: number;
  restockedCount: number;
  averageRefund: number;
  largestRefund: number;
  /** Share of net sales handed back, or null when there were no sales. */
  refundRate: number | null;
  byReason: RefundBreakdownRow[];
  byRefundType: RefundBreakdownRow[];
  byPaymentMethod: RefundBreakdownRow[];
  topItems: RefundBreakdownRow[];
  byStaff: RefundBreakdownRow[];
}

// Quote a cell only when it carries a comma, quote, or newline (RFC 4180).
const csvCell = (value: string | number): string => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// CSV cells must be raw numbers (no thousands separators) so spreadsheets
// parse them numerically; whole units mirror the on-screen formatting.
const round = (n: number): number => Math.round(n || 0);

/**
 * Render the refunds summary as a sectioned CSV: a header block (period +
 * currency), the headline totals, then one section per breakdown. Returns the
 * text plus a suggested filename; the caller turns it into a download.
 */
export function buildRefundSummaryCsv(data: RefundSummaryExport): {
  csv: string;
  filename: string;
} {
  const { from, to, currency } = data;
  const amountHeader = `Amount (${currency})`;

  const lines: string[] = [];
  const row = (...cells: (string | number)[]) =>
    lines.push(cells.map(csvCell).join(","));

  row("Refunds report");
  row("Period", from === to ? from : `${from} to ${to}`);
  row("Currency", currency);
  lines.push("");

  row("Summary");
  row("Metric", "Value");
  row("Refunds", data.refundCount);
  row(`Refunded amount (${currency})`, round(data.refundedAmount));
  row(`Cost recovered (${currency})`, round(data.returnedCost));
  row(
    `Gross profit given back (${currency})`,
    round(data.refundedAmount - data.returnedCost),
  );
  row("Units returned", data.unitsReturned);
  row("Orders affected", data.ordersAffected);
  row("Restocked refunds", data.restockedCount);
  row(`Average refund (${currency})`, round(data.averageRefund));
  row(`Largest refund (${currency})`, round(data.largestRefund));
  row(
    "Refund rate (% of net sales)",
    data.refundRate != null ? data.refundRate.toFixed(2) : "n/a",
  );
  lines.push("");

  // One block per breakdown, all sharing a column layout so the file can be
  // pivoted without reshaping each section by hand.
  const section = (title: string, rows: RefundBreakdownRow[], withCost = false) => {
    row(title);
    const header = ["Name", "Refunds", "Units", amountHeader, "Share %"];
    if (withCost) header.splice(4, 0, `Cost recovered (${currency})`);
    row(...header);
    if (rows.length === 0) {
      row("No data", "", "", "", ...(withCost ? [""] : []), "");
    } else {
      for (const r of rows) {
        const cells: (string | number)[] = [
          r.label,
          r.refundCount,
          r.quantity,
          round(r.refundedAmount),
        ];
        if (withCost) cells.push(r.returnedCost != null ? round(r.returnedCost) : "");
        cells.push(r.share.toFixed(1));
        row(...cells);
      }
    }
    lines.push("");
  };

  section("By reason", data.byReason);
  section("By refund type", data.byRefundType);
  section("By payback method", data.byPaymentMethod);
  section("Most refunded items", data.topItems, true);
  section("Processed by", data.byStaff);

  // Drop the trailing blank line the last section leaves behind.
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  return {
    csv: lines.join("\n"),
    filename: `refunds-summary-${from}_to_${to}.csv`,
  };
}

// Pure CSV builder for the cashflow report's "Export CSV" action.
//
// Sits next to `cashflow-trend.ts` (the other pure cashflow transform). The
// screen already computes every value shown, so the export is built in the
// browser straight from those props — no re-fetch, and the file matches the
// numbers on screen exactly. The output is a *summary* (the KPI statement +
// the per-tender inflow breakdown), not the daily series, which can be
// modeled/placeholder data when the daily endpoint isn't deployed yet.

import type { CashflowMethodRow } from "@/types/reports/cashflow";

export interface CashflowSummaryExport {
  /** Period start, yyyy-MM-dd. */
  from: string;
  /** Period end, yyyy-MM-dd. */
  to: string;
  currency: string;
  cashIn: number;
  txnCount: number;
  cashOut: number;
  outCount: number;
  expenses: number;
  expenseCount: number;
  refunds: number;
  refundCount: number;
  closing: number;
  methodRows: CashflowMethodRow[];
}

// Quote a cell only when it carries a comma, quote, or newline (RFC 4180).
const csvCell = (value: string | number): string => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// CSV cells must be raw numbers (no thousands separators) so spreadsheets
// parse them numerically; we still round to whole units to mirror the
// on-screen `fmtAmount` (maximumFractionDigits: 0).
const round = (n: number): number => Math.round(n || 0);

/**
 * Render the cashflow summary as a sectioned CSV: a header block (period +
 * currency), the cash-flow statement (with transaction/payment counts), and
 * the cash-in-by-payment-method breakdown. Returns the text plus a suggested
 * filename; the caller turns it into a download.
 */
export function buildCashflowSummaryCsv(data: CashflowSummaryExport): {
  csv: string;
  filename: string;
} {
  const { from, to, currency } = data;
  const amountHeader = `Amount (${currency})`;

  const lines: string[] = [];
  const row = (...cells: (string | number)[]) =>
    lines.push(cells.map(csvCell).join(","));

  // Header block — what this file is and the scope it covers.
  row("Cashflow report");
  row("Period", from === to ? from : `${from} to ${to}`);
  row("Currency", currency);
  lines.push("");

  // Cash-flow statement: inflow nets down through outflows to the closing
  // balance. Mirrors the on-screen summary panel + KPI counts.
  row("Cash flow summary");
  row("Metric", amountHeader, "Count");
  row("Cash in", round(data.cashIn), data.txnCount);
  row("Expenses", round(data.expenses), data.expenseCount);
  row("Refunds", round(data.refunds), data.refundCount);
  row("Cash out", round(data.cashOut), data.outCount);
  row("Closing balance", round(data.closing), "");
  lines.push("");

  // Inflow split by tender — ranked high → low, matching the screen.
  row("Cash in by payment method");
  row("Method", "Transactions", amountHeader, "Share %");
  if (data.methodRows.length === 0) {
    row("No payment-method data", "", "", "");
  } else {
    for (const m of data.methodRows) {
      row(m.name, m.count ?? 0, round(m.amount), m.share.toFixed(1));
    }
  }

  return {
    csv: lines.join("\n"),
    filename: `cashflow-summary-${from}_to_${to}.csv`,
  };
}

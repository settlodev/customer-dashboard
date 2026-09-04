"use server";

import * as XLSX from "xlsx";

import {
  fetchMonthlyProfitAndLoss,
  fetchProfitAndLoss,
} from "@/lib/actions/accounting-reports-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { formatPlRangeLabel, toMonthRange, type PlView } from "@/lib/pl-period";
import type {
  MonthlyProfitAndLossReport,
  PlPeriodGroup,
  PlSectionGroup,
  ProfitAndLossReport,
} from "@/types/reports/type";

type Cell = string | number;

/**
 * Excel number format for every amount cell: thousands separator, two
 * decimals, negatives in accounting parentheses, zero as a dash — the same
 * conventions the on-screen tables use. Cells stay numeric, so Excel can
 * still sum them.
 */
const ACCOUNTING_FORMAT = '#,##0.00;(#,##0.00);"–"';

/** One level of indent for sub-lines, since the community xlsx build has no cell styling. */
const INDENT = "    ";

export interface PlWorkbookPayload {
  /** Base64-encoded .xlsx — Blobs don't survive the server-action boundary. */
  base64: string;
  filename: string;
}

/**
 * Builds the Profit & Loss the page is currently showing as one .xlsx sheet.
 * Takes the same `view`/`from`/`to` the page resolves from its URL and fetches
 * the same report through the same actions, so the export is always exactly
 * what is on screen — the statement for the day range, or the month-by-month
 * table for the served months.
 */
export async function exportProfitLossWorkbook(
  view: PlView,
  from: string,
  to: string,
): Promise<PlWorkbookPayload> {
  const location = await getCurrentLocation();
  if (!location?.id) throw new Error("No active location");
  const now = new Date();
  const locationName = location.name ?? "";

  let header: Cell[];
  let rows: Cell[][];
  let periodLabel: string;
  let currency: string;
  let filename: string;

  if (view === "monthly") {
    const { fromMonth, toMonth } = toMonthRange(from, to);
    const report = await fetchMonthlyProfitAndLoss(location.id, fromMonth, toMonth);
    if (!report) throw new Error("No P&L data for this period");
    const last = report.periods[report.periods.length - 1];
    periodLabel = formatPlRangeLabel(report.periods[0].startDate, last.endDate, now);
    currency = report.currencyCode;
    header = ["Code", "Account", ...report.periods.map((p) => p.label), "Total"];
    rows = monthlyRows(report);
    filename = `profit-loss-by-month-${report.fromMonth}_to_${report.toMonth}.xlsx`;
  } else {
    const report = await fetchProfitAndLoss(location.id, from, to);
    if (!report) throw new Error("No P&L data for this period");
    periodLabel = formatPlRangeLabel(from, to, now);
    currency = report.currencyCode;
    header = ["Code", "Account", `Amount (${currency})`];
    rows = statementRows(report);
    filename = `profit-loss-${from}_to_${to}.xlsx`;
  }

  const sheetRows: Cell[][] = [
    [locationName ? `Profit & Loss — ${locationName}` : "Profit & Loss"],
    [`Period: ${periodLabel}`, `Currency: ${currency}`],
    [],
    header,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetRows);
  ws["!cols"] = header.map((_, i) => ({ wch: i === 0 ? 10 : i === 1 ? 40 : 16 }));
  applyAccountingFormat(ws, sheetRows.length - rows.length);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Profit & Loss");
  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  return { base64, filename };
}

/**
 * The single-period statement in the screen's row grammar: a caption per
 * section, its lines with indented children and an explicit "<parent> total"
 * subtotal, the section total, and the four milestone rows between sections.
 */
function statementRows(report: ProfitAndLossReport): Cell[][] {
  const out: Cell[][] = [];
  const section = (title: string, group: PlSectionGroup) => {
    out.push([title.toUpperCase(), "", ""]);
    if (group.lines.length === 0) out.push(["", "No activity", ""]);
    for (const line of group.lines) {
      out.push([line.code, line.name, line.amount]);
      for (const child of line.children) {
        out.push([child.code, `${INDENT}${child.name}`, child.amount]);
      }
      if (line.children.length > 0) {
        out.push(["", `${INDENT}${line.name} total`, line.total]);
      }
    }
    out.push(["", `Total ${title.toLowerCase()}`, group.total]);
  };
  const milestone = (label: string, amount: number) => out.push(["", label, amount]);

  const s = report.sections;
  section("Revenue / Sales", s.revenue);
  section("Cost of Sales", s.costOfSales);
  milestone("Gross Profit", report.grossProfit);
  section("Operating Expenses", s.operatingExpenses);
  milestone("Operating Profit", report.operatingProfit);
  section("Other Income & Expenses", s.otherIncomeAndExpenses);
  milestone("Net Profit Before Tax", report.netProfitBeforeTax);
  section("Tax Expense", s.taxExpense);
  milestone("Net Profit After Tax", report.netProfitAfterTax);
  return out;
}

/** The comparative table: the same row grammar with one cell per month plus Total. */
function monthlyRows(report: MonthlyProfitAndLossReport): Cell[][] {
  const out: Cell[][] = [];
  const blanks = report.periods.map(() => "");
  const section = (title: string, group: PlPeriodGroup) => {
    out.push([title.toUpperCase(), "", ...blanks, ""]);
    if (group.lines.length === 0) out.push(["", "No activity", ...blanks, ""]);
    for (const line of group.lines) {
      out.push([line.code, line.name, ...line.amounts, line.amount]);
      for (const child of line.children) {
        out.push([child.code, `${INDENT}${child.name}`, ...child.amounts, child.amount]);
      }
      if (line.children.length > 0) {
        out.push(["", `${INDENT}${line.name} total`, ...line.totals, line.total]);
      }
    }
    out.push(["", `Total ${title.toLowerCase()}`, ...group.totals, group.total]);
  };
  const milestone = (label: string, figure: { byPeriod: number[]; total: number }) =>
    out.push(["", label, ...figure.byPeriod, figure.total]);

  const s = report.sections;
  section("Revenue / Sales", s.revenue);
  section("Cost of Sales", s.costOfSales);
  milestone("Gross Profit", report.grossProfit);
  section("Operating Expenses", s.operatingExpenses);
  milestone("Operating Profit", report.operatingProfit);
  section("Other Income & Expenses", s.otherIncomeAndExpenses);
  milestone("Net Profit Before Tax", report.netProfitBeforeTax);
  section("Tax Expense", s.taxExpense);
  milestone("Net Profit After Tax", report.netProfitAfterTax);
  return out;
}

/** Stamps the accounting number format on every numeric cell below the header rows. */
function applyAccountingFormat(ws: XLSX.WorkSheet, firstDataRow: number) {
  if (!ws["!ref"]) return;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let r = firstDataRow; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      if (cell && cell.t === "n") cell.z = ACCOUNTING_FORMAT;
    }
  }
}

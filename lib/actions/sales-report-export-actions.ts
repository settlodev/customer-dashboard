"use server";

import * as XLSX from "xlsx";

import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getCategorySalesRollup } from "@/lib/actions/category-sales-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getDepartmentSalesRollup } from "@/lib/actions/department-sales-actions";
import { hasEntityFeature } from "@/lib/actions/entitlement-actions";
import { listTopSellingProducts } from "@/lib/actions/product-actions";
import { fetchAllTables, getTableStats } from "@/lib/actions/space-actions";
import { staffReport } from "@/lib/actions/staff-actions";
import { getSalesByTable } from "@/lib/actions/table-sales-actions";

// The sales report's "By product" tab shows the ranked top-N; for the export
// we lift the cap so the sheet is as complete as the service allows. The
// product KPI/total row is server-aggregated across the FULL dataset, so the
// total stays accurate even if more products exist than rows returned.
const PRODUCT_EXPORT_LIMIT = 1000;

const round = (n: unknown): number => Math.round(Number(n) || 0);
const marginPct = (profit: number, net: number): number =>
  net > 0 ? Number(((profit / net) * 100).toFixed(1)) : 0;

type Cell = string | number;

export interface SalesWorkbookPayload {
  /** Base64-encoded .xlsx — Blobs don't survive the server-action boundary. */
  base64: string;
  filename: string;
  /** Sheet names actually written, for the success toast. */
  sheets: string[];
}

/**
 * Builds the whole sales report as one .xlsx workbook — a sheet per tab, the
 * same way the screen splits them ("Excel tabs"). Every tab's full period
 * dataset is fetched server-side (the browser never holds it) and the sheets
 * mirror exactly the tabs the user can see: "By department" only when the
 * DEPARTMENTS_MODULE entitlement is on, "By table" only when the location runs
 * a table system — matching app/(protected)/report/sales/page.tsx.
 */
export async function exportSalesReportWorkbook(
  from: string,
  to: string,
): Promise<SalesWorkbookPayload> {
  // Tab gating + currency, resolved exactly like the page.
  const [tableStats, location, currency] = await Promise.all([
    getTableStats().catch(() => null),
    getCurrentLocation().catch(() => null),
    getLocationCurrency().catch(() => "TZS"),
  ]);
  const hasTables = (tableStats?.total ?? 0) > 0;
  const hasDepartments = location?.id
    ? await hasEntityFeature(location.id, "DEPARTMENTS_MODULE").catch(() => true)
    : true;

  const cur = currency || "TZS";
  const money = (label: string) => `${label} (${cur})`;

  // staffReport takes Date objects; widen to whole days so the last day's
  // evening trade is included (same convention as the tabs).
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59`);

  const [staff, products, category, department, tableReport, tables] =
    await Promise.all([
      staffReport(start, end).catch(() => null),
      listTopSellingProducts({
        fromDate: from,
        toDate: to,
        sortBy: "revenue",
        limit: PRODUCT_EXPORT_LIMIT,
      }).catch(() => null),
      getCategorySalesRollup(from, to).catch(() => null),
      hasDepartments
        ? getDepartmentSalesRollup(from, to).catch(() => null)
        : Promise.resolve(null),
      hasTables ? getSalesByTable(from, to).catch(() => null) : Promise.resolve(null),
      hasTables ? fetchAllTables().catch(() => []) : Promise.resolve([]),
    ]);

  const wb = XLSX.utils.book_new();
  const sheets: string[] = [];

  const addSheet = (name: string, rows: Cell[][]) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    // First column holds names — give it room; the rest are numeric.
    const colCount = rows[0]?.length ?? 1;
    ws["!cols"] = Array.from({ length: colCount }, (_, i) => ({
      wch: i === 0 ? 28 : 15,
    }));
    XLSX.utils.book_append_sheet(wb, ws, name);
    sheets.push(name);
  };

  // ── By staff ──────────────────────────────────────────────────────
  {
    const rows = staff?.staffReports ?? [];
    const t = rows.reduce(
      (a, r) => ({
        orders: a.orders + (r.totalOrdersCompleted || 0),
        items: a.items + (r.totalItemsSold || 0),
        gross: a.gross + (r.totalGrossAmount || 0),
        net: a.net + (r.totalNetAmount || 0),
        profit: a.profit + (r.totalGrossProfit || 0),
      }),
      { orders: 0, items: 0, gross: 0, net: 0, profit: 0 },
    );
    addSheet("By staff", [
      ["Staff", "Orders", "Items sold", money("Gross"), money("Net"), money("Gross profit"), "Margin %"],
      ...rows.map((r): Cell[] => [
        r.name || "—",
        r.totalOrdersCompleted || 0,
        r.totalItemsSold || 0,
        round(r.totalGrossAmount),
        round(r.totalNetAmount),
        round(r.totalGrossProfit),
        marginPct(r.totalGrossProfit, r.totalNetAmount),
      ]),
      ["Total", t.orders, t.items, round(t.gross), round(t.net), round(t.profit), marginPct(t.profit, t.net)],
    ]);
  }

  // ── By product (ranked top-N by revenue) ──────────────────────────
  {
    const items = products?.items ?? [];
    const s = products?.summary;
    addSheet("By product", [
      [
        "Rank",
        "Product",
        "Variant",
        "Category",
        "Qty sold",
        "Net qty",
        "Orders",
        money("Revenue"),
        money("Net revenue"),
        money("Discount"),
        money("COGS"),
        money("Gross profit"),
        "Margin %",
        money("Avg price"),
      ],
      ...items.map((r): Cell[] => [
        r.rank,
        r.productName || "—",
        r.variantName ?? "",
        r.categoryName ?? "",
        r.quantitySold || 0,
        r.netQuantitySold || 0,
        r.ordersCount || 0,
        round(r.revenue),
        round(r.netRevenue),
        round(r.discountAmount),
        round(r.costAmount),
        round(r.grossProfit),
        r.profitMargin != null ? Number(r.profitMargin.toFixed(1)) : 0,
        round(r.averagePrice),
      ]),
      // Totals from the server summary (full dataset, not just the rows above).
      [
        "Total",
        "",
        "",
        "",
        s?.totalQuantitySold ?? 0,
        s?.totalNetQuantitySold ?? 0,
        s?.totalOrdersCount ?? 0,
        round(s?.totalRevenue),
        round(s?.totalNetRevenue),
        "",
        "",
        round(s?.totalGrossProfit),
        s?.averageMargin != null ? Number(s.averageMargin.toFixed(1)) : 0,
        "",
      ],
    ]);
  }

  // ── By category ───────────────────────────────────────────────────
  {
    const cats = category?.categories ?? [];
    const ct = category?.totals;
    addSheet("By category", [
      ["Category", "Products", "Qty sold", money("Gross"), money("Net"), money("Gross profit"), "Margin %"],
      ...cats.map((c): Cell[] => [
        c.categoryName ?? "Unnamed category",
        c.products || 0,
        c.quantitySold || 0,
        round(c.grossSales),
        round(c.netSales),
        round(c.grossProfit),
        marginPct(c.grossProfit, c.netSales),
      ]),
      [
        "Total (location)",
        "",
        ct?.quantitySold ?? 0,
        round(ct?.grossSales),
        round(ct?.netSales),
        round(ct?.grossProfit),
        marginPct(ct?.grossProfit ?? 0, ct?.netSales ?? 0),
      ],
    ]);
  }

  // ── By department (entitlement-gated) ─────────────────────────────
  if (hasDepartments) {
    const depts = department?.departments ?? [];
    const dt = department?.totals;
    addSheet("By department", [
      ["Department", "Products", "Qty sold", money("Gross"), money("Net"), money("Gross profit"), "Margin %"],
      ...depts.map((d): Cell[] => [
        d.departmentName ?? (d.departmentId ? "Unnamed department" : "Unassigned"),
        d.products || 0,
        d.quantitySold || 0,
        round(d.grossSales),
        round(d.netSales),
        round(d.grossProfit),
        marginPct(d.grossProfit, d.netSales),
      ]),
      [
        "Total (location)",
        "",
        dt?.quantitySold ?? 0,
        round(dt?.grossSales),
        round(dt?.netSales),
        round(dt?.grossProfit),
        marginPct(dt?.grossProfit ?? 0, dt?.netSales ?? 0),
      ],
    ]);
  }

  // ── By table (only when the location runs tables) ─────────────────
  if (hasTables) {
    const tableMap = new Map(tables.map((t) => [String(t.id), t]));
    const rows = (tableReport?.tables ?? []).map((r): Cell[] => {
      const t = tableMap.get(String(r.tableId));
      return [
        t?.name ?? `Table ${String(r.tableId).slice(0, 8)}`,
        t?.code ?? "",
        r.orders ?? 0,
        round(r.gross),
        round(r.net),
        round(r.grossProfit),
        marginPct(r.grossProfit ?? 0, r.net ?? 0),
      ];
    });
    addSheet("By table", [
      ["Table", "Code", "Orders", money("Gross"), money("Net"), money("Gross profit"), "Margin %"],
      ...rows,
      [
        "Total",
        "",
        tableReport?.totalOrders ?? 0,
        round(tableReport?.totalGross),
        round(tableReport?.totalNet),
        round(tableReport?.totalGrossProfit),
        marginPct(tableReport?.totalGrossProfit ?? 0, tableReport?.totalNet ?? 0),
      ],
    ]);
  }

  // ── Overview (first tab) — what the workbook contains ─────────────
  const overview: Cell[][] = [
    ["Sales report"],
    [],
    ["Period", from === to ? from : `${from} to ${to}`],
    ["Currency", cur],
    [],
    ["Sheet", "Data rows"],
    ["By staff", staff?.staffReports?.length ?? 0],
    ["By product", products?.items?.length ?? 0],
    ["By category", category?.categories?.length ?? 0],
  ];
  if (hasDepartments)
    overview.push(["By department", department?.departments?.length ?? 0]);
  if (hasTables) overview.push(["By table", tableReport?.tables?.length ?? 0]);
  const overviewWs = XLSX.utils.aoa_to_sheet(overview);
  overviewWs["!cols"] = [{ wch: 18 }, { wch: 24 }];
  // Prepend so Overview opens first.
  XLSX.utils.book_append_sheet(wb, overviewWs, "Overview");
  wb.SheetNames = ["Overview", ...wb.SheetNames.filter((n) => n !== "Overview")];

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  return {
    base64,
    filename: `sales-report-${from}_to_${to}.xlsx`,
    sheets,
  };
}

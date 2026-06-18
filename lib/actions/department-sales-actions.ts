"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type {
  DepartmentItemSalesResult,
  DepartmentSalesRollup,
} from "@/types/item-sales/type";

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * "Sales by department" rollup — one aggregated row per department for the
 * period. The Reports Service does the GROUP BY in ClickHouse, so this is a
 * tiny payload (a handful of rows) regardless of how many products sold.
 */
export async function getDepartmentSalesRollup(
  from: string,
  to: string,
): Promise<DepartmentSalesRollup[]> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return [];
    const apiClient = new ApiClient("reports");
    const rows = await apiClient.get<DepartmentSalesRollup[]>(
      `/api/v2/analytics/item-sales/departments`,
      { params: { locationId: location.id, startDate: from, endDate: to } },
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      departmentId: r.departmentId ?? null,
      departmentName: r.departmentName ?? null,
      products: num(r.products),
      quantitySold: num(r.quantitySold),
      grossSales: num(r.grossSales),
      netSales: num(r.netSales),
      grossProfit: num(r.grossProfit),
    }));
  } catch {
    return [];
  }
}

interface ByDepartmentParams {
  departmentId: string;
  from: string;
  to: string;
  /** 0-based page index. */
  page?: number;
  size?: number;
  /** Table column key (e.g. "quantitySold", "grossSales"). */
  sort?: string;
  search?: string;
}

const EMPTY_RESULT: DepartmentItemSalesResult = {
  totals: {
    departmentId: null,
    departmentName: null,
    products: 0,
    quantitySold: 0,
    grossSales: 0,
    netSales: 0,
    grossProfit: 0,
  },
  items: {
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 1,
    last: true,
  },
};

/**
 * One server-paginated page of items sold in a department, plus the
 * department's whole-period totals (KPI strip). Search/sort/paging are all
 * resolved by ClickHouse, so the browser only ever holds one page.
 */
export async function getDepartmentItemSales(
  p: ByDepartmentParams,
): Promise<DepartmentItemSalesResult> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return EMPTY_RESULT;
    const apiClient = new ApiClient("reports");
    const params: Record<string, unknown> = {
      locationId: location.id,
      departmentId: p.departmentId,
      startDate: p.from,
      endDate: p.to,
      page: p.page ?? 0,
      size: p.size ?? 20,
    };
    if (p.sort) params.sort = p.sort;
    if (p.search) params.search = p.search;

    const data = await apiClient.get<DepartmentItemSalesResult>(
      `/api/v2/analytics/item-sales/by-department`,
      { params },
    );
    const t = data?.totals;
    const items = data?.items;
    return {
      totals: {
        departmentId: t?.departmentId ?? null,
        departmentName: t?.departmentName ?? null,
        products: num(t?.products),
        quantitySold: num(t?.quantitySold),
        grossSales: num(t?.grossSales),
        netSales: num(t?.netSales),
        grossProfit: num(t?.grossProfit),
      },
      items: {
        content: (items?.content ?? []).map((r) => ({
          productId: r.productId,
          variantId: r.variantId,
          itemName: r.itemName ?? "",
          departmentName: r.departmentName ?? null,
          quantitySold: num(r.quantitySold),
          grossSales: num(r.grossSales),
          netSales: num(r.netSales),
          totalDiscount: num(r.totalDiscount),
          totalCost: num(r.totalCost),
          grossProfit: num(r.grossProfit),
        })),
        page: num(items?.page),
        size: num(items?.size) || (p.size ?? 20),
        totalElements: num(items?.totalElements),
        totalPages: Math.max(1, num(items?.totalPages)),
        last: items?.last ?? true,
      },
    };
  } catch {
    return EMPTY_RESULT;
  }
}

const csvCell = (value: string | number): string => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const slugify = (name: string): string =>
  name
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "department";

/**
 * Builds the full department CSV server-side (the whole department, not just
 * the visible page) and hands back the text for the client to download. Honours
 * the current item-name search so the export matches what's filtered.
 */
export async function exportDepartmentSalesCsv(
  departmentId: string,
  departmentName: string,
  from: string,
  to: string,
  currency: string,
  search?: string,
): Promise<{ csv: string; filename: string }> {
  const result = await getDepartmentItemSales({
    departmentId,
    from,
    to,
    page: 0,
    size: 10000,
    search,
  });

  const header = [
    "Item",
    "Qty sold",
    `Gross (${currency})`,
    `Discount (${currency})`,
    `Net (${currency})`,
    `COGS (${currency})`,
    `Gross profit (${currency})`,
    "Margin %",
  ];
  const body = result.items.content.map((r) => {
    const margin = r.netSales > 0 ? (r.grossProfit / r.netSales) * 100 : 0;
    return [
      r.itemName,
      r.quantitySold,
      r.grossSales,
      r.totalDiscount,
      r.netSales,
      r.totalCost,
      r.grossProfit,
      margin.toFixed(1),
    ]
      .map(csvCell)
      .join(",");
  });
  const csv = [header.map(csvCell).join(","), ...body].join("\n");

  return {
    csv,
    filename: `${slugify(departmentName)}-sales-${from}_to_${to}.csv`,
  };
}

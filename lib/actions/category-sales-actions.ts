"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import type {
  CategoryItemSalesResult,
  CategorySalesRollupResult,
  PeriodSalesTotals,
} from "@/types/item-sales/type";

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toTotals = (
  t: Partial<PeriodSalesTotals> | undefined | null,
): PeriodSalesTotals => ({
  quantitySold: num(t?.quantitySold),
  grossSales: num(t?.grossSales),
  netSales: num(t?.netSales),
  grossProfit: num(t?.grossProfit),
});

const EMPTY_TOTALS: PeriodSalesTotals = {
  quantitySold: 0,
  grossSales: 0,
  netSales: 0,
  grossProfit: 0,
};

/**
 * "Sales by category" rollup — true period totals + one aggregated row per
 * category. The Reports Service derives categories from the current catalog
 * (`dim_product.categories`) in ClickHouse, so it's uncapped and tiny.
 */
export async function getCategorySalesRollup(
  from: string,
  to: string,
): Promise<CategorySalesRollupResult> {
  const empty: CategorySalesRollupResult = {
    totals: { ...EMPTY_TOTALS },
    categories: [],
  };
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return empty;
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<CategorySalesRollupResult>(
      `/api/v2/analytics/item-sales/categories`,
      { params: { locationId: location.id, startDate: from, endDate: to } },
    );
    return {
      totals: toTotals(data?.totals),
      categories: (data?.categories ?? []).map((r) => ({
        categoryId: r.categoryId ?? null,
        categoryName: r.categoryName ?? null,
        products: num(r.products),
        quantitySold: num(r.quantitySold),
        grossSales: num(r.grossSales),
        netSales: num(r.netSales),
        grossProfit: num(r.grossProfit),
      })),
    };
  } catch {
    return empty;
  }
}

interface ByCategoryParams {
  categoryId: string;
  from: string;
  to: string;
  /** 0-based page index. */
  page?: number;
  size?: number;
  /** Table column key (e.g. "quantitySold", "grossSales"). */
  sort?: string;
  search?: string;
}

const EMPTY_RESULT: CategoryItemSalesResult = {
  totals: {
    categoryId: null,
    categoryName: null,
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
 * One server-paginated page of items sold in a category, plus the category's
 * whole-period totals (KPI strip). Search/sort/paging resolved by ClickHouse.
 */
export async function getCategoryItemSales(
  p: ByCategoryParams,
): Promise<CategoryItemSalesResult> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return EMPTY_RESULT;
    const apiClient = new ApiClient("reports");
    const params: Record<string, unknown> = {
      locationId: location.id,
      categoryId: p.categoryId,
      startDate: p.from,
      endDate: p.to,
      page: p.page ?? 0,
      size: p.size ?? 20,
    };
    if (p.sort) params.sort = p.sort;
    if (p.search) params.search = p.search;

    const data = await apiClient.get<CategoryItemSalesResult>(
      `/api/v2/analytics/item-sales/by-category`,
      { params },
    );
    const t = data?.totals;
    const items = data?.items;
    return {
      totals: {
        categoryId: t?.categoryId ?? null,
        categoryName: t?.categoryName ?? null,
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
    .toLowerCase() || "category";

/**
 * Builds the full category CSV server-side (the whole category, not just the
 * visible page). Honours the current item-name search.
 */
export async function exportCategorySalesCsv(
  categoryId: string,
  categoryName: string,
  from: string,
  to: string,
  currency: string,
  search?: string,
): Promise<{ csv: string; filename: string }> {
  const result = await getCategoryItemSales({
    categoryId,
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
    filename: `${slugify(categoryName)}-sales-${from}_to_${to}.csv`,
  };
}

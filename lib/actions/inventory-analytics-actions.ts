"use server";

import ApiClient from "@/lib/settlo-api-client";
import { itemDisplayName } from "@/lib/display-name";
import { parseStringify } from "@/lib/utils";
import { inventoryUrl } from "./inventory-client";
import type {
  StockoutForecastItem,
  StockTurnoverItem,
  AbcAnalysisItem,
  MovementTypeSummary,
  ReorderSuggestion,
  DeadStockItem,
  InventoryValuationItem,
  StockAging,
} from "@/types/inventory-analytics/type";
import { type PackagingReport, EMPTY_PACKAGING_REPORT } from "@/types/packaging-report/type";

// Maps server field names (variantId/displayName) to client names
// (stockVariantId/variantName). `variantName` becomes the full composed item
// label ("Coca-Cola 300ml") — re-composed against `stockName` so migrated
// rows whose stored displayName is bare still read correctly — while
// `stockName` stays the parent name only (previously it fell back to the
// composed displayName, which made parent+variant pairings render the
// composed name twice).
function mapVariantFields<T extends Record<string, unknown>>(
  item: T,
): T & { stockVariantId: string; variantName: string; stockName: string } {
  const stockName = (item.stockName as string) ?? "";
  return {
    ...item,
    stockVariantId: (item.variantId as string) ?? (item.stockVariantId as string),
    variantName: itemDisplayName({
      parentName: stockName,
      variantName: item.variantName as string | undefined,
      displayName: item.displayName as string | undefined,
    }),
    stockName,
  };
}

/**
 * @param stockId scope the forecast to one stock item's variants. The
 *   unscoped call answers for the whole location and drops variants with
 *   nothing on hand; a scoped call keeps them, so an item that has run dry
 *   still reports its risk.
 */
export async function getStockoutForecast(
  lookbackDays = 30,
  stockId?: string,
): Promise<StockoutForecastItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/forecasts/stockout?lookbackDays=${lookbackDays}${
          stockId ? `&stockId=${stockId}` : ""
        }`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.forecasts ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

/**
 * @param stockId scope to one stock item's variants. Unscoped, the backend
 *   returns only variants that are actually below their reorder point;
 *   scoped, it returns every variant of the item so the page can show
 *   "healthy" as an answer rather than as an empty table.
 */
export async function getReorderSuggestions(
  lookbackDays = 30,
  leadTimeDays = 7,
  reorderCoverDays = 14,
  stockId?: string,
): Promise<ReorderSuggestion[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      lookbackDays: String(lookbackDays),
      leadTimeDays: String(leadTimeDays),
      reorderCoverDays: String(reorderCoverDays),
      ...(stockId ? { stockId } : {}),
    });
    const data = await apiClient.get(
      inventoryUrl(`/api/v1/forecasts/reorder-suggestions?${params}`),
    );
    const parsed = parseStringify(data);
    const items = parsed?.suggestions ?? (Array.isArray(parsed) ? parsed : []);
    return items.map((item: Record<string, unknown>) => ({
      ...mapVariantFields(item),
      currentAvailableQuantity: item.currentQuantity ?? item.currentAvailableQuantity ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getInventoryValuation(): Promise<
  InventoryValuationItem[]
> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/reports/inventory-valuation"),
    );
    const parsed = parseStringify(data);
    const items = parsed?.variants ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

export async function getMovementSummary(
  from: string,
  to: string,
): Promise<MovementTypeSummary[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/reports/movement-summary?from=${from}&to=${to}`,
      ),
    );
    const parsed = parseStringify(data);
    return parsed?.byType ?? (Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

/**
 * @param stockId scope to one stock item's variants. Unscoped, variants with
 *   nothing on hand are excluded (no meaningful ratio in a location-wide
 *   ranking); scoped, they're kept.
 */
export async function getStockTurnover(
  stockId?: string,
): Promise<StockTurnoverItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/reports/stock-turnover${stockId ? `?stockId=${stockId}` : ""}`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.variants ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

/**
 * @param stockId return only this stock item's variants. The A/B/C ranking is
 *   still computed against every variant at the location — classifying an item
 *   against itself would make everything an "A".
 */
export async function getAbcAnalysis(
  lookbackDays = 365,
  stockId?: string,
): Promise<AbcAnalysisItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/reports/abc-analysis?lookbackDays=${lookbackDays}${
          stockId ? `&stockId=${stockId}` : ""
        }`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

export async function getStockAging(): Promise<StockAging | null> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(inventoryUrl("/api/v1/reports/aging"));
    return parseStringify(data) as StockAging;
  } catch {
    return null;
  }
}

export async function getDeadStock(
  daysInactive = 30,
): Promise<DeadStockItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/reports/dead-stock?daysInactive=${daysInactive}`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

export async function getPackagingReport(): Promise<PackagingReport> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/reports/packaging"),
    );
    return parseStringify(data) as PackagingReport;
  } catch {
    return EMPTY_PACKAGING_REPORT;
  }
}

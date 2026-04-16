"use server";

import ApiClient from "@/lib/settlo-api-client";
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
} from "@/types/inventory-analytics/type";

// Maps server field names (variantId/displayName) to client names (stockVariantId/variantName)
function mapVariantFields<T extends Record<string, unknown>>(
  item: T,
): T & { stockVariantId: string; variantName: string; stockName: string } {
  return {
    ...item,
    stockVariantId: (item.variantId as string) ?? (item.stockVariantId as string),
    variantName: (item.displayName as string) ?? (item.variantName as string) ?? "",
    stockName: (item.stockName as string) ?? (item.displayName as string) ?? "",
  };
}

export async function getStockoutForecast(
  lookbackDays = 30,
): Promise<StockoutForecastItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/forecasts/stockout?lookbackDays=${lookbackDays}`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.forecasts ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

export async function getReorderSuggestions(
  lookbackDays = 30,
  leadTimeDays = 7,
  reorderCoverDays = 14,
): Promise<ReorderSuggestion[]> {
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({
      lookbackDays: String(lookbackDays),
      leadTimeDays: String(leadTimeDays),
      reorderCoverDays: String(reorderCoverDays),
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

export async function getStockTurnover(): Promise<StockTurnoverItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl("/api/v1/reports/stock-turnover"),
    );
    const parsed = parseStringify(data);
    const items = parsed?.variants ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
  }
}

export async function getAbcAnalysis(
  lookbackDays = 365,
): Promise<AbcAnalysisItem[]> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      inventoryUrl(
        `/api/v1/reports/abc-analysis?lookbackDays=${lookbackDays}`,
      ),
    );
    const parsed = parseStringify(data);
    const items = parsed?.items ?? (Array.isArray(parsed) ? parsed : []);
    return items.map(mapVariantFields);
  } catch {
    return [];
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

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
    return parseStringify(data) as StockoutForecastItem[];
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
    return parseStringify(data) as ReorderSuggestion[];
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
    return parseStringify(data) as InventoryValuationItem[];
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
    return parseStringify(data) as MovementTypeSummary[];
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
    return parseStringify(data) as StockTurnoverItem[];
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
    return parseStringify(data) as AbcAnalysisItem[];
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
    return parseStringify(data) as DeadStockItem[];
  } catch {
    return [];
  }
}

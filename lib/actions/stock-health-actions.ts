"use server";

import { getCurrentLocation } from "./business/get-current-business";
import { getBalancesByLocation } from "./inventory-balance-actions";
import {
  getDeadStock,
  getReorderSuggestions,
  getStockoutForecast,
} from "./inventory-analytics-actions";
import { getLocationCurrency } from "./currency-actions";
import type { StockHealthSummary } from "@/types/stock-health/type";

const EMPTY: StockHealthSummary = {
  currency: "TZS",
  activeSkus: 0,
  totalQty: 0,
  totalValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  criticalRiskCount: 0,
  deadStockCount: 0,
  reorderAlerts: [],
};

/**
 * Location-wide stock health snapshot for the main dashboard. Combines balance
 * counts with the forecast + reorder + dead-stock endpoints so the dashboard
 * card stays a single round-trip for the UI.
 */
export async function getStockHealthSummary(): Promise<StockHealthSummary> {
  const location = await getCurrentLocation();
  if (!location?.id) return EMPTY;

  const [currency, balances, forecasts, reorder, deadStock] = await Promise.all([
    getLocationCurrency(),
    getBalancesByLocation(location.id),
    getStockoutForecast(),
    getReorderSuggestions(),
    getDeadStock(30),
  ]);

  let totalQty = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const b of balances) {
    totalQty += b.quantityOnHand;
    totalValue += b.quantityOnHand * (b.averageCost ?? 0);
    if (b.outOfStock) outOfStockCount += 1;
    else if (b.lowStock) lowStockCount += 1;
  }

  const criticalRiskCount = forecasts.filter(
    (f) => f.riskLevel === "CRITICAL" || f.riskLevel === "HIGH",
  ).length;

  return {
    currency: currency || "TZS",
    activeSkus: balances.length,
    totalQty,
    totalValue,
    lowStockCount,
    outOfStockCount,
    criticalRiskCount,
    deadStockCount: deadStock.length,
    reorderAlerts: reorder.slice(0, 10).map((r) => ({
      stockVariantId: r.stockVariantId,
      variantName: r.variantName,
      currentAvailableQuantity: r.currentAvailableQuantity,
      reorderPoint: r.reorderPoint,
      suggestedOrderQuantity: r.suggestedOrderQuantity,
      daysOfStockRemaining: r.daysOfStockRemaining,
    })),
  };
}

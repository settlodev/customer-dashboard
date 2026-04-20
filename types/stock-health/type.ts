export interface StockHealthReorderAlert {
  stockVariantId: string;
  variantName: string;
  currentAvailableQuantity: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  daysOfStockRemaining: number;
}

export interface StockHealthSummary {
  currency: string;
  activeSkus: number;
  totalQty: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  criticalRiskCount: number;
  deadStockCount: number;
  reorderAlerts: StockHealthReorderAlert[];
}

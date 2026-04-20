export interface DailySnapshotSummary {
  locationId: string;
  locationType: string;
  currency: string;
  snapshotDate: string;
  totalVariants: number;
  totalOpeningValue: number;
  totalClosingValue: number;
  totalPurchaseQuantity: number;
  totalSaleQuantity: number;
  items: InventorySnapshot[];
}

export interface InventorySnapshot {
  id: string;
  locationType: string;
  locationId: string;
  stockVariantId: string;
  stockVariantName: string;
  stockVariantSku: string | null;
  snapshotDate: string;
  openingQuantity: number;
  closingQuantity: number;
  openingValue: number;
  closingValue: number;
  purchaseQuantity: number;
  saleQuantity: number;
  transferInQuantity: number;
  transferOutQuantity: number;
  adjustmentQuantity: number;
  damageQuantity: number;
  returnQuantity: number;
  recipeUsageQuantity: number;
  openingBalanceQuantity: number;
  reservedQuantity: number;
  inTransitQuantity: number;
  averageCost: number | null;
  currentBatchCost: number | null;
  currency: string | null;
  createdAt: string;
}

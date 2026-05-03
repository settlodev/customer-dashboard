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
  /** Synthetic row id when sourced from the Inventory Service. The Reports
   *  Service fact has no per-row id (the natural key is variantId+date). */
  id?: string;
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
  /** Location base currency. Reports Service omits — defaults to null. */
  currency?: string | null;
  /** Row creation timestamp. Reports Service omits — UI doesn't read it. */
  createdAt?: string;
}

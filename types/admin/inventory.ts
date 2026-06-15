export type EntityType = "LOCATION" | "WAREHOUSE" | "STORE";

export interface TopStockItemRow {
  variantId: string;
  name: string;
  quantityOnHand: number;
  stockValue: number;
}

export interface LowStockItemRow {
  variantId: string;
  name: string;
  available: number;
  lowStockThreshold: number;
}

export interface EntityStockSummary {
  locationType: EntityType;
  locationId: string;
  totalStockValue: number;
  totalQuantityOnHand: number;
  productCount: number;
  variantCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeBatchCount: number;
  lastMovementAt: string | null;
  topItemsByValue: TopStockItemRow[];
  lowStockItems: LowStockItemRow[];
}

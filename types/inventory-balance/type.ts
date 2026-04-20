import type { DestinationType } from "@/types/catalogue/enums";

export interface InventoryBalance {
  id: string;
  locationType: DestinationType;
  locationId: string;
  stockVariantId: string;
  variantName: string;
  stockName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  expectedQuantity: number;
  averageCost: number | null;
  currentBatchCost: number | null;
  /** Location base currency — applies to cost fields above. */
  currency: string | null;
  lowStockThreshold: number | null;
  lowStockAlertSent: boolean;
  lowStock: boolean;
  outOfStock: boolean;
  overstockThreshold: number | null;
  overstockAlertSent: boolean;
  overstock: boolean;
  reorderPoint: number | null;
  reorderQuantity: number | null;
  preferredSupplierId: string | null;
  lastMovementAt: string | null;
}

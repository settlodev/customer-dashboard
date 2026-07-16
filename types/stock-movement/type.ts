export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "RECIPE_USAGE"
  | "OPENING_BALANCE"
  | "WASTE"
  | "CONTAINER_RETURN_IN"
  | "CONTAINER_RETURN_OUT"
  | "PACKAGING_CONSUMED";

export type ReferenceType =
  | "GRN"
  | "SALE_ORDER"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RETURN"
  | "CONSUMPTION_RULE"
  | "BOM_RULE"
  | "STOCK_MODIFICATION"
  | "OPENING_STOCK"
  | "STOCK_INTAKE"
  | "SUPPLIER_RETURN"
  | "ORDER_VOID"
  | "PRODUCTION_ORDER"
  | "BATCH_RECALL";

export interface StockMovement {
  movementId: string;
  variantId: string;
  stockName: string;
  variantName: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  divisibleUnitId: string | null;
  divisibleUnitName: string | null;
  divisibleUnitAbbreviation: string | null;
  divisibleUnitRatio: number | null;
  locationId: string;
  locationType: string;
  businessDate: string;
  movementType: MovementType;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  /** Friendly source code (e.g. "GRN-1234"). Phase 2 (V021). */
  referenceNumber?: string | null;
  /** Staff/user who triggered the movement. Phase 2 (V021). */
  userId?: string | null;
  quantity: number;
  baseQuantity: number;
  unitCost: number | null;
  totalCost: number | null;
  /** Backend-computed direction so the UI doesn't have to infer it. */
  direction?: "IN" | "OUT";
  /** Absolute |quantity| — display this with an explicit `+`/`-` prefix
   *  driven by `direction`. No more Math.abs / sign-checking on the UI. */
  quantityAbs?: number;
  /** Absolute |totalCost|. Negative-magnitude rows (e.g. supplier returns)
   *  display the magnitude; the colour treatment indicates direction. */
  totalCostAbs?: number;
  currency: string | null;
  /** Pre/post deltas. Phase 2 (V021). */
  previousBalance?: number | null;
  newBalance?: number | null;
  previousAverageCost?: number | null;
  newAverageCost?: number | null;
  priorBatchId?: string | null;
  occurredAt: string;
  eventTime: string;
}

export interface MovementTypeBreakdown {
  movementType: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
  /** Backend-computed direction (sign of totalQuantity). */
  direction?: "IN" | "OUT";
  /** Absolute |totalQuantity| ready to render. */
  totalQuantityAbs?: number;
}

export interface StockMovementSummary {
  locationId: string;
  startDate: string;
  endDate: string;
  totalMovements: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  netQuantityChange: number;
  totalCostIn: number;
  totalCostOut: number;
  byType: MovementTypeBreakdown[];
}

export interface StockMovementByItem {
  variantId: string;
  stockName: string;
  variantName: string;
  movementCount: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  netQuantityChange: number;
  totalCostIn: number;
  totalCostOut: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
  RETURN: "Return",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  RECIPE_USAGE: "Recipe Usage",
  OPENING_BALANCE: "Opening Balance",
  WASTE: "Waste",
  CONTAINER_RETURN_IN: "Empties returned",
  CONTAINER_RETURN_OUT: "Empties handed back",
  PACKAGING_CONSUMED: "Packaging consumed",
};

/**
 * Friendly labels for the source-document type. Used in the variant
 * detail page's Movements tab to render rows like
 * "Stock modification — MOD-7890" or "GRN — GRN-1234".
 */
export const REFERENCE_TYPE_LABELS: Record<ReferenceType, string> = {
  GRN: "GRN",
  SALE_ORDER: "Sale",
  TRANSFER: "Stock transfer",
  ADJUSTMENT: "Adjustment",
  RETURN: "Return",
  CONSUMPTION_RULE: "Recipe rule",
  BOM_RULE: "BOM rule",
  STOCK_MODIFICATION: "Stock modification",
  OPENING_STOCK: "Opening stock",
  STOCK_INTAKE: "Stock intake",
  SUPPLIER_RETURN: "Supplier return",
  ORDER_VOID: "Order void",
  PRODUCTION_ORDER: "Production order",
  BATCH_RECALL: "Batch recall",
};

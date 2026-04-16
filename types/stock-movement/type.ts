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
  | "WASTE";

export type ReferenceType =
  | "GRN"
  | "SALE_ORDER"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RETURN"
  | "CONSUMPTION_RULE"
  | "STOCK_MODIFICATION"
  | "OPENING_STOCK"
  | "SUPPLIER_RETURN"
  | "ORDER_VOID";

export interface StockMovement {
  movementId: string;
  variantId: string;
  stockName: string;
  variantName: string;
  locationId: string;
  locationType: string;
  businessDate: string;
  movementType: MovementType;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  quantity: number;
  baseQuantity: number;
  unitCost: number | null;
  totalCost: number | null;
  currency: string | null;
  occurredAt: string;
  eventTime: string;
}

export interface MovementTypeBreakdown {
  movementType: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
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
};

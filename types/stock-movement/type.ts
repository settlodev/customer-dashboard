import type { DestinationType } from "@/types/catalogue/enums";

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
  id: string;
  locationType: DestinationType;
  locationId: string;
  stockVariantId: string;
  stockVariantName: string;
  stockName: string;
  movementType: MovementType;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  quantity: number;
  baseQuantity: number;
  unitCost: number | null;
  occurredAt: string;
  createdAt: string;
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

/**
 * Shapes returned by the Reports Service analytics endpoints
 * (`/api/v2/analytics/...`). Kept separate from inventory-analytics types
 * because the Reports Service is the canonical source for sales / movement
 * reporting and the field names differ slightly from the Inventory Service.
 */

export interface RsPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface RsMovement {
  movementId: string;
  variantId: string;
  stockName: string;
  variantName: string;
  locationId: string;
  locationType: string;
  businessDate: string;
  movementType: string;
  referenceType: string | null;
  referenceId: string | null;
  quantity: number;
  baseQuantity: number;
  unitCost: number | null;
  totalCost: number | null;
  currency: string | null;
  occurredAt: string;
  eventTime: string;
}

export interface RsMovementTypeBreakdown {
  movementType: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
}

export interface RsMovementSummary {
  locationId: string;
  startDate: string;
  endDate: string;
  totalMovements: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  netQuantityChange: number;
  totalCostIn: number;
  totalCostOut: number;
  byType: RsMovementTypeBreakdown[];
}

export interface RsItemSalesAggregate {
  productId: string | null;
  variantId: string;
  itemName: string;
  departmentName: string | null;
  quantitySold: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  totalCost: number;
  grossProfit: number;
}

export interface RsItemSalesSummary {
  locationId: string;
  staffId: string | null;
  startDate: string;
  endDate: string;
  totalItemsSold: number;
  totalQuantitySold: number;
  totalGrossSales: number;
  totalNetSales: number;
  totalDiscount: number;
  totalCost: number;
  totalGrossProfit: number;
  items: RsItemSalesAggregate[];
}

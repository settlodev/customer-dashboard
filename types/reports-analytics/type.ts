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
  /** Backend-computed direction (sign of totalQuantity). V025+. */
  direction?: "IN" | "OUT";
  /** Absolute |totalQuantity| ready to render. V025+. */
  totalQuantityAbs?: number;
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

/**
 * Per-tile 8-day historical series for the dashboard sparklines. Every
 * array is the same length (typically 8) and aligns by index with `days`.
 * The trailing point (today) is sourced from live state so the line
 * tracks the headline number rather than the last EOD snapshot.
 */
export interface RsInventoryDashboardSparklines {
  days: string[];
  totalInventoryValue: number[];
  activeSkus: number[];
  unitsInStock: number[];
  /** Out-of-stock SKU count per day (closing_quantity ≤ 0 proxy). */
  lowStockSkus: number[];
  /** Daily sale ÷ (sale + receipt) × 100 — directional proxy. */
  sellThroughPct: number[];
  /** Daily closing_quantity ÷ mean_daily_sales_30d — days-of-supply trend. */
  avgDaysOnHand: number[];
}

/**
 * Six-tile dashboard bundle returned by
 * `GET /api/v2/analytics/inventory/dashboard/summary`. Delta fields are
 * nullable: when the comparison window has no data yet (new location, no
 * 7-day-old or 30-day-old snapshot), the backend returns null instead of a
 * misleading zero so the UI can render a placeholder.
 */
export interface RsInventoryDashboardSummary {
  totalInventoryValue: number;
  totalInventoryCurrency: string;
  totalInventoryValueWowPct: number | null;

  activeSkus: number;
  activeSkusDailyDelta: number;

  unitsInStock: number;
  unitsInStockWowPct: number | null;

  /** Total SKUs at-or-below low threshold OR out of stock. */
  lowStockSkus: number;
  /** Subset of {@link lowStockSkus} that are fully out of stock. */
  criticalStockSkus: number;

  sellThroughPct: number | null;
  sellThroughPpDelta: number | null;

  avgDaysOnHand: number | null;
  avgDaysOnHandDelta: number | null;

  /** 8-day historical series for inline sparklines. Null when unavailable. */
  sparklines?: RsInventoryDashboardSparklines | null;

  generatedAt: string;
}

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

/**
 * Four-tile KPI bundle for the /stock-intakes page. Returned by
 * `GET /api/v2/analytics/inventory/stock-management/stock-intakes/summary`.
 * Delta fields are nullable when there's no prior-period baseline.
 */
export interface RsStockIntakeKpi {
  intakesCount: number;
  intakesWeekDelta: number | null;
  unitsReceived: number;
  unitsReceivedWowPct: number | null;
  awaitingConfirmation: number;
  awaitingOver24h: number;
  varianceFlags: number;
  intakesSparkline: number[];
  unitsSparkline: number[];
  generatedAt: string;
}

/** /stock-modifications summary. */
export interface RsStockModificationKpi {
  modificationsCount: number;
  modificationsWeekDelta: number | null;
  netAdjustmentUp: number;
  netAdjustmentDown: number;
  highCostWriteOffs: number;
  modificationsSparkline: number[];
  generatedAt: string;
}

/** /stock-takes summary. */
export interface RsStockTakeKpi {
  openTakes: number;
  takesInProgress: number;
  countsCount: number;
  countsWeekDelta: number | null;
  avgAccuracyPct: number | null;
  accuracyDelta: number | null;
  varianceFlags: number;
  takesSparkline: number[];
  generatedAt: string;
}

/** /stock-transfers summary. */
export interface RsStockTransferKpi {
  transfersCount: number;
  transfersWeekDelta: number | null;
  inTransit: number;
  dueToday: number;
  avgLeadTimeDays: number | null;
  leadTimeDelta: number | null;
  onTimeArrivalsPct: number | null;
  onTimeDelta: number | null;
  transfersSparkline: number[];
  generatedAt: string;
}

/** /bom-rules summary. */
export interface RsBomRulesKpi {
  activeRules: number;
  linkedVariants: number;
  consumptionHits7d: number;
  consumptionHitsWowPct: number | null;
  rulesNeedingReview: number;
  hitsSparkline: number[];
  generatedAt: string;
}

/** /purchase-requisitions summary. */
export interface RsPurchaseRequisitionKpi {
  openRequisitions: number;
  awaitingApproval: number;
  approvedCount: number;
  approvedWeekDelta: number | null;
  avgApprovalHours: number | null;
  avgApprovalDelta: number | null;
  rejectedCount: number;
  approvedSparkline: number[];
  generatedAt: string;
}

/** /rfqs summary. */
export interface RsRfqKpi {
  openRfqs: number;
  awaitingQuotes: number;
  quotesReceived: number;
  quotesWeekDelta: number | null;
  avgQuoteTurnaroundDays: number | null;
  turnaroundDelta: number | null;
  awardedCount: number;
  awardedOnTimePct: number | null;
  quotesSparkline: number[];
  generatedAt: string;
}

/** /purchase-orders summary. */
export interface RsPurchaseOrderKpi {
  openPos: number;
  awaitingReceipt: number;
  committedAmount: number;
  committedCurrency: string;
  committedWowPct: number | null;
  onTimeReceiptPct: number | null;
  onTimeDelta: number | null;
  overdueCount: number;
  committedSparkline: number[];
  generatedAt: string;
}

/** /goods-received summary. */
export interface RsGrnKpi {
  grnsCount: number;
  grnsWeekDelta: number | null;
  unitsReceived: number;
  unitsWowPct: number | null;
  pendingPosting: number;
  pendingOver24h: number;
  varianceFlags: number;
  grnsSparkline: number[];
  generatedAt: string;
}

/** /supplier-returns summary. */
export interface RsSupplierReturnKpi {
  returnsCount: number;
  returnsWeekDelta: number | null;
  inTransit: number;
  dueToday: number;
  creditDueAmount: number;
  creditDueCurrency: string;
  disputes: number;
  returnsSparkline: number[];
  generatedAt: string;
}

/** /products summary. */
export interface RsProductsKpi {
  /** Active product count (catalog size). */
  activeProducts: number;
  /** Net product additions this week (positive = grew). */
  productsWeekDelta: number | null;
  /** Variants currently out of stock and not unlimited. */
  outOfStockVariants: number;
  /** Variants at or below their low-stock threshold. */
  lowStockVariants: number;
  /** Gross sales (last 30d) in location base currency. */
  sales30d: number;
  /** Currency code for sales30d. */
  salesCurrency: string;
  /** WoW change in sales as a percent (e.g. 4.2 for +4.2%). */
  salesWowPct: number | null;
  /** Average gross margin % across the catalog over the last 30d. */
  avgMarginPct: number | null;
  /** WoW delta in margin in percentage points. */
  marginDelta: number | null;
  /** Daily product-count sparkline. */
  productsSparkline: number[];
  /** Daily sales sparkline (gross revenue). */
  salesSparkline: number[];
  generatedAt: string;
}

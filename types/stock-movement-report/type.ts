/**
 * Shapes returned by the Inventory Service stock movement report
 * (`GET /api/v1/reports/stock-movement/by-item`). The backend does the whole
 * per-item join + pagination + search + lens + sort, so the dashboard renders
 * a page of these directly.
 */

export type StockStatus = "ok" | "low" | "out" | "dead";

/**
 * Why a row is `low`: the configured reorder point / low-stock alert tripped
 * (`threshold`), or no threshold is set but live available is at or under the
 * forecast reorder point — 30-day daily use × 7-day lead time, the same figure
 * the stock item's analytics tab shows (`forecast`).
 */
export type LowReason = "threshold" | "forecast";

/** Raw signed per-type flow sums over the period (drives the drawer bars). */
export interface StockMovementBreakdown {
  purchase: number;
  sale: number;
  transferIn: number;
  transferOut: number;
  adjustment: number;
  damage: number;
  return: number;
  recipeUsage: number;
  openingBalance: number;
}

export interface StockMovementReportRow {
  variantId: string;
  /** Variant display name, e.g. "300ml". */
  variantName: string;
  /** Parent stock name, e.g. "Coca-Cola". */
  stockName: string;
  sku: string | null;

  opening: number;
  qtyIn: number;
  qtyOut: number;
  closing: number;
  value: number;

  reserved: number;
  available: number;
  /** Dispatched from another destination but not yet received here. */
  inTransit: number;
  avgCost: number;
  reorderPoint: number | null;

  status: StockStatus;
  /** Set only while status is `low`. */
  lowReason: LowReason | null;
  /** Daily use × 7-day lead time; null when the item hasn't moved out in 30 days. */
  forecastReorderPoint: number | null;

  /** Stock sitting in active batches that expire within the report horizon (30 days). */
  expiringQty: number;
  expiringBatches: number;
  /** yyyy-MM-dd of the soonest expiring batch, or null. */
  earliestExpiry: string | null;
  /** Days from today to that batch; ≤ 0 means already lapsed but not yet swept. */
  daysToExpiry: number | null;

  dailyUse: number | null;
  daysOfCover: number | null;
  daysIdle: number | null;
  lastMovementAt: string | null;

  breakdown: StockMovementBreakdown;
}

export interface StockMovementReportSummary {
  totalOpening: number;
  totalIn: number;
  totalOut: number;
  totalClosing: number;
  totalValue: number;
  totalInTransit: number;
  /** Lens counts (all = total item count for the current search). */
  all: number;
  movers: number;
  low: number;
  out: number;
  dead: number;
  reserved: number;
  expiring: number;
}

export interface StockMovementReportResponse {
  summary: StockMovementReportSummary;
  content: StockMovementReportRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

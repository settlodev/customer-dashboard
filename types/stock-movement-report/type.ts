/**
 * Shapes returned by the Inventory Service stock movement report
 * (`GET /api/v1/reports/stock-movement/by-item`). The backend does the whole
 * per-item join + pagination + search + lens + sort, so the dashboard renders
 * a page of these directly.
 */

export type StockStatus = "ok" | "low" | "out" | "dead";

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
  net: number;
  closing: number;
  value: number;

  reserved: number;
  available: number;
  /** Dispatched from another destination but not yet received here. */
  inTransit: number;
  avgCost: number;
  reorderPoint: number | null;

  status: StockStatus;
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
  totalNet: number;
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

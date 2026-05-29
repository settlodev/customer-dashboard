import type { UUID } from "node:crypto";

// ─── Request params ─────────────────────────────────────────────────
// Sent to `listTopSellingProducts`. The reports service is expected to
// pre-sort + cap the result, so the dashboard only ever pages over the
// rank-ordered top-N for whichever metric the user picked.

export type TopSellingSortBy = "revenue" | "quantity" | "profit";

export interface ListTopSellingParams {
  /** ISO date (yyyy-MM-dd). Lower bound (inclusive) on businessDate. */
  fromDate?: string;
  /** ISO date (yyyy-MM-dd). Upper bound (inclusive) on businessDate. */
  toDate?: string;
  /** Metric used to rank items. Defaults server-side to "revenue". */
  sortBy?: TopSellingSortBy;
  /** Cap on rows returned. Defaults server-side to 100. */
  limit?: number;
}

// ─── Row shape ──────────────────────────────────────────────────────
// One product (or product+variant) ranked inside the report. The server
// computes everything — the dashboard only formats. Keep things
// nullable where the catalogue may genuinely be missing data (variant
// name on simple products, image, cost on items that aren't COGS-tracked).

export interface TopSellingItem {
  /** 1-based rank inside the report, matching the chosen sortBy. */
  rank: number;

  productId: UUID | string;
  productVariantId: UUID | string | null;
  productName: string;
  variantName: string | null;
  categoryId: UUID | string | null;
  categoryName: string | null;
  imageUrl: string | null;

  // ── Volume ──────────────────────────────────────────────────────
  quantitySold: number;
  refundedQuantity: number;
  /** quantitySold − refundedQuantity. Server-computed for consistency. */
  netQuantitySold: number;
  /** Distinct orders this item appeared in over the period. */
  ordersCount: number;

  // ── Money (settlement currency) ─────────────────────────────────
  revenue: number;
  refundAmount: number;
  /** revenue − refundAmount. */
  netRevenue: number;
  discountAmount: number;
  costAmount: number;
  grossProfit: number;
  /** Percentage 0–100. Null when costAmount isn't tracked. */
  profitMargin: number | null;
  /** Net-revenue ÷ net-quantity. */
  averagePrice: number;

  // ── Share of report total ───────────────────────────────────────
  /** Percentage 0–100 of total revenue across all returned items. */
  revenueShare: number;
  /** Percentage 0–100 of total quantity across all returned items. */
  quantityShare: number;

  // ── Time bracket ────────────────────────────────────────────────
  firstSoldAt: string; // ISO
  lastSoldAt: string;  // ISO

  /** Top-selling staff member for this item over the period. */
  topStaffId: UUID | string | null;
  topStaffName: string | null;

  /**
   * Revenue series for the report period, bucketed by the server (daily
   * for ≤ 31-day ranges, weekly otherwise). Powers the row sparkline.
   * Null when the period is too short to be meaningful (< 2 buckets).
   */
  trend: number[] | null;
}

// ─── Report-level summary ───────────────────────────────────────────
// Drives the KPI strip. Server returns aggregates across the full
// matching dataset, not just the returned top-N rows — so totals stay
// stable when the user changes the row limit.

export interface TopSellingSummary {
  totalRevenue: number;
  totalNetRevenue: number;
  totalQuantitySold: number;
  totalNetQuantitySold: number;
  totalGrossProfit: number;
  /** Weighted average across products. Null when no COGS data. */
  averageMargin: number | null;
  uniqueProductCount: number;
  uniqueCategoryCount: number;
  totalOrdersCount: number;
  currency: string;
}

// ─── Top-level response ─────────────────────────────────────────────

export interface TopSellingReport {
  locationId: UUID | string;
  locationName: string;
  fromDate: string; // yyyy-MM-dd
  toDate: string;   // yyyy-MM-dd
  sortBy: TopSellingSortBy;
  generatedAt: string; // ISO

  summary: TopSellingSummary;
  items: TopSellingItem[];
}

// ─── Display helpers ────────────────────────────────────────────────

export const TOP_SELLING_SORT_OPTIONS: Array<{
  label: string;
  value: TopSellingSortBy;
}> = [
  { label: "By revenue", value: "revenue" },
  { label: "By quantity", value: "quantity" },
  { label: "By profit", value: "profit" },
];

export const TOP_SELLING_SORT_LABELS: Record<TopSellingSortBy, string> = {
  revenue: "Revenue",
  quantity: "Quantity sold",
  profit: "Gross profit",
};

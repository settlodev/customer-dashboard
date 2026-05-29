import type { UUID } from "node:crypto";

// ─── Status enum ────────────────────────────────────────────────────
// Per-line outcome — derived server-side from quantity, refunded
// quantity, and the OrderItem's removed/voided flag. The four states
// are mutually exclusive.

export type SoldItemStatus =
  | "SOLD"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "VOIDED";

// ─── Request params ─────────────────────────────────────────────────
// Sent to `listSoldItems`. The report is line-level (one row per
// OrderItem), so the server returns up to `limit` rows pre-filtered by
// status and date range — the dashboard paginates and searches client-side.

export interface ListSoldItemsParams {
  /** ISO date (yyyy-MM-dd). Lower bound (inclusive) on businessDate. */
  fromDate?: string;
  /** ISO date (yyyy-MM-dd). Upper bound (inclusive) on businessDate. */
  toDate?: string;
  /**
   * Status filter. Omit to include all line outcomes. Sending
   * "REFUNDED" matches PARTIALLY_REFUNDED + REFUNDED — the UI groups
   * those into one "Refunded" pill since the difference rarely
   * matters when scanning a list.
   */
  status?: SoldItemStatus;
  /** Optional product category filter. */
  categoryId?: string;
  /** Optional staff filter (the staff that added the item). */
  staffId?: string;
  /** Server-side cap on rows returned. Defaults to 500. */
  limit?: number;
}

// ─── Row shape — one OrderItem line ─────────────────────────────────
// Money-free by design. The screen exists so an operator can audit
// what physically went out the door, not the cash register.

export interface SoldItemLine {
  // Identity
  orderItemId: UUID | string;
  orderId: UUID | string;
  orderNumber: string;

  // Product
  productId: UUID | string;
  productVariantId: UUID | string | null;
  productName: string;
  variantName: string | null;
  categoryId: UUID | string | null;
  categoryName: string | null;
  imageUrl: string | null;

  // ── Volume ──────────────────────────────────────────────────────
  quantity: number;
  refundedQuantity: number;
  /** quantity − refundedQuantity. Always 0 for VOIDED lines. */
  netQuantity: number;

  // ── Status ──────────────────────────────────────────────────────
  status: SoldItemStatus;

  /**
   * Pulled from `OrderItem.voidReason` when the line was voided.
   * Null for non-voided lines, even when refunded — refund reasons
   * live on the refund record, not the item, and aren't surfaced
   * here to keep the line shape lean.
   */
  voidReason: string | null;

  // ── Modifications (compact) ─────────────────────────────────────
  /**
   * Modifier option names applied to this line (e.g. "Extra cheese",
   * "No onions"). Null on lines with no modifiers. The cell renders
   * a count badge + tooltip of the full list.
   */
  modifierNames: string[] | null;

  /** Add-on names applied to this line (chargeable extras). */
  addonNames: string[] | null;

  /** Free-text special instructions captured at POS, if any. */
  specialInstructions: string | null;

  // ── Discount (existence + name only — no money) ─────────────────
  /** Name of the discount applied to this line, if any. */
  discountName: string | null;

  // ── Staff attribution ───────────────────────────────────────────
  /** Staff that ADDED this line to the order (POS-side attribution). */
  staffId: UUID | string | null;
  staffName: string | null;

  // ── Time ────────────────────────────────────────────────────────
  /** When the line was created on the order (ISO timestamp). */
  soldAt: string;
  /** EAT business date for the day-session this line rolls up to. */
  businessDate: string;
}

// ─── Summary — drives the KPI strip ─────────────────────────────────
// Aggregated server-side over the full filtered dataset, NOT just the
// returned `limit` slice — so KPIs don't shift when limit/pagination
// changes.

export interface SoldItemsSummary {
  /** Distinct OrderItem rows in the filtered range. */
  totalLines: number;
  /** Sum of `quantity` (units that left the kitchen / counter). */
  totalUnitsSold: number;
  /** Sum of `refundedQuantity` across all lines. */
  totalRefundedUnits: number;
  /** Sum of `netQuantity` — units kept by customers. */
  totalNetUnitsSold: number;
  /** Count of VOIDED lines (zero impact on units sold, but useful for waste tracking). */
  totalVoidedLines: number;
  /** Count of distinct products. */
  uniqueProductCount: number;
  /** Count of distinct orders that contained at least one matching line. */
  uniqueOrderCount: number;
  /** Count of distinct staff that contributed. */
  uniqueStaffCount: number;
}

// ─── Top-level response ─────────────────────────────────────────────

export interface SoldItemsReport {
  locationId: UUID | string;
  locationName: string;
  fromDate: string; // yyyy-MM-dd
  toDate: string;   // yyyy-MM-dd
  generatedAt: string; // ISO
  summary: SoldItemsSummary;
  items: SoldItemLine[];
}

// ─── Display helpers ────────────────────────────────────────────────

export const SOLD_ITEM_STATUS_LABELS: Record<SoldItemStatus, string> = {
  SOLD: "Sold",
  PARTIALLY_REFUNDED: "Partial refund",
  REFUNDED: "Refunded",
  VOIDED: "Voided",
};

export const SOLD_ITEM_STATUS_PILL: Record<SoldItemStatus, string> = {
  SOLD: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  PARTIALLY_REFUNDED:
    "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  REFUNDED: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  VOIDED:
    "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
};

/**
 * Status filter options used by the URL-driven pill toggle. Values map
 * directly onto the `status` query param sent to `listSoldItems`.
 *
 * "REFUNDED" is the shorthand for "any refund activity" (the server
 * also returns PARTIALLY_REFUNDED rows for this value) — the UI keeps
 * it single-pill to avoid an awkward four-way split most users won't
 * care about.
 */
export const SOLD_ITEM_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: SoldItemStatus | "";
}> = [
  { label: "All", value: "" },
  { label: "Sold", value: "SOLD" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Voided", value: "VOIDED" },
];

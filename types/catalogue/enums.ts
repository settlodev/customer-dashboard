/**
 * Shared enums for the catalogue/inventory domain.
 * Values match the Inventory Service's Java enums exactly.
 */

export type DestinationType = "LOCATION" | "WAREHOUSE" | "STORE";

export type TaxClass = "A" | "B" | "C" | "D" | "E" | "ZANZIBAR";

// DRAFT is the initial state set when a merchant uses "Save as draft" in
// the product form. The merchant promotes it via the publish action;
// we deliberately don't expose DRAFT in LIFECYCLE_STATUS_OPTIONS below
// because it's never a user-selectable status, only a flow result.
export type LifecycleStatus =
  | "DRAFT"
  | "ACTIVE"
  | "DISCONTINUED"
  | "END_OF_LIFE";

// Why a product or variant was archived (V36). MERCHANT_ACTION = the
// merchant explicitly archived. SOLD_OUT = the order consumer
// auto-archived a variant flagged autoRetireOnSellout once its stock
// hit zero. null on rows archived before V36 (treat as MERCHANT_ACTION).
export type ArchiveReason = "MERCHANT_ACTION" | "SOLD_OUT";

export type PricingStrategy = "MANUAL" | "PERCENTAGE_MARKUP" | "FIXED_MARKUP";

export type StockLinkType = "DIRECT" | "FIXED" | "SCALED" | "FORMULA";

export type SelectionType = "SINGLE" | "MULTI";

export const TAX_CLASS_OPTIONS: { value: TaxClass; label: string }[] = [
  { value: "A", label: "Class A (Standard)" },
  { value: "B", label: "Class B" },
  { value: "C", label: "Class C" },
  { value: "D", label: "Class D" },
  { value: "E", label: "Class E (Exempt)" },
  { value: "ZANZIBAR", label: "Zanzibar" },
];

export const LIFECYCLE_STATUS_OPTIONS: { value: LifecycleStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISCONTINUED", label: "Discontinued" },
  { value: "END_OF_LIFE", label: "End of Life" },
];

export const PRICING_STRATEGY_OPTIONS: { value: PricingStrategy; label: string }[] = [
  { value: "MANUAL", label: "Manual Price" },
  { value: "PERCENTAGE_MARKUP", label: "Percentage Markup" },
  { value: "FIXED_MARKUP", label: "Fixed Markup" },
];

export const SELECTION_TYPE_OPTIONS: { value: SelectionType; label: string }[] = [
  { value: "SINGLE", label: "Single Selection" },
  { value: "MULTI", label: "Multiple Selection" },
];

// ── Currency ────────────────────────────────────────────────────────

// Common currencies for product native pricing. ISO-4217 3-letter codes.
// Backend stores VARCHAR(3); merchants outside this list can be added later
// without a schema change.
export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "TZS", label: "TZS — Tanzanian Shilling" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "UGX", label: "UGX — Ugandan Shilling" },
  { value: "RWF", label: "RWF — Rwandan Franc" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "ZAR", label: "ZAR — South African Rand" },
];

// ── Stock enums ─────────────────────────────────────────────────────

export type MaterialType =
  | "RAW_MATERIAL"
  | "SEMI_FINISHED"
  | "FINISHED_GOOD"
  | "TRADING_GOOD"
  | "PACKAGING"
  | "CONSUMABLE"
  | "SERVICE";

export type UnitType = "WEIGHT" | "VOLUME" | "LENGTH" | "PIECE" | "AREA";

export const MATERIAL_TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "SEMI_FINISHED", label: "Semi-Finished" },
  { value: "FINISHED_GOOD", label: "Finished Good" },
  { value: "TRADING_GOOD", label: "Trading Good" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "SERVICE", label: "Service" },
];

export const UNIT_TYPE_OPTIONS: { value: UnitType; label: string }[] = [
  { value: "WEIGHT", label: "Weight" },
  { value: "VOLUME", label: "Volume" },
  { value: "LENGTH", label: "Length" },
  { value: "PIECE", label: "Piece" },
  { value: "AREA", label: "Area" },
];

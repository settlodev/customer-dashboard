/**
 * Presentational helpers for the stock movement report.
 *
 * The per-item join, pagination, search, lens filter and sort now happen
 * server-side (Inventory Service `GET /api/v1/reports/stock-movement/by-item`).
 * This module keeps only the shared UI bits: lens definitions, number
 * formatting, the one-line item label, and turning the server's raw flow sums
 * into the drawer's breakdown bars.
 */

import type { StockMovementBreakdown } from "@/types/stock-movement-report/type";

export type StockLens = "all" | "movers" | "low" | "out" | "dead" | "reserved";

export interface LensDef {
  key: StockLens;
  label: string;
  /** Tints the count chip for attention lenses. */
  tone?: "warn" | "neg";
}

export const STOCK_LENSES: LensDef[] = [
  { key: "all", label: "All items" },
  { key: "movers", label: "Movers" },
  { key: "low", label: "Low", tone: "warn" },
  { key: "out", label: "Out of stock", tone: "neg" },
  { key: "dead", label: "Dead stock" },
  { key: "reserved", label: "Reserved" },
];

export const STOCK_LENS_KEYS: StockLens[] = STOCK_LENSES.map((l) => l.key);

export interface MovementBreakdownEntry {
  key: string;
  label: string;
  /** Signed: positive flowed into stock, negative pulled it out. */
  quantity: number;
}

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const EPS = 1e-6;

/**
 * Turn the server's raw per-type flow sums into signed breakdown bars, folding
 * anything the named types don't explain into an "Other" line so the drawer
 * reconciles `opening + in − out = closing` exactly like the table row.
 */
export function buildBreakdownEntries(
  b: StockMovementBreakdown,
  opening: number,
  closing: number,
): MovementBreakdownEntry[] {
  const flows: MovementBreakdownEntry[] = [
    { key: "purchase", label: "Received", quantity: num(b.purchase) },
    { key: "transferIn", label: "Transfer in", quantity: num(b.transferIn) },
    { key: "return", label: "Returned", quantity: num(b.return) },
    { key: "openingBalance", label: "Opening stock", quantity: num(b.openingBalance) },
    { key: "adjustment", label: "Adjusted", quantity: num(b.adjustment) },
    { key: "sale", label: "Sold", quantity: -Math.abs(num(b.sale)) },
    { key: "transferOut", label: "Transfer out", quantity: -Math.abs(num(b.transferOut)) },
    { key: "damage", label: "Damaged", quantity: -Math.abs(num(b.damage)) },
    { key: "recipeUsage", label: "Recipe use", quantity: -Math.abs(num(b.recipeUsage)) },
  ];

  let rawIn = 0;
  let rawOut = 0;
  for (const f of flows) {
    if (f.quantity > 0) rawIn += f.quantity;
    else if (f.quantity < 0) rawOut += -f.quantity;
  }

  const residual = closing - opening - (rawIn - rawOut);
  const entries = flows.filter((f) => Math.abs(f.quantity) > EPS);
  if (Math.abs(residual) > EPS) {
    entries.push({ key: "other", label: "Other", quantity: residual });
  }
  entries.sort((a, b2) => Math.abs(b2.quantity) - Math.abs(a.quantity));
  return entries;
}

/**
 * One-line item label: "Product Variant" (e.g. "Coca-Cola 300ml"), guarding
 * against duplication and bare "Default" variants.
 */
export function buildItemLabel(stockName: string, variantName: string): string {
  const stock = (stockName ?? "").trim();
  const variant = (variantName ?? "").trim();
  if (!stock) return variant || "Unknown item";
  if (!variant) return stock;
  const s = stock.toLowerCase();
  const v = variant.toLowerCase();
  if (v === s || v === "default") return stock;
  if (v.startsWith(s)) return variant;
  return `${stock} ${variant}`;
}

const QTY_FMT = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const COST_FMT = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

export const fmtQty = (v: number): string => QTY_FMT.format(Math.round(num(v)));
export const fmtCost = (v: number): string => COST_FMT.format(num(v));

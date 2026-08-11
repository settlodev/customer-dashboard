/**
 * Display helpers shared by every surface that renders stock movements — the
 * movement ledger, the stock item's activity timeline and the movement report.
 *
 * These live outside the components so the reference → route map and the
 * direction/label rules can't drift between two copies.
 */

import {
  MOVEMENT_TYPE_LABELS,
  REFERENCE_TYPE_LABELS,
  type ReferenceType,
  type StockMovement,
} from "@/types/stock-movement/type";

/**
 * Maps a movement reference to its detail page. Returns `null` for reference
 * types that have no dedicated detail route (rules, opening stock, recalls).
 */
export function referenceHref(
  refType: ReferenceType,
  refId: string,
): string | null {
  switch (refType) {
    case "GRN":
      return `/goods-received/${refId}`;
    case "STOCK_INTAKE":
      return `/stock-intakes/${refId}`;
    case "SUPPLIER_RETURN":
      return `/supplier-returns/${refId}`;
    case "TRANSFER":
      return `/stock-transfers/${refId}`;
    case "STOCK_MODIFICATION":
      return `/stock-modifications/${refId}`;
    case "ADJUSTMENT":
      return `/stock-takes/${refId}`;
    case "SALE_ORDER":
    case "ORDER_VOID":
      return `/orders/${refId}`;
    case "RETURN":
      return `/refunds/${refId}`;
    default:
      return null;
  }
}

/** Signed quantity, preferring the backend's `direction` over the raw sign. */
export function signedQuantity(m: StockMovement): number {
  const abs = Math.abs(m.quantityAbs ?? m.quantity);
  if (m.direction) return m.direction === "IN" ? abs : -abs;
  return m.quantity;
}

/**
 * Display label for the movement type.
 *
 * `RETURN` is overloaded on the backend — a customer handing goods back is a
 * positive movement, a return to a supplier is a negative one — and the raw
 * label "Return" leaves you unable to tell which happened. Only the sign is
 * reliable, so split it here.
 */
export function movementTypeLabel(m: StockMovement, signed: number): string {
  if (m.movementType === "RETURN") {
    return signed >= 0 ? "Customer return" : "Supplier return";
  }
  return MOVEMENT_TYPE_LABELS[m.movementType] ?? m.movementType;
}

/**
 * Turns an upstream enum name ("WRONG_ITEM") into prose ("Wrong item").
 *
 * The categories come from several different enums across services
 * (CancellationReason today, RefundReason once Settlo Common exposes it), so
 * this stays generic rather than keeping a label map that would silently fall
 * back to the raw SCREAMING_CASE whenever a new value is added upstream.
 */
export function humaniseReasonCode(code: string): string {
  const words = code.replace(/_/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The reversal's reason as one display string: the categorised code in prose,
 * the operator's free text, or both. Null when neither was recorded.
 */
export function reasonSummary(m: StockMovement): string | null {
  const code = m.reasonCode ? humaniseReasonCode(m.reasonCode) : null;
  const note = m.reasonNote?.trim() || null;
  if (code && note) return `${code} · ${note}`;
  return code ?? note;
}

/**
 * Short, human-checkable form of a UUID, for when the backend didn't attach a
 * friendly document number. Better than nothing: it still lets you match the
 * row against the linked record.
 */
export function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/**
 * What the entry points at: the source document's type and its identity. Falls
 * back to a truncated reference id when no document number was recorded, so a
 * row is never just a bare type name.
 */
export function referenceIdentity(m: StockMovement): {
  typeLabel: string;
  identity: string | null;
  isFallbackId: boolean;
} {
  const typeLabel = m.referenceType
    ? (REFERENCE_TYPE_LABELS[m.referenceType] ?? m.referenceType)
    : "No source document";
  if (m.referenceNumber) {
    return { typeLabel, identity: m.referenceNumber, isFallbackId: false };
  }
  if (m.referenceId) {
    return { typeLabel, identity: shortId(m.referenceId), isFallbackId: true };
  }
  return { typeLabel, identity: null, isFallbackId: false };
}

export const qty = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 3 });

export const signedQty = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${qty(Math.abs(n))}`;

/**
 * Parses a timestamp that may be either a full ISO instant or a bare
 * `yyyy-MM-dd` business date. Bare dates are anchored to *local* midnight —
 * `new Date("2026-08-11")` would parse as UTC and slide a day backwards in
 * western timezones.
 */
export function parseTimestamp(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

/** Local calendar-day key, so grouping and the rendered day label agree. */
export function localDayKey(value: string): string {
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function dayLabel(value: string): string {
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function timeLabel(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateLabel(value: string): string {
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

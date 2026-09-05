// Pure CSV builder for the stock item's movement ledger "Export CSV" action.
//
// Mirrors the ledger table column-for-column (Before → Qty → After, unit and
// total cost) and then the fields the expanded entry panel shows, so the file
// is the ledger as the operator read it — plus the same integrity verdicts
// the screen flags, in a `Check` column. Built in the browser from the rows
// the export action fetched; no numbers are recomputed here.

import type { StockMovement } from "@/types/stock-movement/type";
import {
  analyseLedgerRows,
  localDayKey,
  movementTypeLabel,
  qty,
  reasonSummary,
  referenceIdentity,
  signedQty,
  type LedgerRow,
} from "@/lib/stock-movement-display";

export interface MovementLedgerCsvInput {
  /** Ledger rows in display order (newest first, as the Reports Service pages them). */
  rows: StockMovement[];
  /** Item name as shown on the page — becomes part of the filename. */
  variantLabel: string;
  /** Fallback currency for rows that carry none. */
  currency: string;
  /** Period start, yyyy-MM-dd, or "" for all time. */
  from: string;
  /** Period end, yyyy-MM-dd, or "" for all time. */
  to: string;
  /** Actor id → display name, keyed by both staff id and auth id. */
  staffNames: Record<string, string>;
}

// Quote a cell only when it carries a comma, quote, newline, or edge
// whitespace (RFC 4180) — the common case stays readable.
const csvCell = (value: string | number): string => {
  const s = String(value ?? "");
  return /[",\n\r]/.test(s) || s !== s.trim()
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

// Raw numbers, no thousands separators, so spreadsheets parse them
// numerically. Six decimals is the ledger's own quantity scale; going
// through toFixed also strips float noise like 0.30000000000000004.
const num = (n: number | null | undefined): string =>
  n == null || !Number.isFinite(n) ? "" : String(Number(n.toFixed(6)));

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Local wall-clock HH:mm, matching the Time column on screen. */
function timeOfDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** The integrity verdicts the screen renders as badges, as one prose cell. */
function checkSummary(row: LedgerRow): string {
  const m = row.movement;
  const notes: string[] = [];
  if (row.untracked) notes.push("Before/after not captured");
  if (row.chainGap != null) {
    notes.push(
      `Unexplained change of ${signedQty(row.chainGap)} (entry written before closed at ${qty(
        m.previousClosingBalance ?? 0,
      )}, this one opened at ${qty(m.previousBalance ?? 0)})`,
    );
  }
  if (row.mathDelta != null) {
    notes.push(`Row math off by ${signedQty(row.mathDelta)}`);
  }
  if (row.negative) notes.push("Negative stock");
  return notes.join("; ");
}

function slug(label: string): string {
  const s = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

function periodSuffix(from: string, to: string): string {
  if (from && to) return from === to ? from : `${from}_to_${to}`;
  if (from) return `from_${from}`;
  if (to) return `to_${to}`;
  return "all-time";
}

/**
 * Render one variant's movement ledger as CSV. Returns the text plus a
 * suggested filename; the caller turns it into a download.
 */
export function buildMovementLedgerCsv(input: MovementLedgerCsvInput): {
  csv: string;
  filename: string;
} {
  const { rows, variantLabel, currency, from, to, staffNames } = input;

  const header = [
    "Business day",
    "Date",
    "Time",
    "Source",
    "Document",
    "Type",
    "Direction",
    "Before",
    "Qty",
    "After",
    `Unit cost (${currency})`,
    `Total cost (${currency})`,
    "Unit",
    "Recorded by",
    "Reason",
    "Check",
    "Occurred at",
    "Recorded into reports",
    "Movement id",
    "Reference id",
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const row of analyseLedgerRows(rows)) {
    const m = row.movement;
    const ref = referenceIdentity(m);
    // Signed like Qty, so a column sum is the net cost moved. The screen shows
    // the magnitude and colours the direction; a spreadsheet has no colour.
    const totalCost =
      m.totalCost != null
        ? m.totalCost
        : m.unitCost != null
          ? row.signed * m.unitCost
          : null;

    lines.push(
      [
        m.businessDate ?? "",
        localDayKey(m.occurredAt),
        timeOfDay(m.occurredAt),
        ref.typeLabel,
        // The truncated-id fallback the screen uses is for eyeballing; the
        // full id has its own column here, so an unnumbered document stays blank.
        m.referenceNumber ?? "",
        movementTypeLabel(m, row.signed),
        row.signed >= 0 ? "IN" : "OUT",
        num(m.previousBalance),
        num(row.signed),
        num(m.newBalance),
        num(m.unitCost),
        num(totalCost),
        m.unitAbbreviation || m.unitName || "",
        m.userId ? (staffNames[m.userId] ?? m.userId) : "",
        reasonSummary(m) ?? "",
        checkSummary(row),
        m.occurredAt ?? "",
        m.eventTime ?? "",
        m.movementId,
        m.referenceId ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return {
    csv: lines.join("\n"),
    filename: `movements_${slug(variantLabel)}_${periodSuffix(from, to)}.csv`,
  };
}

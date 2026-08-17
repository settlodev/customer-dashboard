import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  fmtQuantity,
  fmtRefundAmount,
  pluralize,
  type RefundBreakdownRow,
} from "@/types/reports/refunds";

// Inline colour tokens — `hsl(var(--…))` for fills, matching the cashflow
// panels (only the tint utilities exist as classes, not the raw ones).
const NEG = "hsl(var(--neg))";
const POS = "hsl(var(--pos))";
const WARN = "hsl(var(--warn))";

/**
 * Ordered categorical palette for the composition bar. Same values the
 * payment-mix widgets use (`PM_PALETTE`), so a stacked bar here reads as the
 * same system as one on the close-of-day screen.
 */
const CATEGORY_COLORS = [
  "#EB7F44",
  "hsl(var(--pos))",
  "#2563EB",
  "#7C3AED",
  "#C4892B",
  "hsl(var(--warn))",
  "hsl(var(--muted-2))",
  "#0E8B5F",
];

const colorAt = (i: number) => CATEGORY_COLORS[i % CATEGORY_COLORS.length];

// ─── Ranked breakdown list ──────────────────────────────────────────
// The workhorse: a share-bar list used for items, staff, refund type and
// payback method. Bars scale to the largest row so dominance reads at a
// glance; the right-rail % is the server-computed share of ALL refunds in
// the range, so a top-N list still tells the truth about the whole.

interface BreakdownListProps {
  rows: RefundBreakdownRow[];
  currency: string;
  /** Shown when there's nothing to rank. */
  emptyLabel: string;
  /** Bar fill; defaults to the refund (negative) tone. */
  barColor?: string;
  /** Prefix each row with its rank. Useful for "top N" lists. */
  numbered?: boolean;
  /** Render the units-returned count under the label. */
  showQuantity?: boolean;
  /** Render the COGS that came back (item breakdown only). */
  showCost?: boolean;
  /** Turns each row into a link (e.g. drill into the detail table). */
  hrefFor?: (row: RefundBreakdownRow) => string | undefined;
}

export function RefundBreakdownList({
  rows,
  currency,
  emptyLabel,
  barColor = NEG,
  numbered,
  showQuantity,
  showCost,
  hrefFor,
}: BreakdownListProps) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.refundedAmount), 1);

  return (
    <ul className="divide-y divide-line">
      {rows.map((row, i) => {
        const href = hrefFor?.(row);
        const meta = [
          pluralize(row.refundCount, "refund"),
          showQuantity ? `${fmtQuantity(row.quantity)} units` : null,
          showCost && row.returnedCost != null
            ? `${fmtRefundAmount(row.returnedCost)} cost back`
            : null,
        ].filter(Boolean);

        const body = (
          <>
            {numbered && (
              <span className="w-5 shrink-0 font-mono text-[12px] tabular-nums text-muted-2">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">
                    {row.label}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-2">
                    {meta.join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono text-[12.5px] tabular-nums text-ink">
                    {fmtRefundAmount(row.refundedAmount)}
                    <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
                      {currency}
                    </span>
                  </span>
                  {href && (
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (row.refundedAmount / max) * 100)}%`,
                      background: barColor,
                    }}
                  />
                </div>
                <span className="w-11 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
                  {row.share.toFixed(1)}%
                </span>
              </div>
            </div>
          </>
        );

        return (
          <li key={row.key || `${row.label}-${i}`} className="py-3 first:pt-0 last:pb-0">
            {href ? (
              <Link
                href={href}
                title={`View ${row.label} refunds`}
                className="group -mx-2 flex items-center gap-4 rounded-lg px-2 py-1 transition-colors hover:bg-canvas"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center gap-4">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Reason composition ─────────────────────────────────────────────
// Why the money went back, as a 100%-stacked bar over a compact legend.
// Reason is the one breakdown a manager acts on — DAMAGED trending up is an
// inventory problem, STAFF_ERROR is a training one — so it gets the shape
// that makes proportion, not ranking, the primary read.

export function RefundReasonComposition({
  rows,
  currency,
}: {
  rows: RefundBreakdownRow[];
  currency: string;
}) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No refund reasons recorded for this period.
      </p>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.refundedAmount, 0);
  const base = total > 0 ? total : 1;
  const segments = rows.filter((r) => r.refundedAmount > 0);

  return (
    <div className="space-y-4">
      {segments.length > 0 && (
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
          {segments.map((row, i) => (
            <div
              key={row.key}
              style={{
                width: `${(row.refundedAmount / base) * 100}%`,
                background: colorAt(i),
              }}
              title={`${row.label} — ${row.share.toFixed(1)}%`}
            />
          ))}
        </div>
      )}

      <ul className="space-y-2.5">
        {rows.map((row, i) => (
          <li
            key={row.key}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="flex min-w-0 items-baseline gap-2">
              <span
                className="h-2 w-2 shrink-0 translate-y-[-1px] rounded-full"
                style={{ background: colorAt(i) }}
              />
              <span className="truncate text-[13px] text-ink">{row.label}</span>
              <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-2">
                {pluralize(row.refundCount, "refund")}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12px] tabular-nums">
              <span className="text-ink">{fmtRefundAmount(row.refundedAmount)}</span>
              <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
                {currency}
              </span>
              <span className="ml-2 w-10 text-right text-[10.5px] text-muted-foreground">
                {row.share.toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Margin impact ──────────────────────────────────────────────────
// What a refund actually costs the business: revenue is reversed in full,
// but the COGS of any restocked unit comes back. The difference is the gross
// profit handed back — the number that belongs next to the sales P&L, and
// the reason "total refunded" alone overstates the damage.

function StatementRow({
  label,
  value,
  currency,
  sign,
  tone,
  strong,
  note,
}: {
  label: string;
  value: number;
  currency: string;
  sign: "+" | "−" | "=";
  tone: "pos" | "neg" | "ink";
  strong?: boolean;
  note?: string;
}) {
  const toneClass =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span
          className={cn(
            "text-[13px]",
            strong ? "font-semibold text-ink" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {note && (
          <span className="ml-2 font-mono text-[10.5px] text-muted-2">
            {note}
          </span>
        )}
      </span>
      <span
        className={cn(
          "shrink-0 font-mono tabular-nums",
          strong ? "text-[15px] font-semibold" : "text-[13px]",
          toneClass,
        )}
      >
        <span className="mr-1 text-muted-2">{sign}</span>
        {fmtRefundAmount(Math.abs(value))}
        <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
          {currency}
        </span>
      </span>
    </div>
  );
}

export function RefundImpactPanel({
  refundedAmount,
  returnedCost,
  restockedCount,
  refundCount,
  currency,
}: {
  refundedAmount: number;
  returnedCost: number;
  restockedCount: number;
  refundCount: number;
  currency: string;
}) {
  const marginImpact = refundedAmount - returnedCost;
  const notRestocked = Math.max(0, refundCount - restockedCount);
  const restockShare = refundCount > 0 ? (restockedCount / refundCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <StatementRow
          label="Revenue reversed"
          value={refundedAmount}
          currency={currency}
          sign="−"
          tone="neg"
        />
        <StatementRow
          label="Cost recovered"
          value={returnedCost}
          currency={currency}
          sign="+"
          tone="pos"
          note="stock back on hand"
        />
        <div className="border-t border-dashed border-line" />
        <StatementRow
          label="Gross profit given back"
          value={marginImpact}
          currency={currency}
          sign={marginImpact < 0 ? "+" : "="}
          tone={marginImpact > 0 ? "neg" : "ink"}
          strong
        />
      </div>

      {refundCount > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
            {restockedCount > 0 && (
              <div style={{ width: `${restockShare}%`, background: POS }} />
            )}
            {notRestocked > 0 && (
              <div style={{ width: `${100 - restockShare}%`, background: WARN }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: POS }} />
              Restocked
              <span className="tabular-nums text-muted-2">
                {restockedCount.toLocaleString()}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: WARN }} />
              Written off
              <span className="tabular-nums text-muted-2">
                {notRestocked.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

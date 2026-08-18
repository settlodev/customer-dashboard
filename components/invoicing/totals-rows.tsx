import { cn } from "@/lib/utils";
import type { DocTotals } from "@/types/invoicing/type";

const money = (n: number | null | undefined, c: string) =>
  `${(n ?? 0).toLocaleString()} ${c}`;

/**
 * Subtotal / Discount / Tax / Total rows, shared by the proforma editor's
 * "Total due" rail card (live) and the detail/summary views (saved). Pass
 * `accent` for the dark accent card (white-on-ink).
 */
export function ProformaTotalsRows({
  totals,
  currency,
  accent,
}: {
  totals: DocTotals;
  currency: string;
  accent?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Row
        label="Subtotal"
        value={money(totals.subtotalAmount, currency)}
        accent={accent}
      />
      {totals.discountAmount > 0 && (
        <Row
          label="Discount"
          value={`−${money(totals.discountAmount, currency)}`}
          accent={accent}
        />
      )}
      <Row label="Tax" value={money(totals.taxAmount, currency)} accent={accent} />
      <div
        className={cn(
          "mt-1 flex items-baseline justify-between border-t pt-2.5",
          accent ? "border-white/15" : "border-line",
        )}
      >
        <span
          className={cn(
            "text-[15px] font-semibold",
            accent ? "text-white" : "text-ink",
          )}
        >
          Total
        </span>
        <span
          className={cn(
            "font-mono text-lg font-semibold tabular-nums",
            accent ? "text-white" : "text-ink",
          )}
        >
          {money(totals.totalAmount, currency)}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className={accent ? "text-white/60" : "text-ink-3"}>{label}</span>
      <span
        className={cn(
          "font-mono tabular-nums",
          accent ? "text-white/90" : "text-ink-2",
        )}
      >
        {value}
      </span>
    </div>
  );
}

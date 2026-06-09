import { cn } from "@/lib/utils";
import { fmtAmount, type CashflowMethodRow } from "@/types/reports/cashflow";

// Inline color tokens — `hsl(var(--…))` is used for the bar fills so we
// don't depend on `bg-pos` / `bg-warn` utilities existing (only the tint
// variants do). Matches how the KPI sparkline references the tokens.
const POS = "hsl(var(--pos))";
const NEG = "hsl(var(--neg))";
const WARN = "hsl(var(--warn))";

// ─── Cash flow summary ──────────────────────────────────────────────
// A mini cash-flow statement: how inflow nets down through expenses and
// refunds to the closing balance, with a 100%-stacked composition bar
// showing what share of inflow was retained vs spent. All real data.

function StatementRow({
  label,
  value,
  currency,
  sign,
  tone,
  strong,
}: {
  label: string;
  value: number;
  currency: string;
  sign: "+" | "−" | "=";
  tone: "pos" | "neg" | "ink";
  strong?: boolean;
}) {
  const toneClass =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={cn(
          "text-[13px]",
          strong ? "font-semibold text-ink" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          strong ? "text-[15px] font-semibold" : "text-[13px]",
          toneClass,
        )}
      >
        <span className="mr-1 text-muted-2">{sign}</span>
        {fmtAmount(Math.abs(value))}
        <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
          {currency}
        </span>
      </span>
    </div>
  );
}

export function CashflowSummaryPanel({
  cashIn,
  expenses,
  refunds,
  closing,
  currency,
}: {
  cashIn: number;
  expenses: number;
  refunds: number;
  closing: number;
  currency: string;
}) {
  const cashOut = expenses + refunds;
  const retained = Math.max(0, cashIn - cashOut);
  const base = cashIn > 0 ? cashIn : 1;
  const segments = [
    { key: "retained", label: "Retained", value: retained, color: POS },
    { key: "expenses", label: "Expenses", value: expenses, color: NEG },
    { key: "refunds", label: "Refunds", value: refunds, color: WARN },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        <StatementRow label="Cash in" value={cashIn} currency={currency} sign="+" tone="pos" />
        <StatementRow label="Expenses" value={expenses} currency={currency} sign="−" tone="neg" />
        <StatementRow label="Refunds" value={refunds} currency={currency} sign="−" tone="neg" />
        <div className="border-t border-dashed border-line" />
        <StatementRow
          label="Closing balance"
          value={closing}
          currency={currency}
          sign={closing < 0 ? "−" : "="}
          tone={closing < 0 ? "neg" : "ink"}
          strong
        />
      </div>

      {cashIn > 0 && segments.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
            {segments.map((s) => (
              <div
                key={s.key}
                style={{ width: `${(s.value / base) * 100}%`, background: s.color }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
            {segments.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
                <span className="tabular-nums text-muted-2">
                  {Math.round((s.value / base) * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cash in by payment method ──────────────────────────────────────
// Ranked share-bar list — the granular real detail that replaces the
// old plain payment-method table. Bars scale to the largest tender so
// dominance reads at a glance; the right-rail % is share of total inflow.

export function CashflowMethodBreakdown({
  rows,
  currency,
}: {
  rows: CashflowMethodRow[];
  currency: string;
}) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No payment-method data for this period.
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.amount), 1);

  return (
    <ul className="divide-y divide-line">
      {rows.map((row, i) => (
        <li
          key={`${row.name}-${i}`}
          className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
        >
          <span className="w-5 shrink-0 font-mono text-[12px] tabular-nums text-muted-2">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px] font-medium text-ink">
                  {row.name}
                </span>
                {row.count != null && row.count > 0 && (
                  <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-2">
                    {row.count.toLocaleString()} txn{row.count === 1 ? "" : "s"}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-[12.5px] tabular-nums text-ink">
                {fmtAmount(row.amount)}
                <span className="ml-1 text-[10.5px] font-normal text-muted-foreground">
                  {currency}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(2, (row.amount / max) * 100)}%`,
                    background: POS,
                  }}
                />
              </div>
              <span className="w-11 shrink-0 text-right font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {row.share.toFixed(1)}%
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

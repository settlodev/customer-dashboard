import React from "react";
import { Package, Receipt, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type OverviewResponse from "@/types/dashboard/type";

/**
 * The money row — three headline financial cards at the top of the dashboard,
 * styled to the "Settlo Home Dashboard" mock's `.money` treatment:
 *  - Closing balance — a dark-teal card with an orange `TZS` and a corner
 *    sparkline. `closingBalance` is a reconciled cash/till position
 *    (collections − refunds − expenses paid), NOT net profit — the true net
 *    profit lives in the SalesKpiStrip. See "dashboard-hero-cards-and-net-profit".
 *  - Cost of goods sold — `totalCost`, with a "% of net sales · gross margin"
 *    sub-line derived from `netSales` / `grossProfit`.
 *  - Expenses — `totalExpenseAmount`, with a paid/unpaid split bar.
 *
 * Values come from the Reports overview response, so they react to the date
 * picker. Two of the mock's flourishes aren't in the API yet — the closing-
 * balance sparkline and its "vs prior day" delta are static PLACEHOLDERS
 * (marked below) so the row still matches the design; wire them once the
 * overview exposes a daily trend / prior-period comparison.
 */

const fmt = (value: number | undefined | null): string =>
  value == null ? "0" : Math.round(value).toLocaleString();

// Whole-percent of part/total, guarding divide-by-zero. Returns null so callers
// can render a placeholder dash rather than "NaN%" / a misleading "0%".
const pct = (part?: number | null, total?: number | null): number | null =>
  total && total > 0 ? Math.round(((part ?? 0) / total) * 100) : null;

const shortDate = (iso?: string | null): string =>
  iso
    ? new Intl.DateTimeFormat("en", { month: "short", day: "2-digit" }).format(
        new Date(iso),
      )
    : "—";

// PLACEHOLDER — the overview carries no prior-period comparison yet. Held as a
// constant so it's obvious this isn't live data; replace when the API lands.
const PRIOR_DAY_DELTA = "▲ 9.2% vs prior day";

// PLACEHOLDER — decorative trend line for the closing-balance card until the
// overview returns a real daily series.
const SPARK_PATH = "M0,22 L10.5,20 L21,21 L31.5,15 L42,17 L52.5,9 L63,11 L74,4";

const LABEL_CLASS =
  "flex items-center gap-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em]";
const VALUE_CLASS =
  "mt-3 flex items-baseline gap-1.5 text-[30px] font-bold tracking-[-0.03em]";
const UNIT_CLASS = "font-mono text-[14px] font-bold text-muted-foreground";
const SUB_CLASS = "mt-2.5 font-mono text-[11.5px]";

export function DashboardHeroCards({
  overview,
  loading,
  error,
  onRetry,
}: {
  overview: OverviewResponse | null;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  if (loading && !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[118px] rounded-xl" />
        ))}
      </div>
    );
  }

  // A failed overview fetch is caught to `null` upstream so the rest of the
  // page survives — but here that must read as "couldn't load", NOT as a real
  // zero. Only when there's no data at all: during a realtime refresh we keep
  // the last-good figures on screen rather than flipping to this state.
  if (error && !overview) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-card px-5 py-[18px] md:col-span-3">
          <div className={LABEL_CLASS + " text-warn"}>
            <Receipt className="h-3.5 w-3.5 opacity-80" strokeWidth={1.6} />
            Figures unavailable
          </div>
          <p className="mt-2.5 max-w-prose font-mono text-[11.5px] leading-relaxed text-muted-foreground">
            Couldn&apos;t load your closing balance, cost of goods and expenses
            just now — this is a temporary connection problem, not a zero. Your
            data is safe.
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-line px-3 py-1.5 font-mono text-[11px] font-semibold text-ink hover:bg-muted"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const cogsPct = pct(overview?.totalCost, overview?.netSales);
  const marginPct = pct(overview?.grossProfit, overview?.netSales);
  const paidPct =
    pct(overview?.expensesPaidAmount, overview?.totalExpenseAmount) ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Closing balance — dark-teal hero card */}
      <div
        className="relative overflow-hidden rounded-xl border border-[#0C2523] px-5 py-[18px] text-white"
        style={{
          background:
            "radial-gradient(120% 140% at 80% 10%, #173B39, #0C2523)",
        }}
      >
        {/* Soft orange glow (mock's .money.dark::after) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 80% at 90% 0%, rgba(235,127,68,0.14), transparent 60%)",
          }}
        />
        <div className="relative z-[1]">
          <div className={LABEL_CLASS + " text-[#7FA8A0]"}>
            <Wallet className="h-3.5 w-3.5 opacity-80" strokeWidth={1.6} />
            Closing balance
          </div>
          <div className={VALUE_CLASS}>
            <span className="font-mono text-[14px] font-bold text-primary">
              TZS
            </span>
            {fmt(overview?.closingBalance)}
          </div>
          <div className={SUB_CLASS + " text-[#8FB3AB]"}>
            Reconciled {shortDate(overview?.endDate)} ·{" "}
            <span className="text-[#7FE0B8]">{PRIOR_DAY_DELTA}</span>
          </div>
        </div>
        <svg
          className="absolute bottom-4 right-4 h-[26px] w-[74px]"
          viewBox="0 0 74 26"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={SPARK_PATH} stroke="#EB7F44" strokeWidth="1.6" fill="none" />
        </svg>
      </div>

      {/* Cost of goods sold */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-card px-5 py-[18px]">
        <div className={LABEL_CLASS + " text-muted-foreground"}>
          <Package className="h-3.5 w-3.5 opacity-80" strokeWidth={1.6} />
          Cost of goods sold
        </div>
        <div className={VALUE_CLASS + " text-ink"}>
          <span className={UNIT_CLASS}>TZS</span>
          {fmt(overview?.totalCost)}
        </div>
        <div className={SUB_CLASS + " text-muted-foreground"}>
          {cogsPct != null ? `${cogsPct}% of net sales` : "— of net sales"} ·{" "}
          <span className="text-pos">
            {marginPct != null ? `${marginPct}% gross margin` : "— gross margin"}
          </span>
        </div>
      </div>

      {/* Expenses */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-card px-5 py-[18px]">
        <div className={LABEL_CLASS + " text-muted-foreground"}>
          <Receipt className="h-3.5 w-3.5 opacity-80" strokeWidth={1.6} />
          Expenses
        </div>
        <div className={VALUE_CLASS + " text-ink"}>
          <span className={UNIT_CLASS}>TZS</span>
          {fmt(overview?.totalExpenseAmount)}
        </div>
        <div
          className="mt-3 flex h-[7px] overflow-hidden rounded-full bg-warn-tint"
          title="Paid vs unpaid"
        >
          <div className="h-full bg-pos" style={{ width: `${paidPct}%` }} />
        </div>
        <div className={SUB_CLASS + " text-muted-foreground"}>
          <span className="text-pos">Paid {fmt(overview?.expensesPaidAmount)}</span>{" "}
          · <span className="text-warn">Unpaid {fmt(overview?.totalExpenseUnpaid)}</span>
        </div>
      </div>
    </div>
  );
}

export default DashboardHeroCards;

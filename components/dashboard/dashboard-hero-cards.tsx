import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type OverviewResponse from "@/types/dashboard/type";

/**
 * The three large headline cards at the top of the dashboard, kept in
 * their original "big card" visual language (hero card with the
 * background image + two text-4xl cards) at the user's request rather
 * than being folded into the hairline KpiStrip.
 *
 * - Closing balance — `closingBalance` (collections − refunds − expenses
 *   paid). This used to be mislabeled "Net Profit/Net Loss"; it's a cash
 *   position, so the real net profit now lives in the SalesKpiStrip.
 * - Cost of goods sold — `totalCost`.
 * - Expenses — `totalExpenseAmount`, with paid / unpaid sub-lines.
 *
 * Values come from the same Reports Service overview response that feeds
 * the rest of the sales surface, so they react to the date-range picker.
 */

const formatAmount = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return "0";
  return value.toLocaleString();
};

const CurrencyValue = ({
  value,
  className,
}: {
  value: number | undefined | null;
  className?: string;
}) => (
  <span className={className}>
    {formatAmount(value)}{" "}
    <span className="text-[0.6em] font-normal opacity-70">TZS</span>
  </span>
);

export function DashboardHeroCards({
  overview,
  loading,
}: {
  overview: OverviewResponse | null;
  loading?: boolean;
}) {
  if (loading && !overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Closing balance hero */}
      <div
        className="relative rounded-xl overflow-hidden shadow-none"
        style={{
          backgroundImage: "url('/images/bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-white/80">
            Closing Balance
          </p>
          <p className="text-4xl font-extrabold mt-2 text-primary">
            <CurrencyValue value={overview?.closingBalance} />
          </p>
        </div>
      </div>

      {/* Cost of goods sold */}
      <Card className="rounded-xl shadow-none">
        <CardContent className="p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Cost of Goods Sold
          </p>
          <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
            <CurrencyValue value={overview?.totalCost} />
          </p>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card className="rounded-xl shadow-none">
        <CardContent className="p-6">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Expenses
          </p>
          <p className="text-4xl font-extrabold mt-2 text-gray-900 dark:text-gray-100">
            <CurrencyValue value={overview?.totalExpenseAmount} />
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs">
            <span className="text-emerald-600 font-medium">
              Paid: {formatAmount(overview?.expensesPaidAmount)} TZS
            </span>
            <span className="text-amber-600 font-medium">
              Unpaid: {formatAmount(overview?.totalExpenseUnpaid)} TZS
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardHeroCards;

import React from "react";
import { cn } from "@/lib/utils";

/**
 * MetricCell / MetricGrid — the small cream-surface metric tiles used in the
 * business-detail "Revenue & orders", "Inventory on hand" and "Financials"
 * cards. Smaller and denser than the headline <MetricCard>: a mono label, a
 * tabular value (with optional currency prefix) and a mono sub-line.
 */

const COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function MetricGrid({
  cols = 4,
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2.5", COLS[cols], className)}>{children}</div>
  );
}

interface MetricCellProps {
  label: string;
  /** Pre-formatted value (e.g. "243.9M", "0", "Today"). */
  value: React.ReactNode;
  /** Small currency prefix before the value (e.g. "TZS"). */
  currency?: string;
  sub?: React.ReactNode;
  subTone?: "muted" | "pos";
  /** Smaller value type for text/short values. */
  small?: boolean;
}

export function MetricCell({
  label,
  value,
  currency,
  sub,
  subTone = "muted",
  small,
}: MetricCellProps) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 flex items-baseline gap-1 font-bold leading-none tracking-[-0.02em] text-ink tabular-nums",
          small ? "text-[16px]" : "text-[20px]",
        )}
      >
        {currency && (
          <span className="text-[10px] font-semibold text-ink-3">{currency}</span>
        )}
        <span>{value}</span>
      </div>
      {sub != null && (
        <div
          className={cn(
            "mt-1.5 font-mono text-[10.5px]",
            subTone === "pos" ? "text-pos" : "text-muted-foreground",
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

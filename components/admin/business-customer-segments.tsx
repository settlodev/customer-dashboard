import { AlertTriangle, Users } from "lucide-react";

import { BusinessCustomerSegmentRow } from "@/types/admin/business-intel";

interface BusinessCustomerSegmentsProps {
  segments: BusinessCustomerSegmentRow[];
  currency: string;
  error: string | null;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toLocaleString();
}

function segmentColor(segment: string): string {
  const upper = segment.toUpperCase();
  if (upper.includes("CHAMPION") || upper.includes("LOYAL"))
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20";
  if (upper.includes("PROMISING") || upper.includes("POTENTIAL"))
    return "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20";
  if (upper.includes("AT_RISK") || upper.includes("ATTENTION"))
    return "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";
  if (
    upper.includes("LOST") ||
    upper.includes("CANT_LOSE") ||
    upper.includes("HIBERNATING")
  )
    return "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20";
  return "border-muted bg-muted text-muted-foreground";
}

export function BusinessCustomerSegments({
  segments,
  currency,
  error,
}: BusinessCustomerSegmentsProps) {
  const sorted = segments
    .slice()
    .sort(
      (a, b) =>
        (b.segment_revenue ?? 0) - (a.segment_revenue ?? 0),
    );

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
        <Users className="h-4 w-4 text-primary" />
        Customer segments (RFM)
      </h3>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : sorted.length === 0 ? (
        <p className="rounded-md border border-dashed border-line p-4 text-center text-sm text-muted-foreground">
          No customer segmentation data yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((s) => (
            <li
              key={s.rfm_segment}
              className="flex items-center justify-between gap-3 rounded-md border border-line/60 bg-canvas/40 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px]">
                  <span
                    className={
                      "rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] " +
                      segmentColor(s.rfm_segment)
                    }
                  >
                    {s.rfm_segment}
                  </span>
                  <span className="tabular-nums text-ink">
                    {formatNumber(s.customer_count)} customers
                  </span>
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Avg spend {formatMoney(s.avg_spend)} {currency} · avg{" "}
                  {formatNumber(s.avg_orders)} orders ·{" "}
                  {formatNumber(s.avg_days_since_last_order)}d since last
                </p>
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="text-[13px] font-medium tabular-nums text-ink">
                  {formatMoney(s.segment_revenue)} {currency}
                </span>
                {(s.at_risk_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1 font-mono text-[10.5px] text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    {formatNumber(s.at_risk_count)} at risk
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";

import { RecomputeButton } from "@/components/admin/analytics/recompute-button";
import { recomputeRetention } from "@/lib/actions/admin/analytics";
import { RetentionCohortCell } from "@/types/admin/analytics";

interface RetentionSectionProps {
  cohorts: RetentionCohortCell[];
  canRecompute: boolean;
  error: string | null;
}

function formatCohortMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function cellBackground(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || Number.isNaN(rate)) {
    return "bg-muted/40 text-muted-foreground";
  }
  // Rate is 0..1 from backend (Float64). Map to 5 tiers.
  if (rate >= 0.7) return "bg-emerald-500/30 text-emerald-900 dark:text-emerald-100";
  if (rate >= 0.5) return "bg-emerald-400/25 text-emerald-900 dark:text-emerald-200";
  if (rate >= 0.3) return "bg-emerald-300/25 text-ink";
  if (rate >= 0.15) return "bg-amber-200/30 text-ink";
  if (rate > 0) return "bg-rose-200/30 text-ink";
  return "bg-muted/40 text-muted-foreground";
}

interface PivotRow {
  cohortMonth: string;
  cohortSize: number;
  cells: Record<number, RetentionCohortCell>;
}

export function RetentionSection({
  cohorts,
  canRecompute,
  error,
}: RetentionSectionProps) {
  const { rows, maxPeriod } = useMemo(() => {
    const map = new Map<string, PivotRow>();
    let max = 0;
    for (const c of cohorts) {
      const row = map.get(c.cohort_month) ?? {
        cohortMonth: c.cohort_month,
        cohortSize: c.cohort_size,
        cells: {},
      };
      row.cells[c.months_since_signup] = c;
      row.cohortSize = c.cohort_size;
      map.set(c.cohort_month, row);
      if (c.months_since_signup > max) max = c.months_since_signup;
    }
    const sorted = Array.from(map.values()).sort((a, b) =>
      b.cohortMonth.localeCompare(a.cohortMonth),
    );
    return { rows: sorted, maxPeriod: max };
  }, [cohorts]);

  if (error && rows.length === 0) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No retention cohort data available yet.
        </p>
      </div>
    );
  }

  const periods = Array.from({ length: maxPeriod + 1 }, (_, i) => i);

  return (
    <div className="space-y-4">
      {canRecompute && (
        <div className="flex justify-end">
          <RecomputeButton
            label="Retention cohorts"
            description="Re-runs the nightly retention cohort aggregation. The job runs asynchronously; data refreshes once it finishes."
            action={recomputeRetention}
          />
        </div>
      )}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            Retention cohorts
          </h3>
          <p className="font-mono text-[11px] text-muted-foreground">
            Active businesses per cohort, by months since signup
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="sticky left-0 z-10 bg-card px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Cohort
                </th>
                <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Size
                </th>
                {periods.map((p) => (
                  <th
                    key={p}
                    className="px-2 py-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground"
                  >
                    M{p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.cohortMonth} className="border-b border-line/60 last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-3 py-2 font-mono text-muted-foreground">
                    {formatCohortMonth(row.cohortMonth)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground tabular-nums">
                    {row.cohortSize.toLocaleString()}
                  </td>
                  {periods.map((p) => {
                    const cell = row.cells[p];
                    if (!cell) {
                      return (
                        <td
                          key={p}
                          className="px-2 py-2 text-center text-muted-foreground"
                        >
                          —
                        </td>
                      );
                    }
                    const pct = (cell.retention_rate * 100).toFixed(0);
                    return (
                      <td
                        key={p}
                        className={
                          "px-2 py-2 text-center tabular-nums " +
                          cellBackground(cell.retention_rate)
                        }
                        title={`${cell.active_businesses}/${cell.cohort_size} active · ${cell.orders_in_period.toLocaleString()} orders · ARPA ${Math.round(cell.arpa_in_period).toLocaleString()}`}
                      >
                        <div className="leading-tight">
                          <div className="font-medium">{pct}%</div>
                          <div className="text-[10px] opacity-70">
                            {cell.active_businesses}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Calendar, Users } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { RecomputeButton } from "@/components/admin/analytics/recompute-button";
import {
  recomputeActivation,
  recomputeTrial,
} from "@/lib/actions/admin/analytics";
import {
  ActivationCohort,
  EngagementSnapshot,
  TrialConversionRow,
} from "@/types/admin/analytics";

interface EngagementSectionProps {
  series: EngagementSnapshot[];
  latest: EngagementSnapshot | null;
  activationCohorts: ActivationCohort[];
  trialConversion: TrialConversionRow[];
  canRecompute: boolean;
  error: string | null;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCohortMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(0)}%`;
}

function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

export function EngagementSection({
  series,
  latest,
  activationCohorts,
  trialConversion,
  canRecompute,
  error,
}: EngagementSectionProps) {
  const chartRows = useMemo(
    () =>
      series
        .slice()
        .sort((a, b) => a.metric_date.localeCompare(b.metric_date))
        .map((s) => ({
          date: s.metric_date,
          label: formatShortDate(s.metric_date),
          dau: s.dau ?? null,
          wau: s.wau ?? null,
          mau: s.mau ?? null,
        })),
    [series],
  );

  const recentCohorts = useMemo(
    () =>
      activationCohorts
        .slice()
        .sort((a, b) => b.cohort_month.localeCompare(a.cohort_month))
        .slice(0, 12),
    [activationCohorts],
  );

  const recentTrial = useMemo(
    () =>
      trialConversion
        .slice()
        .sort((a, b) => b.cohort_month.localeCompare(a.cohort_month))
        .slice(0, 10),
    [trialConversion],
  );

  if (error && chartRows.length === 0 && recentCohorts.length === 0) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {canRecompute && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RecomputeButton
            label="Activation funnel"
            description="Re-runs the signup cohort activation aggregation. The job runs asynchronously; data refreshes once it finishes."
            action={recomputeActivation}
          />
          <RecomputeButton
            label="Trial conversion"
            description="Re-runs the monthly trial-to-paid conversion aggregation. The job runs asynchronously; data refreshes once it finishes."
            action={recomputeTrial}
          />
        </div>
      )}
      {latest && (
        <KpiStrip cols={3}>
          <KpiCard
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Daily active"
            value={num(latest.dau)}
          />
          <KpiCard
            icon={<Users className="h-3.5 w-3.5" />}
            label="Weekly active"
            value={num(latest.wau)}
          />
          <KpiCard
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Monthly active"
            value={num(latest.mau)}
          />
        </KpiStrip>
      )}

      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink">
          Active businesses
        </h3>
        {chartRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No engagement data available for this range.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartRows}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--line))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickMargin={6}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--line))",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="dau"
                  name="DAU"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="wau"
                  name="WAU"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="mau"
                  name="MAU"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink">
          Activation funnel by signup cohort
        </h3>
        {recentCohorts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activation cohort data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Cohort
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Size
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Verified
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Business
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Location
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Product
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    First order
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Paid order
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCohorts.map((c) => (
                  <tr
                    key={c.cohort_month}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {formatCohortMonth(c.cohort_month)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {c.cohort_size.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_email_verified)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_business)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_location)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_product)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_first_order)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_paid_order)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {pct(c.pct_reached_subscription)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink">
          Trial conversion
        </h3>
        {recentTrial.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No trial conversion data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Cohort
                  </th>
                  <th className="px-3 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Package
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Started
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Converted
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Rate
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Median days
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTrial.map((t) => (
                  <tr
                    key={`${t.cohort_month}-${t.package_id ?? t.package_name ?? "all"}`}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {formatCohortMonth(t.cohort_month)}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {t.package_name ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {t.trials_started.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-pos">
                      {t.trials_converted.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {pct(t.conversion_rate)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {t.median_days_to_convert !== null
                        ? t.median_days_to_convert.toFixed(1)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Math.round(t.revenue_from_cohort).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

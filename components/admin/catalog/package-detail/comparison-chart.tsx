"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";
import { PackageTimeSeriesPoint } from "@/types/admin/billing";

interface ComparisonChartProps {
  title: string;
  hint: string;
  primary: PackageTimeSeriesPoint[];
  comparison?: PackageTimeSeriesPoint[] | null;
  /** Header label for the summary figure (defaults to "Total"). */
  summaryLabel?: string;
  /**
   * How the header summary is derived from the series:
   *  - "total" (default): sum of every point — for flows like revenue.
   *  - "average": mean per point (rendered with an "avg" suffix) — for
   *    snapshot metrics like active subscribers, where summing daily counts
   *    is meaningless.
   * Serializable stand-in for the old `formatSummary` function prop: a
   * Server Component can't pass a function across the client boundary.
   */
  summaryStat?: "total" | "average";
  /** Stub badge shown in the header when the series is placeholder data. */
  isLive: boolean;
  /** "area" gives the metric a soft fill (revenue); "line" keeps a clean stroke (subscribers). */
  variant?: "area" | "line";
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatValue(value: number): string {
  return Math.round(value).toLocaleString();
}

function defaultTickFormatter(value: number): string {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : String(value);
}

/**
 * Aligns the primary and comparison series onto a single x-axis by
 * "day index" (0..N). Each row carries both actual dates so the
 * tooltip can show the user which calendar day each line corresponds
 * to — a comparison of last June vs this May without that mapping is
 * hard to read.
 */
function alignSeries(
  primary: PackageTimeSeriesPoint[],
  comparison: PackageTimeSeriesPoint[] | null | undefined,
) {
  const length = Math.max(
    primary.length,
    comparison ? comparison.length : 0,
  );
  const out: {
    idx: number;
    label: string;
    primaryDate: string | null;
    primaryValue: number | null;
    comparisonDate: string | null;
    comparisonValue: number | null;
  }[] = [];
  for (let i = 0; i < length; i++) {
    const p = primary[i] ?? null;
    const c = (comparison ?? [])[i] ?? null;
    out.push({
      idx: i,
      label: p ? formatShortDate(p.date) : formatShortDate(c?.date ?? ""),
      primaryDate: p?.date ?? null,
      primaryValue: p?.value ?? null,
      comparisonDate: c?.date ?? null,
      comparisonValue: c?.value ?? null,
    });
  }
  return out;
}

export function ComparisonChart({
  title,
  hint,
  primary,
  comparison,
  summaryLabel,
  summaryStat = "total",
  isLive,
  variant = "area",
}: ComparisonChartProps) {
  const data = alignSeries(primary, comparison);
  const primaryTotal = primary.reduce((s, p) => s + p.value, 0);
  const comparisonTotal = comparison
    ? comparison.reduce((s, p) => s + p.value, 0)
    : null;
  // "average" metrics (e.g. active-subscriber snapshots) read as a per-day
  // mean — summing daily counts would be meaningless; "total" metrics
  // (e.g. revenue) keep the period sum.
  const primarySummary =
    summaryStat === "average"
      ? primaryTotal / Math.max(1, primary.length)
      : primaryTotal;
  const comparisonSummary =
    comparisonTotal === null
      ? null
      : summaryStat === "average"
        ? comparisonTotal / Math.max(1, comparison?.length ?? 1)
        : comparisonTotal;
  const summarySuffix = summaryStat === "average" ? " avg" : "";
  const delta =
    comparisonSummary !== null && comparisonSummary > 0
      ? ((primarySummary - comparisonSummary) / comparisonSummary) * 100
      : null;
  const deltaTone =
    delta == null ? "text-muted-foreground" : delta >= 0 ? "text-pos" : "text-neg";
  const gradientId = `pkg-cmp-${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <p className="font-mono text-[11.5px] text-muted-foreground">
            {hint}
          </p>
        </div>
        <div className="text-right">
          {!isLive && <StubBadge />}
          <p className="mt-1 font-mono text-[12px] text-ink tabular-nums">
            {summaryLabel ?? "Total"}: {formatValue(primarySummary)}{summarySuffix}
          </p>
          {comparisonSummary !== null && (
            <p className="font-mono text-[10.5px] text-muted-foreground tabular-nums">
              vs {formatValue(comparisonSummary)}{summarySuffix}
              {delta !== null && (
                <span className={`ml-1 ${deltaTone}`}>
                  ({delta >= 0 ? "+" : ""}
                  {delta.toFixed(1)}%)
                </span>
              )}
            </p>
          )}
        </div>
      </header>

      <div className="h-[240px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={variant === "area" ? 0.35 : 0.18}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 4"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={32}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={defaultTickFormatter}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))" }}
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => formatValue(Number(value))}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload;
                if (!row) return "";
                const lines: string[] = [];
                if (row.primaryDate) {
                  lines.push(`Current · ${formatShortDate(row.primaryDate)}`);
                }
                if (row.comparisonDate) {
                  lines.push(
                    `Compare · ${formatShortDate(row.comparisonDate)}`,
                  );
                }
                return lines.join(" · ");
              }}
            />
            {comparison && (
              <Line
                dataKey="comparisonValue"
                type="monotone"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeWidth={1.25}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {variant === "area" ? (
              <Area
                dataKey="primaryValue"
                type="monotone"
                stroke="hsl(var(--primary))"
                strokeWidth={1.6}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            ) : (
              <Line
                dataKey="primaryValue"
                type="monotone"
                stroke="hsl(var(--primary))"
                strokeWidth={1.75}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

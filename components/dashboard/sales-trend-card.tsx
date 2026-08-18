"use client";

import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type OverviewResponse from "@/types/dashboard/type";

/**
 * Net sales trend panel — left half of the "trend + payment mix" row. The
 * headline figure is REAL (selected-range `netSales`); the recharts area chart,
 * its x-axis dates, and the "vs prior week" delta are static PLACEHOLDERS
 * because the overview returns a single aggregate, not a daily series. The
 * chart deliberately hides the y-axis and has no tooltip, so no fabricated
 * per-day values are surfaced — only the shape. Swap `PLACEHOLDER_SERIES` for a
 * real timeseries when an analytics endpoint exists.
 */

const fmt = (n: number | undefined | null) =>
  n == null ? "0" : Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

// PLACEHOLDER — no prior-period comparison in the overview yet.
const TREND_DELTA = "▲ 12.4% vs prior week";

// PLACEHOLDER — illustrative 14-day shape (mirrors the mock). Values are
// unitless and intentionally unlabelled (y-axis hidden, no tooltip).
const PLACEHOLDER_SERIES = [
  { d: "Jun 26", v: 20 },
  { d: "Jun 27", v: 43 },
  { d: "Jun 28", v: 26 },
  { d: "Jun 29", v: 76 },
  { d: "Jun 30", v: 59 },
  { d: "Jul 01", v: 108 },
  { d: "Jul 02", v: 92 },
  { d: "Jul 03", v: 76 },
  { d: "Jul 04", v: 124 },
  { d: "Jul 05", v: 108 },
  { d: "Jul 06", v: 157 },
  { d: "Jul 07", v: 141 },
  { d: "Jul 08", v: 174 },
  { d: "Jul 09", v: 190 },
];

export function SalesTrendCard({
  overview,
  loading,
}: {
  overview: OverviewResponse | null;
  loading?: boolean;
}) {
  return (
    <Card className="flex h-full min-w-0 flex-col p-5 shadow-none">
      {/* head */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Net sales trend
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.03em] text-muted-foreground">
          Last 14 days
        </span>
      </div>

      {loading && !overview ? (
        <Skeleton className="min-h-[240px] flex-1 rounded-lg" />
      ) : (
        <>
          {/* figures — real net sales + placeholder delta */}
          <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
            <div className="text-[26px] font-bold tracking-[-0.03em] text-ink">
              <span className="mr-1 font-mono text-[13px] font-semibold text-muted-foreground">
                TZS
              </span>
              {fmt(overview?.netSales)}
            </div>
            <div className="font-mono text-[12px] font-semibold text-pos">
              {TREND_DELTA}
            </div>
          </div>

          {/* chart (placeholder series) — grows to match the paired card */}
          <div className="mt-3 min-h-[190px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PLACEHOLDER_SERIES}
                margin={{ top: 6, right: 4, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EB7F44" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#EB7F44" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="hsl(var(--line))"
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="d"
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-2))",
                    fontFamily: "var(--font-mono)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis hide domain={[0, "dataMax + 20"]} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="#EB7F44"
                  strokeWidth={2.2}
                  fill="url(#salesTrendFill)"
                  dot={false}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}

export default SalesTrendCard;

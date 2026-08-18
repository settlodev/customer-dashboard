"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CashflowTrendPoint } from "@/types/reports/cashflow";

/**
 * Cash-flow-over-time chart — the classic two-direction view: money in
 * rises above the zero line (green bars), money out falls below it (red
 * bars), and the net movement rides over the top as a line. Styled to
 * match `AreaTrendChart` (dashed horizontal grid, hairline axes, card
 * tooltip) so it sits natively beside the other dashboard charts.
 */

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

interface Props {
  data: CashflowTrendPoint[];
  currency: string;
  height?: number;
}

export function CashflowTrendChart({ data, currency, height = 260 }: Props) {
  // Plot outflow as a negative magnitude so it renders below zero.
  const series = data.map((d) => ({ ...d, out: -Math.abs(d.cashOut) }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <ComposedChart
          data={series}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 4"
            stroke="hsl(var(--line))"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={20}
            tick={{ fontSize: 10.5, fill: "hsl(var(--muted-2))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={compact}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-2))" }}
          />
          <ReferenceLine y={0} stroke="hsl(var(--line-2))" />
          <Tooltip
            cursor={{ fill: "hsl(var(--canvas))", opacity: 0.5 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--line))",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.18)",
            }}
            labelStyle={{ color: "hsl(var(--ink-3))", fontSize: 11 }}
            formatter={(value, name) => [
              `${Number(value) < 0 ? "−" : ""}${compact(Math.abs(Number(value)))} ${currency}`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="circle" iconSize={8} />
          <Bar
            name="Cash in"
            dataKey="cashIn"
            fill="hsl(var(--pos))"
            radius={2}
            maxBarSize={26}
          />
          <Bar
            name="Cash out"
            dataKey="out"
            fill="hsl(var(--neg))"
            radius={2}
            maxBarSize={26}
          />
          <Line
            name="Net"
            type="monotone"
            dataKey="net"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

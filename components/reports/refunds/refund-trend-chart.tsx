"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RefundChartPoint } from "@/types/reports/refunds";

/**
 * Refunds over time — value refunded per business day as bars, with the
 * refund count riding over the top on its own right-hand axis. Two axes
 * because the pair answers different questions: a single large refund and a
 * flurry of small ones look identical on value alone.
 *
 * <p>Styled to match `CashflowTrendChart` (dashed horizontal grid, hairline
 * axes, card tooltip) so the reports read as one family.
 */

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

interface Props {
  data: RefundChartPoint[];
  currency: string;
  height?: number;
}

export function RefundTrendChart({ data, currency, height = 260 }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <ComposedChart
          data={data}
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
            yAxisId="amount"
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={compact}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-2))" }}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-2))" }}
          />
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
            // recharts v3 hands the formatter a ValueType, not a number.
            formatter={(value, name) =>
              name === "Refunds"
                ? [Number(value).toLocaleString(), name]
                : [`${compact(Number(value))} ${currency}`, name]
            }
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="amount"
            name="Refunded"
            dataKey="amount"
            fill="hsl(var(--neg))"
            radius={2}
            maxBarSize={26}
          />
          <Line
            yAxisId="count"
            name="Refunds"
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

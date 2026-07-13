"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * AreaTrendChart — brand-orange area chart for the admin screens, styled to
 * match the rest of the dashboard (dashed horizontal grid, hairline axes,
 * mono-ish tooltip). Pure presentational client wrapper around recharts.
 */

export interface TrendPoint {
  label: string;
  value: number;
}

interface AreaTrendChartProps {
  data: TrendPoint[];
  /** Unique gradient id so multiple charts on a page don't collide. */
  gradientId?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
  tooltipLabel?: string;
}

function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

export function AreaTrendChart({
  data,
  gradientId = "admin-area",
  height = 200,
  valueFormatter = defaultFormat,
  tooltipLabel = "Value",
}: AreaTrendChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 4"
            stroke="hsl(var(--line))"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tick={{ fontSize: 10.5, fill: "hsl(var(--muted-2))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={valueFormatter}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-2))" }}
          />
          <Tooltip
            cursor={{ stroke: "hsl(var(--line-2))" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--line))",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.18)",
            }}
            labelStyle={{ color: "hsl(var(--ink-3))", fontSize: 11 }}
            formatter={(value) => [valueFormatter(Number(value)), tooltipLabel]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

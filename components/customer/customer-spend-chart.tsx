"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CustomerMonthPoint } from "@/types/customer/type";

// Single-series monthly bars on the brand hue the dashboard's sales trend
// already uses (fixed in both themes). One measure per chart — orders and
// gross profit ride in the tooltip rather than on a second axis.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

/** "2026-03" → "Mar", with the year appended on January and on the first tick. */
const tickLabel = (month: string, first: boolean) => {
  const [y, m] = month.split("-");
  const idx = Number(m) - 1;
  const name = MONTHS[idx] ?? month;
  return idx === 0 || first ? `${name} ’${y.slice(2)}` : name;
};

const longLabel = (month: string) => {
  const [y, m] = month.split("-");
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
};

type Point = CustomerMonthPoint & { label: string };

function SpendTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-[12px] shadow-md">
      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {longLabel(p.month)}
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-muted-foreground">Net spend</span>
        <span className="font-semibold tabular-nums text-ink">
          {fmt(p.net)} <span className="font-mono text-[10.5px] text-muted-foreground">{currency}</span>
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-muted-foreground">Orders</span>
        <span className="font-semibold tabular-nums text-ink">{p.orders}</span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-muted-foreground">Gross profit</span>
        <span className="font-semibold tabular-nums text-ink">{fmt(p.grossProfit)}</span>
      </div>
    </div>
  );
}

export function CustomerSpendChart({
  monthly,
  currency,
}: {
  monthly: CustomerMonthPoint[];
  currency: string;
}) {
  const data: Point[] = monthly.map((p, i) => ({
    ...p,
    label: tickLabel(p.month, i === 0),
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--line))" strokeWidth={1} />
          <XAxis
            dataKey="label"
            tick={{
              fontSize: 10,
              fill: "hsl(var(--muted-2))",
              fontFamily: "var(--font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            interval={0}
            minTickGap={8}
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip
            cursor={{ fill: "hsl(var(--canvas))" }}
            content={<SpendTooltip currency={currency} />}
          />
          <Bar
            dataKey="net"
            fill="#EB7F44"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

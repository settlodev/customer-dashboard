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

import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";
import { PackageTimeSeriesPoint } from "@/types/admin/billing";

interface RevenueTrendCardProps {
  series: PackageTimeSeriesPoint[];
  isLive: boolean;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCurrency(value: number): string {
  return Math.round(value).toLocaleString();
}

export function RevenueTrendCard({ series, isLive }: RevenueTrendCardProps) {
  const total = series.reduce((sum, p) => sum + p.value, 0);
  const data = series.map((p) => ({
    date: p.date,
    label: formatShortDate(p.date),
    value: p.value,
  }));

  return (
    <section className="rounded-xl border border-line bg-card p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Revenue · last 90 days
          </h2>
          <p className="font-mono text-[11.5px] text-muted-foreground">
            Invoices billed under this package, by day.
          </p>
        </div>
        <div className="text-right">
          {!isLive && <StubBadge />}
          <p className="mt-1 font-mono text-[12px] text-ink tabular-nums">
            Total: {formatCurrency(total)}
          </p>
        </div>
      </header>

      <div className="h-[220px] w-full">
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="pkg-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.35}
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
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
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
              formatter={(value) => [
                formatCurrency(Number(value)),
                "Revenue",
              ]}
              labelFormatter={(label) => label}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#pkg-revenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

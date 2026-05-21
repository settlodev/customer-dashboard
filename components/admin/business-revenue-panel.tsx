"use client";

import { useMemo } from "react";
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
import {
  CircleDollarSign,
  PercentSquare,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  BusinessDailyTrendRow,
  BusinessOverviewSnapshot,
} from "@/types/admin/business-intel";

interface BusinessRevenuePanelProps {
  overview30d: BusinessOverviewSnapshot | null;
  overviewToday: BusinessOverviewSnapshot | null;
  overview7d: BusinessOverviewSnapshot | null;
  trends30d: BusinessDailyTrendRow[];
  errors: {
    overview30d: string | null;
    overviewToday: string | null;
    overview7d: string | null;
    trends30d: string | null;
  };
  currency: string;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString();
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function BusinessRevenuePanel({
  overview30d,
  overviewToday,
  overview7d,
  trends30d,
  errors,
  currency,
}: BusinessRevenuePanelProps) {
  const chartRows = useMemo(
    () =>
      trends30d
        .slice()
        .sort((a, b) => a.business_date.localeCompare(b.business_date))
        .map((r) => ({
          date: r.business_date,
          label: formatShortDate(r.business_date),
          netSales: Number(r.net_sales ?? 0),
          grossProfit: Number(r.gross_profit ?? 0),
          orders: Number(r.total_orders ?? 0),
        })),
    [trends30d],
  );

  const has30d = !!overview30d;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Revenue &amp; orders
        </h3>

        {errors.overview30d && !overview30d ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.overview30d}
          </p>
        ) : (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                label="Today net sales"
                value={formatMoney(overviewToday?.net_sales)}
                unit={currency}
                delta={`${formatNumber(overviewToday?.total_orders)} orders`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                label="7-day net sales"
                value={formatMoney(overview7d?.net_sales)}
                unit={currency}
                delta={`AOV ${formatMoney(overview7d?.avg_order_value)}`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                label="30-day net sales"
                value={formatMoney(overview30d?.net_sales)}
                unit={currency}
                delta={`${formatNumber(overview30d?.total_orders)} orders`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<PercentSquare className="h-3.5 w-3.5" />}
                label="30-day gross profit"
                value={formatMoney(overview30d?.gross_profit)}
                unit={currency}
                delta={
                  overview30d?.net_sales && overview30d.gross_profit
                    ? `${((overview30d.gross_profit / overview30d.net_sales) * 100).toFixed(1)}% margin`
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Users className="h-3.5 w-3.5" />}
                label="30-day customers"
                value={formatNumber(overview30d?.unique_customers)}
                delta={`${formatNumber(overview30d?.active_staff)} active staff`}
                deltaTone="neutral"
              />
            </KpiStrip>

            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={<ShoppingBag className="h-3.5 w-3.5" />}
                label="Cancelled (30d)"
                value={formatNumber(overview30d?.cancelled_orders)}
              />
              <Stat
                icon={<ReceiptText className="h-3.5 w-3.5" />}
                label="Refunded (30d)"
                value={formatMoney(overview30d?.total_refunded_amount)}
                hint={`${formatNumber(overview30d?.total_refund_count)} refunds`}
              />
              <Stat
                icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                label="Tips (30d)"
                value={formatMoney(overview30d?.total_tips)}
              />
              <Stat
                icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                label="Expenses paid (30d)"
                value={formatMoney(overview30d?.expenses_paid)}
              />
            </div>
          </>
        )}
      </div>

      {/* 30-day trend chart */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            30-day revenue trend
          </h3>
          {has30d && (
            <p className="font-mono text-[11px] text-muted-foreground">
              Net sales · gross profit · order volume
            </p>
          )}
        </div>
        {errors.trends30d ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errors.trends30d}
          </p>
        ) : chartRows.length === 0 ? (
          <p className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted-foreground">
            No order activity in the last 30 days.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartRows}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="netSalesFill" x1="0" y1="0" x2="0" y2="1">
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
                  width={70}
                  tickFormatter={(v) => formatMoney(Number(v))}
                />
                <Tooltip
                  formatter={(v: any, name: string) =>
                    name === "Orders" ? formatNumber(Number(v)) : formatMoney(Number(v))
                  }
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--line))",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netSales"
                  name="Net sales"
                  stroke="hsl(var(--primary))"
                  fill="url(#netSalesFill)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  name="Gross profit"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line/60 bg-canvas/40 p-3">
      <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <span className="opacity-70">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-ink">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

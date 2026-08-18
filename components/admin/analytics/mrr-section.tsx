"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
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
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { RecomputeButton } from "@/components/admin/analytics/recompute-button";
import { recomputeMrr } from "@/lib/actions/admin/analytics";
import { MrrMovement } from "@/types/admin/analytics";

interface MrrSectionProps {
  movements: MrrMovement[];
  latest: MrrMovement | null;
  dateRange: { startDate: string; endDate: string };
  canRecompute: boolean;
  error: string | null;
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString();
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface ChartRow {
  date: string;
  label: string;
  endingMrr: number;
  netNewMrr: number;
  new: number;
  expansion: number;
  reactivation: number;
  contraction: number;
  churn: number;
}

export function MrrSection({
  movements,
  latest,
  dateRange,
  canRecompute,
  error,
}: MrrSectionProps) {
  const rows: ChartRow[] = useMemo(
    () =>
      movements
        .slice()
        .sort((a, b) => a.metric_date.localeCompare(b.metric_date))
        .map((m) => ({
          date: m.metric_date,
          label: formatShortDate(m.metric_date),
          endingMrr: Number(m.ending_mrr ?? 0),
          netNewMrr: Number(m.net_new_mrr ?? 0),
          new: Number(m.new_mrr ?? 0),
          expansion: Number(m.expansion_mrr ?? 0),
          reactivation: Number(m.reactivation_mrr ?? 0),
          contraction: -Math.abs(Number(m.contraction_mrr ?? 0)),
          churn: -Math.abs(Number(m.churn_mrr ?? 0)),
        })),
    [movements],
  );

  if (error && rows.length === 0) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {error}
      </p>
    );
  }

  const arr = latest ? latest.ending_mrr * (latest.mrr_arr_ratio || 12) : 0;
  const netTone =
    (latest?.net_new_mrr ?? 0) > 0
      ? "pos"
      : (latest?.net_new_mrr ?? 0) < 0
        ? "neg"
        : "neutral";

  return (
    <div className="space-y-6">
      {canRecompute && (
        <div className="flex justify-end">
          <RecomputeButton
            label="MRR movements"
            description={`Re-runs the nightly MRR aggregation for ${dateRange.startDate} → ${dateRange.endDate}. The job runs asynchronously; data refreshes once it finishes.`}
            action={() => recomputeMrr(dateRange.startDate, dateRange.endDate)}
          />
        </div>
      )}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          label="Ending MRR"
          value={formatCurrency(latest?.ending_mrr)}
          unit="TZS"
        />
        <KpiCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Annualised (ARR)"
          value={formatCurrency(arr)}
          unit="TZS"
          delta={`× ${latest?.mrr_arr_ratio?.toFixed(1) ?? "12.0"} ratio`}
          deltaTone="neutral"
        />
        <KpiCard
          icon={
            netTone === "neg" ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5" />
            )
          }
          label="Net new MRR"
          value={formatCurrency(latest?.net_new_mrr)}
          unit="TZS"
          deltaTone={netTone}
          delta={
            latest
              ? `${latest.new_customer_count + latest.reactivation_customer_count} added · ${latest.churn_customer_count} churned`
              : undefined
          }
        />
        <KpiCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Paying customers"
          value={latest?.paying_customers?.toLocaleString() ?? "—"}
        />
      </KpiStrip>

      {/* Ending MRR over time */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            Ending MRR over time
          </h3>
          <p className="font-mono text-[11px] text-muted-foreground">
            {dateRange.startDate} → {dateRange.endDate}
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" vertical={false} />
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
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={70}
              />
              <Tooltip
                formatter={(v: any) => formatCurrency(Number(v))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--line))",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="endingMrr"
                stroke="hsl(var(--primary))"
                fill="url(#mrrFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movements breakdown */}
      <div className="rounded-lg border border-line bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-ink">
          MRR movements
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={rows}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              stackOffset="sign"
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
                tickFormatter={(v) => formatCurrency(Number(v))}
                width={70}
              />
              <ReferenceLine y={0} stroke="hsl(var(--line))" />
              <Tooltip
                formatter={(v: any) => formatCurrency(Math.abs(Number(v)))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--line))",
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Bar dataKey="new" stackId="movements" fill="#10b981" name="New" />
              <Bar
                dataKey="expansion"
                stackId="movements"
                fill="#34d399"
                name="Expansion"
              />
              <Bar
                dataKey="reactivation"
                stackId="movements"
                fill="#6ee7b7"
                name="Reactivation"
              />
              <Bar
                dataKey="contraction"
                stackId="movements"
                fill="#fb923c"
                name="Contraction"
              />
              <Bar
                dataKey="churn"
                stackId="movements"
                fill="#ef4444"
                name="Churn"
              />
              <Line
                type="monotone"
                dataKey="netNewMrr"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Net new"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent movements table */}
      <div className="overflow-hidden rounded-lg border border-line bg-card">
        <div className="border-b border-line px-5 py-3">
          <h3 className="text-sm font-semibold text-ink">Recent days</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-line text-left">
                <th className="px-5 py-2 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Ending MRR
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Net new
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  New
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Churn
                </th>
                <th className="px-5 py-2 text-right font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  Customers
                </th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .reverse()
                .slice(0, 30)
                .map((r) => (
                  <tr
                    key={r.date}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-5 py-2 font-mono text-muted-foreground">
                      {r.date}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      {formatCurrency(r.endingMrr)}
                    </td>
                    <td
                      className={
                        "px-5 py-2 text-right tabular-nums " +
                        (r.netNewMrr > 0
                          ? "text-pos"
                          : r.netNewMrr < 0
                            ? "text-neg"
                            : "text-muted-foreground")
                      }
                    >
                      {r.netNewMrr > 0 ? "+" : ""}
                      {formatCurrency(r.netNewMrr)}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-pos">
                      +{formatCurrency(r.new)}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-neg">
                      {formatCurrency(r.churn)}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-muted-foreground">
                      {movements.find((m) => m.metric_date === r.date)
                        ?.paying_customers ?? "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

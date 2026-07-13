"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentMethodBreakdown } from "@/types/reports/payment-methods";

/**
 * Payment mix — the "Settlo Home Dashboard" mock's donut + legend, right half
 * of the "trend + payment mix" row. Fed by the dedicated
 * `getPaymentMethodBreakdown` action (transactions/by-payment-method), the
 * source of truth after the overview-embedded array came back empty. The donut
 * is a recharts `PieChart` (arc maths + hover tooltip); the legend below it is
 * hand-rolled to match the mock's dot · name · % · amount rows.
 */

const fmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(n);

// Compact "14.82M" form for the donut centre.
const short = (n: number): string => {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.?0+$/, "")}K`;
  return `${Math.round(n)}`;
};

// Settlo palette — orange for the largest share, green next, then the rest.
// Rows are sorted descending, so index 0 is the biggest slice. Each entry is a
// real colour value (recharts Cell fill + legend-dot background).
const SEG_COLORS = [
  "#EB7F44",
  "hsl(var(--pos))",
  "#2563EB",
  "#7C3AED",
  "hsl(var(--warn))",
  "hsl(var(--muted-2))",
];

interface Slice {
  key: string;
  name: string;
  value: number;
  share: number;
  color: string;
}

/** Card-styled tooltip on donut hover. */
function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Slice }>;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-[2px]"
          style={{ background: s.color }}
        />
        <span className="text-[12px] font-medium text-ink">{s.name}</span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">
        {fmt(s.value)} TZS · {s.share.toFixed(1)}%
      </div>
    </div>
  );
}

export function PaymentMethodsCard({
  data,
  loading,
}: {
  data: PaymentMethodBreakdown[] | null;
  loading?: boolean;
}) {
  const rows = [...(data ?? [])].sort((a, b) => b.totalAmount - a.totalAmount);
  const total = rows.reduce((s, r) => s + r.totalAmount, 0);

  const slices: Slice[] = rows.map((r, i) => ({
    key: `${r.acceptedPaymentMethodType}-${i}`,
    name: r.acceptedPaymentMethodTypeName || "Unknown",
    value: r.totalAmount,
    share:
      r.percentage != null && r.percentage > 0
        ? r.percentage
        : total > 0
          ? (r.totalAmount / total) * 100
          : 0,
    color: SEG_COLORS[i % SEG_COLORS.length],
  }));

  return (
    <Card className="flex h-full flex-col p-5 shadow-none">
      {/* head */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <CreditCard className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Payment mix
        </div>
        <Link
          href="/day-sessions"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary-dark hover:text-primary"
        >
          Cash-up →
        </Link>
      </div>

      {loading && !data ? (
        <div className="flex flex-1 flex-col items-center gap-4">
          <Skeleton className="h-[184px] w-[184px] rounded-full" />
          <div className="w-full space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 rounded-md" />
            ))}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center font-mono text-[12px] text-muted-foreground">
          No payments in this range
        </p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          {/* donut (recharts) */}
          <div className="relative h-[184px] w-[184px] shrink-0">
            <PieChart
              width={184}
              height={184}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={84}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
            {/* centre label — pointer-events-none so the ring stays hoverable */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
              <div className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
                {short(total)}
              </div>
            </div>
          </div>

          {/* legend */}
          <div className="w-full">
            {slices.map((s) => (
              <div
                key={s.key}
                className="flex items-center gap-2.5 border-b border-line py-[7px] last:border-b-0"
              >
                <span
                  className="h-[9px] w-[9px] shrink-0 rounded-[3px]"
                  style={{ background: s.color }}
                />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">
                  {s.name}
                </span>
                <span className="w-[46px] shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                  {s.share.toFixed(1)}%
                </span>
                <span className="w-[88px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-ink">
                  {fmt(s.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default PaymentMethodsCard;

import React from "react";
import {
  Coins,
  Crown,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Undo2,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { Skeleton } from "@/components/ui/skeleton";
import type OverviewResponse from "@/types/dashboard/type";
import type { TopSellingItem } from "@/types/reports/top-selling";

/**
 * Six-tile sales KPI strip for the dashboard, fed by the Reports Service
 * overview response — so it reacts to the date-range picker. The endpoint
 * returns point-in-time totals for the selected range with no
 * prior-period baseline, so there are no week-over-week deltas; the delta
 * line is used for context (open-order count, profit margin, refund
 * count) instead. The tinted arrow on Net profit / Refunds reads as a
 * financial-health signal (green = profit, red = loss / money out), not a
 * trend.
 */

type Props = {
  /** Overview fetched client-side. Null = not loaded / transport failure. */
  overview: OverviewResponse | null;
  /** #1 item from the top-selling report — the authoritative source. */
  topSeller?: TopSellingItem | null;
  loading?: boolean;
};

const fmtCount = (n: number | undefined | null): string =>
  n === undefined || n === null ? "0" : Math.round(n).toLocaleString();

/** Mono signed-percent string with a unicode minus, matching the rest of the KPI strips. */
const fmtMargin = (pct: number): string => {
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded < 0 ? "−" : "";
  return `${sign}${Math.abs(rounded).toFixed(1)}% margin`;
};

export function SalesKpiStrip({ overview, topSeller, loading }: Props) {
  const showSkeleton = loading && !overview;

  // Per-tile value: a skeleton while first-loading, an em-dash when we
  // have no data, otherwise the computed value.
  const v = (compute: () => React.ReactNode): React.ReactNode =>
    showSkeleton ? (
      <Skeleton className="h-6 w-20" />
    ) : overview ? (
      compute()
    ) : (
      "—"
    );

  const ready = !!overview && !showSkeleton;

  const netProfit = overview
    ? overview.netSales - overview.totalCost - overview.totalExpenseAmount
    : 0;
  const margin =
    overview && overview.netSales > 0
      ? (netProfit / overview.netSales) * 100
      : null;
  const avgOrder =
    overview && overview.totalOrders > 0
      ? overview.netSales / overview.totalOrders
      : 0;

  return (
    <KpiStrip cols={6}>
      <KpiCard
        icon={<DollarSign className="h-3 w-3" />}
        label="Net sales"
        value={v(() => fmtCount(overview!.netSales))}
        unit="TZS"
      />
      <KpiCard
        icon={<TrendingUp className="h-3 w-3" />}
        label="Net profit"
        value={v(() => fmtCount(netProfit))}
        unit="TZS"
        delta={ready && margin !== null ? fmtMargin(margin) : undefined}
        deltaTone={netProfit < 0 ? "neg" : "pos"}
      />
      <KpiCard
        icon={<ShoppingBag className="h-3 w-3" />}
        label="Orders"
        value={v(() => fmtCount(overview!.totalOrders))}
        delta={ready ? `${fmtCount(overview!.openOrders)} open` : undefined}
        deltaTone="neutral"
      />
      <KpiCard
        icon={<Coins className="h-3 w-3" />}
        label="Avg order"
        value={v(() => fmtCount(avgOrder))}
        unit="TZS"
      />
      <KpiCard
        icon={<Crown className="h-3 w-3" />}
        label="Top seller"
        value={v(() =>
          topSeller ? (
            <span className="line-clamp-1 text-[15px] leading-snug">
              {topSeller.productName}
            </span>
          ) : (
            "—"
          ),
        )}
        delta={
          !showSkeleton && topSeller
            ? `${fmtCount(topSeller.quantitySold)} sold`
            : undefined
        }
        deltaTone="neutral"
      />
      <KpiCard
        icon={<Undo2 className="h-3 w-3" />}
        label="Refunds"
        value={v(() => fmtCount(overview!.totalRefundedAmount))}
        unit="TZS"
        delta={
          ready ? `${fmtCount(overview!.totalRefundCount)} refunds` : undefined
        }
        deltaTone={
          overview && overview.totalRefundedAmount > 0 ? "neg" : "neutral"
        }
      />
    </KpiStrip>
  );
}

export default SalesKpiStrip;

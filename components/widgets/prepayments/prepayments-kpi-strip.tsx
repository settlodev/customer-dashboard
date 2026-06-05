import { CircleDollarSign, TrendingUp, Wallet } from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import type { PrepaymentAnalyticsOverview } from "@/types/customer-prepayments/type";

/**
 * Business-wide customer prepaid-credit summary for the dashboard. The
 * outstanding liability is what the business owes customers in prepaid funds.
 * Renders nothing when there is no prepayment activity, so it stays out of the
 * way for merchants who don't use the feature.
 */
export function PrepaymentKpiStrip({
  summary,
}: {
  summary: PrepaymentAnalyticsOverview | null;
}) {
  if (
    !summary ||
    (summary.outstandingLiability <= 0 && summary.totalToppedUpValue <= 0)
  ) {
    return null;
  }

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <KpiStrip cols={3}>
      <KpiCard
        icon={<Wallet className="h-3 w-3" />}
        label="Prepaid credit owed"
        value={fmt(summary.outstandingLiability)}
        unit="TZS"
        deltaTone="neg"
      />
      <KpiCard
        icon={<CircleDollarSign className="h-3 w-3" />}
        label="Topped up"
        value={fmt(summary.totalToppedUpValue)}
        unit="TZS"
        deltaTone="pos"
      />
      <KpiCard
        icon={<TrendingUp className="h-3 w-3" />}
        label="Spent from prepaid"
        value={fmt(summary.totalRedeemedValue)}
        unit="TZS"
        deltaTone="neutral"
      />
    </KpiStrip>
  );
}

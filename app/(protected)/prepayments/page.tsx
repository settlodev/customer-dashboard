import { format, subDays } from "date-fns";
import {
  CircleDollarSign,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import {
  getCurrentBusiness,
  getCurrentLocation,
} from "@/lib/actions/business/get-current-business";
import {
  getOutstandingPrepaidLiability,
  getPrepaymentAnalyticsOverview,
  getTopCustomerPrepaidBalances,
} from "@/lib/actions/prepayment-analytics-actions";

/**
 * Customer prepayments report — the prepaid liability owed to customers
 * (all-time, business-wide) plus a 30-day top-up/redemption window for the
 * current location, and the customers owed the most.
 */
export default async function PrepaymentsReportPage() {
  const [location, business] = await Promise.all([
    getCurrentLocation(),
    getCurrentBusiness(),
  ]);

  const today = new Date();
  const endDate = format(today, "yyyy-MM-dd");
  const startDate = format(subDays(today, 30), "yyyy-MM-dd");

  const [liability, overview, topCustomers] = await Promise.all([
    business?.id
      ? getOutstandingPrepaidLiability(business.id)
      : Promise.resolve(null),
    location?.id
      ? getPrepaymentAnalyticsOverview(location.id, startDate, endDate)
      : Promise.resolve(null),
    business?.id
      ? getTopCustomerPrepaidBalances(business.id, 50)
      : Promise.resolve([]),
  ]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const outstanding = liability?.outstandingLiability ?? 0;
  const isEmpty =
    outstanding === 0 &&
    topCustomers.length === 0 &&
    (!overview || overview.topUpCount === 0);

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Prepayments" }]} />
      <PageHeader
        title="Customer prepayments"
        subtitle="Prepaid credit owed to customers, and how it's topped up and spent."
      />
      <PageBody>
        {isEmpty ? (
          <NoItems itemName="customer prepayments" />
        ) : (
          <div className="space-y-8">
            {/* ── Outstanding liability (all-time, business-wide) ──── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-ink">
                Outstanding — business-wide
              </h2>
              <KpiStrip cols={4}>
                <KpiCard
                  icon={<Wallet className="h-3 w-3" />}
                  label="Owed to customers"
                  value={fmt(outstanding)}
                  unit="TZS"
                  deltaTone="neg"
                />
                <KpiCard
                  icon={<CircleDollarSign className="h-3 w-3" />}
                  label="Topped up (all time)"
                  value={fmt(liability?.totalToppedUpValue ?? 0)}
                  unit="TZS"
                  deltaTone="pos"
                />
                <KpiCard
                  icon={<TrendingUp className="h-3 w-3" />}
                  label="Spent (all time)"
                  value={fmt(liability?.totalRedeemedValue ?? 0)}
                  unit="TZS"
                  deltaTone="neutral"
                />
                <KpiCard
                  icon={<CircleDollarSign className="h-3 w-3" />}
                  label="Breakage"
                  value={fmt(liability?.totalBreakageValue ?? 0)}
                  unit="TZS"
                  deltaTone="neutral"
                />
              </KpiStrip>
            </div>

            {/* ── Last 30 days (this location) ─────────────────────── */}
            {overview && (overview.topUpCount > 0 || overview.redemptionCount > 0) && (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">
                  Last 30 days — this location
                </h2>
                <KpiStrip cols={4}>
                  <KpiCard
                    icon={<Wallet className="h-3 w-3" />}
                    label="Top-ups"
                    value={fmt(overview.topUpCount)}
                    delta={`${fmt(overview.totalToppedUpValue)} TZS`}
                    deltaTone="pos"
                  />
                  <KpiCard
                    icon={<TrendingUp className="h-3 w-3" />}
                    label="Redemptions"
                    value={fmt(overview.redemptionCount)}
                    delta={`${fmt(overview.totalRedeemedValue)} TZS`}
                    deltaTone="neutral"
                  />
                  <KpiCard
                    icon={<Percent className="h-3 w-3" />}
                    label="Redemption rate"
                    value={overview.redemptionRate.toFixed(1)}
                    unit="%"
                    deltaTone="neutral"
                  />
                  <KpiCard
                    icon={<CircleDollarSign className="h-3 w-3" />}
                    label="Avg top-up"
                    value={fmt(overview.avgTopUpValue)}
                    unit="TZS"
                    deltaTone="neutral"
                  />
                </KpiStrip>
              </div>
            )}

            {/* ── By customer (who we owe) ─────────────────────────── */}
            {topCustomers.length > 0 && (
              <Card>
                <CardContent className="px-2 pt-6 sm:px-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
                    <Users className="h-4 w-4" />
                    Prepaid balance by customer
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3 text-right">
                            Balance owed
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {topCustomers.map((c) => (
                          <tr key={c.customerId} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium">
                              {c.customerName || c.customerId}
                            </td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">
                              {fmt(c.outstandingBalance)}{" "}
                              <span className="text-muted-foreground">
                                {c.currency ?? "TZS"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageBody>
    </PageShell>
  );
}

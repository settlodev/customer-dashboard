import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Boxes,
  Coins,
  Package,
  Percent,
  RotateCcw,
  Wallet,
} from "lucide-react";

import { SectionCard } from "@/components/admin/shared/section-card";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { RefundExportButton } from "@/components/reports/refunds/refund-export-button";
import {
  RefundBreakdownList,
  RefundImpactPanel,
  RefundReasonComposition,
} from "@/components/reports/refunds/refund-panels";
import { RefundTrendChart } from "@/components/reports/refunds/refund-trend-chart";
import { DataTable } from "@/components/tables/data-table";
import { refundColumns } from "@/components/tables/refunds/columns";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { fetchOverview } from "@/lib/actions/dashboard-action";
import {
  getRefundDashboard,
  GetRefundReport,
} from "@/lib/actions/refund-actions";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  buildRefundTrendSeries,
  fmtQuantity,
  fmtRefundAmount,
  pluralize,
} from "@/types/reports/refunds";
import type OverviewResponse from "@/types/dashboard/type";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function RefundReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  // Current month by default — the standard window on every report screen.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const page = Math.max(1, Number(resolved.page) || 1);
  const limit = Math.max(1, Number(resolved.limit) || DEFAULT_PAGE_SIZE);

  const [dashboard, overview, currency, detail] = await Promise.all([
    // One aggregated read behind the KPI strip, the trend and every
    // breakdown — null renders the in-page retry rather than an empty screen.
    getRefundDashboard({ startDate: from, endDate: to }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
    // Sales-side denominator for the refund rate. Taken from the same
    // overview the sales screens use, so the two never disagree.
    fetchOverview(from, to)
      .then((data) => data as OverviewResponse | null)
      .catch((e) => {
        rethrowIfBoundary(e);
        return null;
      }),
    getLocationCurrency().catch(() => "TZS"),
    // The line-item table pages server-side and keeps its own range-wide
    // totals, so it stays a separate read from the aggregates above.
    GetRefundReport({
      startDate: from,
      endDate: to,
      page: page - 1,
      size: limit,
    }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
  ]);

  const subtitle =
    from === to
      ? `Refunds on ${format(new Date(from), "MMM d, yyyy")}`
      : `Refunds ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const header = (
    <>
      <PageBreadcrumbs
        items={[{ title: "Reports", href: "/dashboard" }, { title: "Refunds" }]}
      />
      <PageHeader
        title="Refunds"
        subtitle={subtitle}
        titleAccessory={
          <span className="inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            {currency}
          </span>
        }
      />
    </>
  );

  if (!dashboard) {
    return (
      <PageShell>
        {header}
        <PageBody>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <OrdersDateFilter from={from} to={to} />
          </div>
          <DataLoadError itemName="refunds" />
        </PageBody>
      </PageShell>
    );
  }

  const {
    totalRefundCount: refundCount,
    totalRefundedAmount: refundedAmount,
    totalReturnedCost: returnedCost,
    totalQuantity: unitsReturned,
    refundedOrderCount,
    restockedCount,
    averageRefundAmount,
    largestRefundAmount,
  } = dashboard;

  const hasRefunds = refundCount > 0;
  const netSales = overview?.netSales ?? 0;
  // Only meaningful against real sales — a period with refunds but no sales
  // (returns against an earlier month) would otherwise read as an absurd %.
  const refundRate = netSales > 0 ? (refundedAmount / netSales) * 100 : null;
  const costRecoveryRate =
    refundedAmount > 0 ? (returnedCost / refundedAmount) * 100 : 0;
  const restockRate = hasRefunds ? (restockedCount / refundCount) * 100 : 0;

  const trend = buildRefundTrendSeries(from, to, dashboard.trend);

  const rows = detail?.refunds ?? [];
  const detailTotal = detail?.totalElements ?? 0;
  const detailPages = detail?.totalPages ?? 0;

  return (
    <PageShell>
      {header}

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OrdersDateFilter from={from} to={to} />
          <RefundExportButton
            from={from}
            to={to}
            currency={currency}
            refundCount={refundCount}
            refundedAmount={refundedAmount}
            returnedCost={returnedCost}
            unitsReturned={unitsReturned}
            ordersAffected={refundedOrderCount}
            restockedCount={restockedCount}
            averageRefund={averageRefundAmount}
            largestRefund={largestRefundAmount}
            refundRate={refundRate}
            byReason={dashboard.byReason}
            byRefundType={dashboard.byRefundType}
            byPaymentMethod={dashboard.byPaymentMethod}
            topItems={dashboard.topItems}
            byStaff={dashboard.byStaff}
            disabled={!hasRefunds}
          />
        </div>

        {!hasRefunds ? (
          <NoItems itemName="refunds in this period" />
        ) : (
          <>
            <KpiStrip cols={6}>
              <KpiCard
                icon={<Wallet className="h-3 w-3" />}
                label="Refunded"
                value={fmtRefundAmount(refundedAmount)}
                unit={currency}
                delta={pluralize(refundCount, "refund")}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Percent className="h-3 w-3" />}
                label="Refund rate"
                value={refundRate != null ? `${refundRate.toFixed(1)}%` : "—"}
                delta={
                  refundRate != null
                    ? `of ${fmtRefundAmount(netSales)} net sales`
                    : "no sales in period"
                }
                deltaTone={refundRate != null && refundRate > 5 ? "neg" : "neutral"}
              />
              <KpiCard
                icon={<Boxes className="h-3 w-3" />}
                label="Units returned"
                value={fmtQuantity(unitsReturned)}
                delta={`across ${pluralize(refundedOrderCount, "order")}`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Coins className="h-3 w-3" />}
                label="Cost recovered"
                value={fmtRefundAmount(returnedCost)}
                unit={currency}
                delta={`${costRecoveryRate.toFixed(0)}% of refunded value`}
                deltaTone="pos"
              />
              <KpiCard
                icon={<Package className="h-3 w-3" />}
                label="Restocked"
                value={`${restockRate.toFixed(0)}%`}
                delta={`${restockedCount.toLocaleString()} of ${refundCount.toLocaleString()}`}
                deltaTone={restockRate >= 80 ? "pos" : "neutral"}
              />
              <KpiCard
                icon={<RotateCcw className="h-3 w-3" />}
                label="Average refund"
                value={fmtRefundAmount(averageRefundAmount)}
                unit={currency}
                delta={`largest ${fmtRefundAmount(largestRefundAmount)}`}
                deltaTone="neutral"
              />
            </KpiStrip>

            <div className="grid gap-4 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Refunds over time"
                subtitle="Value refunded per business day, with the refund count"
              >
                <RefundTrendChart data={trend} currency={currency} />
              </SectionCard>

              <SectionCard
                title="Margin impact"
                subtitle="What the refunds actually cost"
              >
                <RefundImpactPanel
                  refundedAmount={refundedAmount}
                  returnedCost={returnedCost}
                  restockedCount={restockedCount}
                  refundCount={refundCount}
                  currency={currency}
                />
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard
                title="Why customers refunded"
                subtitle={`Share of refunded value by reason · ${pluralize(dashboard.byReason.length, "reason")}`}
              >
                <RefundReasonComposition
                  rows={dashboard.byReason}
                  currency={currency}
                />
              </SectionCard>

              <SectionCard
                title="Most refunded items"
                subtitle="Top items by refunded value, with the cost that came back"
              >
                <RefundBreakdownList
                  rows={dashboard.topItems}
                  currency={currency}
                  emptyLabel="No refunded items in this period."
                  numbered
                  showQuantity
                  showCost
                />
              </SectionCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard
                title="Processed by"
                subtitle="Which staff put the refunds through"
              >
                <RefundBreakdownList
                  rows={dashboard.byStaff}
                  currency={currency}
                  emptyLabel="No staff attribution on these refunds."
                  barColor="hsl(var(--primary))"
                />
              </SectionCard>

              <SectionCard
                title="Refund type & payback"
                subtitle="How the refund was issued, and how the money went back"
              >
                <div className="space-y-5">
                  <div>
                    <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Refund type
                    </p>
                    <RefundBreakdownList
                      rows={dashboard.byRefundType}
                      currency={currency}
                      emptyLabel="No refund types recorded."
                    />
                  </div>
                  <div className="border-t border-dashed border-line pt-4">
                    <p className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Paid back via
                    </p>
                    <RefundBreakdownList
                      rows={dashboard.byPaymentMethod}
                      currency={currency}
                      emptyLabel="No payback method recorded."
                      barColor="hsl(var(--warn))"
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              id="refund-detail"
              title="Refund detail"
              subtitle={
                detail
                  ? `${pluralize(detailTotal, "refunded line")} in this period`
                  : "Refund line items for the period"
              }
            >
              {detail ? (
                <DataTable
                  columns={refundColumns}
                  data={rows}
                  searchKey="orderItemName"
                  hideSearch
                  pageNo={page - 1}
                  total={detailTotal}
                  pageCount={detailPages}
                  defaultPageSize={limit}
                  rowClickBasePath="/refunds"
                />
              ) : (
                <DataLoadError itemName="refund line items" />
              )}
            </SectionCard>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}

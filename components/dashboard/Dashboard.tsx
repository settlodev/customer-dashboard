"use client";
import React, { useCallback, useEffect, useState } from "react";

import { PageBody } from "@/components/layouts/page-shell";
import { DateRangeSegmented } from "@/components/filters/date-range-segmented";
import { InventoryKpiStrip } from "@/components/widgets/inventory/inventory-kpi-strip";
import { PrepaymentKpiStrip } from "@/components/widgets/prepayments/prepayments-kpi-strip";
import { SalesKpiStrip } from "@/components/widgets/dashboard/sales-kpi-strip";
import { DashboardRealtimeBridge } from "@/components/realtime/dashboard-realtime-bridge";
import { fetchOverview } from "@/lib/actions/dashboard-action";
import { listTopSellingProducts } from "@/lib/actions/product-actions";
import { getPaymentMethodBreakdown } from "@/lib/actions/transaction-analytics-actions";
import type OverviewResponse from "@/types/dashboard/type";
import type { RsInventoryDashboardSummary } from "@/types/reports-analytics/type";
import type { PrepaymentAnalyticsOverview } from "@/types/customer-prepayments/type";
import type { TopSellingReport } from "@/types/reports/top-selling";
import type { PaymentMethodBreakdown } from "@/types/reports/payment-methods";
import type { ActivityItem } from "@/lib/dashboard/recent-activity";
import type { ReorderSuggestion } from "@/types/inventory-analytics/type";

import { DashboardHeader } from "./dashboard-header";
import DashboardHeroCards from "./dashboard-hero-cards";
import { SalesTrendCard } from "./sales-trend-card";
import { TopSellingCard } from "./top-selling-card";
import { PaymentMethodsCard } from "./payment-methods-card";
import { RecentActivityCard } from "./recent-activity-card";
import { ReorderSoonCard } from "./reorder-soon-card";

type Props = {
  /** Active location id, used to scope the realtime orders channel. */
  locationId: string | null;
  /** Point-in-time inventory summary, fetched server-side. */
  inventorySummary: RsInventoryDashboardSummary | null;
  /** Business-wide prepaid-credit summary, fetched server-side. */
  prepaid: PrepaymentAnalyticsOverview | null;
  /** When false (read_own), the report-backed cards (overview/top-selling/payment) are hidden. */
  reportsReadAll?: boolean;
  /** Time-of-day greeting ("Good evening"), resolved server-side in the active
   *  location's timezone. */
  greeting: string;
  /** Signed-in user's first name — shown in brand orange next to the greeting. */
  userName: string;
  /** Identity subline (venue · city), shown in mono below the greeting. */
  subline?: string;
  /** Latest owner-notification events → Recent activity card (server-mapped). */
  recentActivity: ActivityItem[];
  /** Stock variants nearing depletion → Reorder soon card (server-fetched). */
  reorderSuggestions: ReorderSuggestion[];
  /**
   * Active date range (`yyyy-MM-dd`), owned by the URL and resolved
   * server-side. Defaults to the location's current business day (the day
   * session's businessDate, which the Reports facts are stamped with) so the
   * hero/KPI totals line up with /report/expense and the Z-reports, and — since
   * the overview aggregates by business_date — compile every session on that
   * business day into one. The shared {@link DateRangeSegmented} control in the
   * header writes changes back to the `from`/`to` query params, which re-runs
   * the server page and lands here as new props.
   */
  from: string;
  to: string;
  /** Financing eligibility hero (or null when the Loans flag is off). Rendered
   *  at the top of the body, beneath the header's date filter. */
  financingSlot?: React.ReactNode;
};

const TOP_SELLING_LIMIT = 5;

const Dashboard: React.FC<Props> = ({
  locationId,
  inventorySummary,
  prepaid,
  reportsReadAll = true,
  greeting,
  userName,
  subline,
  recentActivity,
  reorderSuggestions,
  from,
  to,
  financingSlot,
}) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [topSelling, setTopSelling] = useState<TopSellingReport | null>(null);
  const [payments, setPayments] = useState<PaymentMethodBreakdown[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  // Whether the overview (hero + expenses) fetch failed, so the cards can show
  // an explicit "unavailable" state instead of a misleading zero. Tracked
  // separately because fetchOverview is caught to null to keep the other cards
  // alive — without this flag a Reports 403/500/timeout looks identical to a
  // genuine "0 expenses".
  const [overviewError, setOverviewError] = useState(false);

  // Fetch the overview (hero + sales KPIs), the top-selling report, and the
  // payment-method breakdown together for the active range. Each is resilient
  // on its own so one failing source doesn't blank the others. The range is the
  // URL-owned `from`/`to` — the same explicit dates the reports use — so a
  // preset/custom change in the shared control re-runs the server page and
  // arrives here as new props. (These are passed straight through; the overview
  // must NOT use the `by-filter TODAY` path, which re-derives "today" from the
  // location's business-HOURS config and can drift off the session businessDate
  // the facts are stamped with, returning zeros.)
  const loadAll = useCallback(
    async (opts?: { silent?: boolean }) => {
      // Without reports:read_all the report-backed cards aren't rendered, so
      // skip the (now location-wide / 403'd) overview/top-selling/payment
      // fetches entirely — initial load, range changes, and realtime refresh.
      if (!reportsReadAll) {
        setIsLoading(false);
        return;
      }
      try {
        if (!opts?.silent) setIsLoading(true);
        let overviewFailed = false;
        const [ov, ts, pm] = await Promise.all([
          fetchOverview(from, to).catch(() => {
            overviewFailed = true;
            return null;
          }),
          listTopSellingProducts({
            fromDate: from,
            toDate: to,
            sortBy: "revenue",
            limit: TOP_SELLING_LIMIT,
          }),
          getPaymentMethodBreakdown({ startDate: from, endDate: to }),
        ]);
        setOverview(ov as OverviewResponse | null);
        setOverviewError(overviewFailed);
        setTopSelling(ts);
        setPayments(pm);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        if (!opts?.silent) setIsLoading(false);
      }
    },
    [reportsReadAll, from, to],
  );

  // Initial load, and again whenever the range (URL) changes.
  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  // Realtime: refetch quietly (keep the current numbers on screen until the
  // fresh ones arrive — no skeleton flash).
  const handleRealtimeRefresh = useCallback(() => {
    void loadAll({ silent: true });
  }, [loadAll]);

  return (
    <>
      <DashboardHeader
        greeting={greeting}
        userName={userName}
        subline={subline}
        actions={<DateRangeSegmented from={from} to={to} />}
      />

      <PageBody>
        {financingSlot}
        {reportsReadAll && (
          <DashboardHeroCards
            overview={overview}
            loading={isLoading}
            error={overviewError}
            onRetry={() => void loadAll()}
          />
        )}
        {reportsReadAll && (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-3">
              <SalesTrendCard overview={overview} loading={isLoading} />
            </div>
            <div className="lg:col-span-2">
              <PaymentMethodsCard data={payments} loading={isLoading} />
            </div>
          </div>
        )}
        {reportsReadAll && (
          <SalesKpiStrip
            overview={overview}
            topSeller={topSelling?.items?.[0] ?? null}
            loading={isLoading}
          />
        )}
        {reportsReadAll && (
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
            <TopSellingCard report={topSelling} loading={isLoading} />
            <RecentActivityCard items={recentActivity} />
          </div>
        )}
        <InventoryKpiStrip summary={inventorySummary} />
        {/* Reorder soon — full width for now; pairs with Settlo credit (design
            §8 right) once that card is built. */}
        <ReorderSoonCard items={reorderSuggestions} />
        <PrepaymentKpiStrip summary={prepaid} />
      </PageBody>

      {locationId && (
        <DashboardRealtimeBridge
          locationId={locationId}
          onRefresh={handleRealtimeRefresh}
        />
      )}
    </>
  );
};

export default Dashboard;

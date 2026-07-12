"use client";
import React, { useCallback, useEffect, useState } from "react";

import { PageBody, PageHeader } from "@/components/layouts/page-shell";
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

import DashboardHeroCards from "./dashboard-hero-cards";
import { TopSellingCard } from "./top-selling-card";
import { PaymentMethodsCard } from "./payment-methods-card";

type Props = {
  /** Active location id, used to scope the realtime orders channel. */
  locationId: string | null;
  /** Point-in-time inventory summary, fetched server-side. */
  inventorySummary: RsInventoryDashboardSummary | null;
  /** Business-wide prepaid-credit summary, fetched server-side. */
  prepaid: PrepaymentAnalyticsOverview | null;
  /** When false (read_own), the report-backed cards (overview/top-selling/payment) are hidden. */
  reportsReadAll?: boolean;
  /** Personalised greeting, shown in place of the generic "Dashboard" title. */
  greetingTitle?: string;
  greetingSubtitle?: string;
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
  greetingTitle,
  greetingSubtitle,
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
        const [ov, ts, pm] = await Promise.all([
          fetchOverview(from, to).catch(() => null),
          listTopSellingProducts({
            fromDate: from,
            toDate: to,
            sortBy: "revenue",
            limit: TOP_SELLING_LIMIT,
          }),
          getPaymentMethodBreakdown({ startDate: from, endDate: to }),
        ]);
        setOverview(ov as OverviewResponse | null);
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
      <PageHeader
        title={greetingTitle ?? "Dashboard"}
        subtitle={greetingSubtitle ?? "Financial overview and sales performance"}
        actions={<DateRangeSegmented from={from} to={to} />}
      />

      <PageBody>
        {financingSlot}
        {reportsReadAll && <DashboardHeroCards overview={overview} loading={isLoading} />}
        {reportsReadAll && (
          <SalesKpiStrip
            overview={overview}
            topSeller={topSelling?.items?.[0] ?? null}
            loading={isLoading}
          />
        )}
        <InventoryKpiStrip summary={inventorySummary} />
        <PrepaymentKpiStrip summary={prepaid} />
        {reportsReadAll && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TopSellingCard report={topSelling} loading={isLoading} />
            <PaymentMethodsCard data={payments} loading={isLoading} />
          </div>
        )}
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

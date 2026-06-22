"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { format } from "date-fns";

import { PageBody, PageHeader } from "@/components/layouts/page-shell";
import { DateRangePicker } from "@/components/ui/date-picker-with-range";
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
};

const TOP_SELLING_LIMIT = 5;

const Dashboard: React.FC<Props> = ({
  locationId,
  inventorySummary,
  prepaid,
  reportsReadAll = true,
}) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [topSelling, setTopSelling] = useState<TopSellingReport | null>(null);
  const [payments, setPayments] = useState<PaymentMethodBreakdown[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  // Active date range, held in a ref so the realtime refetch reuses whatever
  // the user is currently viewing. ALL three sources are queried with the same
  // explicit calendar dates — the overview must NOT use the `by-filter TODAY`
  // path, which resolves "today" through the location's business-hours logic
  // (DateRangeResolver) and can land on a different day than the calendar date
  // the facts are stamped with, returning zeros while top-selling shows data.
  const filterRef = useRef<{ from: string; to: string }>({
    from: today,
    to: today,
  });

  // Fetch the overview (hero + sales KPIs), the top-selling report, and the
  // payment-method breakdown together for the active range. Each is resilient
  // on its own so one failing source doesn't blank the others.
  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    // Without reports:read_all the report-backed cards aren't rendered, so skip
    // the (now location-wide / 403'd) overview/top-selling/payment fetches
    // entirely — for the initial load, date-range changes, and realtime refresh.
    if (!reportsReadAll) {
      setIsLoading(false);
      return;
    }
    try {
      if (!opts?.silent) setIsLoading(true);
      const { from, to } = filterRef.current;
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
  }, [reportsReadAll]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleFilterChange = useCallback(
    (startDate: string, endDate: string) => {
      filterRef.current = { from: startDate, to: endDate };
      void loadAll();
    },
    [loadAll],
  );

  // Realtime: refetch quietly (keep the current numbers on screen until the
  // fresh ones arrive — no skeleton flash).
  const handleRealtimeRefresh = useCallback(() => {
    void loadAll({ silent: true });
  }, [loadAll]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Financial overview and sales performance"
        actions={<DateRangePicker onFilterChange={handleFilterChange} />}
      />

      <PageBody>
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

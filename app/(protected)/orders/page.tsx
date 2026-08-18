import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import {
  OrdersPanel,
  type OrdersKpis,
  type SalesView,
} from "@/components/orders/orders-panel";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { fetchOverview } from "@/lib/actions/dashboard-action";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { searchOrders } from "@/lib/actions/order-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { resolveOrderRowNames } from "@/lib/orders/order-list-view";
import { OrderStatus } from "@/types/orders/type";
import type OverviewResponse from "@/types/dashboard/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    from?: string;
    to?: string;
    tab?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const tab: SalesView = resolved.tab === "abandoned" ? "abandoned" : "orders";
  const statusParam = (resolved.status ?? "") as OrderStatus | "";

  // Default to current month when no explicit range is supplied — keeps
  // the initial load bounded instead of pulling every order ever made
  // at this location.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  // On the Abandoned tab the status is fixed — the user-supplied
  // `status` filter dropdown is hidden and we hard-code ABANDONED on
  // the request side so the OMS only returns the relevant rows.
  const effectiveStatus: OrderStatus | undefined =
    tab === "abandoned" ? OrderStatus.ABANDONED : statusParam || undefined;

  // One server page of orders + the KPI strip (Reports overview) in parallel.
  // The OMS does the filtering, search, and paging; the strip totals come from
  // ClickHouse — so neither scales with the location's order volume. The
  // overview excludes ABANDONED, so it's only fetched for the Orders tab.
  const [
    ordersPage,
    overview,
    currentLocation,
    locationSettings,
    staffList,
    tablesList,
    currency,
  ] = await Promise.all([
    searchOrders({
      fromDate: from,
      toDate: to,
      status: effectiveStatus,
      excludeAbandoned: tab === "orders",
      search: q || undefined,
      page,
      limit,
    }),
    tab === "orders"
      ? fetchOverview(from, to).catch(() => null)
      : Promise.resolve(null),
    getCurrentLocation(),
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
    getLocationCurrency().catch(() => "TZS"),
  ]);

  const pageData = ordersPage.content ?? [];
  const total = ordersPage.totalElements ?? 0;
  const pageCount = ordersPage.totalPages ?? 0;

  // Resolve assigned-to / closed-by / table names for just this page's rows.
  const { staffNames, tableNames } = resolveOrderRowNames(
    pageData,
    staffList,
    tablesList,
  );

  // Table-based ordering swaps the lead column to the table name; the
  // standard mode keeps the order number in front.
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  const ov = overview as OverviewResponse | null;
  const kpis: OrdersKpis | undefined = ov
    ? {
        totalOrders: ov.totalOrders ?? 0,
        openOrders: ov.openOrders ?? 0,
        closedOrders: ov.completedOrders ?? 0,
        grossSales: ov.grossSales ?? 0,
        unpaidOrders: ov.unpaidOrders ?? 0,
      }
    : undefined;

  // The default current-month range shouldn't count as a "user filter" —
  // we want first-time locations to land on the empty state, not on a
  // populated table-shell with no rows. A URL-supplied from/to does.
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" || (tab === "orders" && !!statusParam) || !isDefaultRange;
  // Range has orders if either the overview (Orders tab) or the paged total
  // (Abandoned tab, or overview unavailable) reports any.
  const hasAny = (ov?.totalOrders ?? total) > 0 || total > 0;

  const subtitle =
    from === to
      ? `Activity for ${format(new Date(from), "MMM d, yyyy")}`
      : `Activity ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Orders" }]} />
      <PageHeader title="Orders" subtitle={subtitle} />
      {currentLocation?.id && (
        <OrdersRealtimeBridge locationId={currentLocation.id} />
      )}

      <PageBody>
        <OrdersPanel
          basePath="/orders"
          tabParamKey="tab"
          view={tab}
          from={from}
          to={to}
          kpis={tab === "orders" ? kpis : undefined}
          pageData={pageData}
          pageCount={pageCount}
          pageNo={page - 1}
          total={total}
          tableMode={tableMode}
          staffNames={staffNames}
          tableNames={tableNames}
          currency={currency}
          scope="location"
          statusParam={statusParam}
          emptyState={
            hasAny || hasFilters ? undefined : (
              <NoItems
                itemName={tab === "abandoned" ? "abandoned orders" : "orders"}
              />
            )
          }
          preservedParams={{
            search: resolved.search,
            from: resolved.from,
            to: resolved.to,
            limit: resolved.limit,
            status: resolved.status,
          }}
        />
      </PageBody>
    </PageShell>
  );
}

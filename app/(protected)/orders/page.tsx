import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { OrdersPanel, type SalesView } from "@/components/orders/orders-panel";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { listOrders } from "@/lib/actions/order-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { Order, OrderStatus } from "@/types/orders/type";

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

  const [orders, currentLocation, locationSettings, staffList, tablesList] =
    await Promise.all([
      listOrders({
        fromDate: from,
        toDate: to,
        status: effectiveStatus,
      }).catch((): Order[] => []),
      getCurrentLocation(),
      getLocationSettings().catch(() => null),
      fetchAllStaff().catch(() => []),
      fetchAllTables().catch(() => []),
    ]);

  // Table-based ordering swaps the lead column to the table name; the
  // standard mode keeps the order number in front.
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  // Abandoned orders have their own tab. When the main list runs without
  // an explicit status filter the OMS hands back every status, so strip
  // ABANDONED here to stop it bleeding into the orders list.
  const scopedOrders =
    tab === "orders"
      ? orders.filter((o) => o.orderStatus !== OrderStatus.ABANDONED)
      : orders;

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders: scopedOrders,
      search: q,
      page,
      limit,
      staff: staffList,
      tables: tablesList,
    });

  const currency =
    scopedOrders.find((o) => o.settlementCurrency)?.settlementCurrency ?? "TZS";
  const totalOrders = scopedOrders.length;
  const hasAny = totalOrders > 0;
  // The default current-month range shouldn't count as a "user filter" —
  // we want first-time locations to land on the empty state, not on a
  // populated table-shell with no rows. A URL-supplied from/to does.
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" || (tab === "orders" && !!statusParam) || !isDefaultRange;

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
          scoped={scopedOrders}
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

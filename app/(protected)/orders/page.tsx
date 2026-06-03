import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Banknote,
  CircleDollarSign,
  Coins,
  Receipt,
  ReceiptText,
  Ban,
  Clock,
  Trash2,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { OrdersTabNav, type OrdersTab } from "@/components/orders/orders-tab-nav";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { OrdersDataTable } from "@/components/tables/orders/orders-data-table";
import { AbandonedDataTable } from "@/components/tables/orders/abandoned-data-table";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { listOrders } from "@/lib/actions/order-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/types/orders/type";

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

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const matchesSearch = (order: Order, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    order.orderNumber?.toLowerCase().includes(needle) ||
    (order.notes ?? "").toLowerCase().includes(needle) ||
    (order.externalOrderId ?? "").toLowerCase().includes(needle) ||
    (order.cancellationReason ?? "").toLowerCase().includes(needle)
  );
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const tab: OrdersTab = resolved.tab === "abandoned" ? "abandoned" : "orders";
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
    tab === "abandoned"
      ? OrderStatus.ABANDONED
      : statusParam || undefined;

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

  const filtered = scopedOrders.filter((o) => matchesSearch(o, q));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  // Resolve assigned/closed-by staff and table UUIDs to names, but only
  // for the rows actually on this page — keeps the props handed to the
  // client table small instead of shipping the full staff/table lists.
  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  const neededStaffIds = new Set<string>();
  const neededTableIds = new Set<string>();
  for (const o of pageData) {
    if (o.assignedTo) neededStaffIds.add(o.assignedTo);
    if (o.finishedBy) neededStaffIds.add(o.finishedBy);
    if (o.tableId) neededTableIds.add(o.tableId);
  }
  for (const s of staffList) {
    if (neededStaffIds.has(s.id)) staffNames[s.id] = s.fullName;
  }
  for (const t of tablesList) {
    if (neededTableIds.has(t.id)) tableNames[t.id] = t.name;
  }

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OrdersTabNav
            active={tab}
            preservedParams={{
              search: resolved.search,
              from: resolved.from,
              to: resolved.to,
              limit: resolved.limit,
              status: resolved.status,
            }}
          />
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          tab === "orders" ? (
            <OrdersTabContent
              orders={scopedOrders}
              pageData={pageData}
              pageCount={pageCount}
              pageNo={page - 1}
              total={total}
              currency={currency}
              statusParam={statusParam}
              tableMode={tableMode}
              staffNames={staffNames}
              tableNames={tableNames}
            />
          ) : (
            <AbandonedTabContent
              orders={scopedOrders}
              pageData={pageData}
              pageCount={pageCount}
              pageNo={page - 1}
              total={total}
              tableMode={tableMode}
              staffNames={staffNames}
              tableNames={tableNames}
            />
          )
        ) : (
          <NoItems itemName={tab === "abandoned" ? "abandoned orders" : "orders"} />
        )}
      </PageBody>
    </PageShell>
  );
}

function OrdersTabContent({
  orders,
  pageData,
  pageCount,
  pageNo,
  total,
  currency,
  statusParam,
  tableMode,
  staffNames,
  tableNames,
}: {
  orders: Order[];
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  currency: string;
  statusParam: OrderStatus | "";
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
}) {
  // KPI strip — derive from the unfiltered set so totals don't jump
  // when the user types in the search box.
  const openCount = orders.filter(
    (o) => o.orderStatus === OrderStatus.OPEN,
  ).length;
  const closedCount = orders.filter(
    (o) => o.orderStatus === OrderStatus.CLOSED,
  ).length;
  const grossTotal = orders.reduce((sum, o) => sum + (o.grossAmount ?? 0), 0);
  const unpaidTotal = orders.reduce(
    (sum, o) => sum + (o.unpaidAmount ?? 0),
    0,
  );
  const unpaidCount = orders.filter(
    (o) => o.paymentStatus && o.paymentStatus !== PaymentStatus.PAID,
  ).length;

  return (
    <>
      <KpiStrip cols={5}>
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={orders.length.toLocaleString()}
          delta={
            statusParam ? `Filtered: ${statusParam}` : "Across all statuses"
          }
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Open"
          value={openCount > 0 ? openCount.toLocaleString() : "—"}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Coins className="h-3 w-3" />}
          label="Closed"
          value={closedCount > 0 ? closedCount.toLocaleString() : "—"}
          deltaTone="pos"
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3 w-3" />}
          label="Gross"
          value={grossTotal > 0 ? formatMoney(grossTotal) : "—"}
          unit={currency}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Banknote className="h-3 w-3" />}
          label="Unpaid"
          value={unpaidTotal > 0 ? formatMoney(unpaidTotal) : "—"}
          unit={currency}
          delta={
            unpaidCount > 0
              ? `${unpaidCount.toLocaleString()} order${unpaidCount === 1 ? "" : "s"}`
              : undefined
          }
          deltaTone={unpaidTotal > 0 ? "neg" : "neutral"}
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <OrdersDataTable
            data={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
          />
        </CardContent>
      </Card>
    </>
  );
}

function AbandonedTabContent({
  orders,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
}: {
  orders: Order[];
  pageData: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
}) {
  // Abandoned orders are typically empty-draft auto-cancels. Split by
  // whether the auto-EOD purge sweep is the likely culprit (closed
  // within last 24h with the canned reason) vs. a manual cancel of an
  // empty order, so the user can see where they're losing setup time.
  const totalAbandoned = orders.length;
  const autoAbandoned = orders.filter((o) =>
    (o.cancellationReason ?? "")
      .toLowerCase()
      .startsWith("auto-cancelled"),
  ).length;
  const manualAbandoned = totalAbandoned - autoAbandoned;
  const withTable = orders.filter((o) => !!o.tableId).length;

  return (
    <>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Ban className="h-3 w-3" />}
          label="Abandoned"
          value={totalAbandoned.toLocaleString()}
          delta="Orders never built out"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Clock className="h-3 w-3" />}
          label="Auto"
          value={autoAbandoned > 0 ? autoAbandoned.toLocaleString() : "—"}
          delta="End-of-day sweep"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Trash2 className="h-3 w-3" />}
          label="Manual"
          value={manualAbandoned > 0 ? manualAbandoned.toLocaleString() : "—"}
          delta="Cancelled with no items"
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Tied to a table"
          value={withTable > 0 ? withTable.toLocaleString() : "—"}
          delta="Likely claim auto-release"
          deltaTone="neutral"
        />
      </KpiStrip>

      <Card>
        <CardContent className="px-2 pt-6 sm:px-6">
          <AbandonedDataTable
            data={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
          />
        </CardContent>
      </Card>
    </>
  );
}

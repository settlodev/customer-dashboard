import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  Banknote,
  CircleDollarSign,
  Coins,
  Receipt,
  ReceiptText,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { columns } from "@/components/tables/orders/columns";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { listOrders } from "@/lib/actions/order-actions";
import {
  Order,
  ORDER_STATUS_FILTER_OPTIONS,
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
    (order.externalOrderId ?? "").toLowerCase().includes(needle)
  );
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const statusParam = (resolved.status ?? "") as OrderStatus | "";

  // Default to current month when no explicit range is supplied — keeps
  // the initial load bounded instead of pulling every order ever made
  // at this location.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const [orders, currentLocation] = await Promise.all([
    listOrders({
      fromDate: from,
      toDate: to,
      status: statusParam || undefined,
    }).catch((): Order[] => []),
    getCurrentLocation(),
  ]);

  // Server returns the entire matching list sorted by openedDate desc;
  // we filter free-text and page in-memory because OMS list endpoint
  // isn't paginated yet.
  const filtered = orders.filter((o) => matchesSearch(o, q));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  // KPI strip — derive from the unfiltered set so totals don't jump
  // when the user types in the search box.
  const totalOrders = orders.length;
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
  const currency = orders.find((o) => o.settlementCurrency)?.settlementCurrency ?? "TZS";

  const hasAny = totalOrders > 0;
  // The default current-month range shouldn't count as a "user filter" —
  // we want first-time locations to land on the empty state, not on a
  // populated table-shell with no rows. A URL-supplied from/to does.
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters = q !== "" || !!statusParam || !isDefaultRange;

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
        <OrdersDateFilter from={from} to={to} />
        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={5}>
              <KpiCard
                icon={<ReceiptText className="h-3 w-3" />}
                label="Orders"
                value={totalOrders.toLocaleString()}
                delta={
                  statusParam
                    ? `Filtered: ${statusParam}`
                    : "Across all statuses"
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
                <DataTable
                  columns={columns}
                  data={pageData}
                  pageCount={pageCount}
                  pageNo={page - 1}
                  searchKey="orderNumber"
                  total={total}
                  filterKey="orderStatus"
                  filterOptions={ORDER_STATUS_FILTER_OPTIONS}
                  rowClickBasePath="/orders"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="orders" />
        )}
      </PageBody>
    </PageShell>
  );
}

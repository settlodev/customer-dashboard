import { endOfMonth, format, startOfMonth } from "date-fns";
import { Ban, CircleDollarSign, ListX, Tag } from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { VoidsDataTable } from "@/components/tables/orders/voids-data-table";
import { getVoidsReport } from "@/lib/actions/order-actions";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { VOID_REASON_LABELS, type VoidReasonTally } from "@/types/orders/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
  }>;
};

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const topReason = (reasons: VoidReasonTally[]): VoidReasonTally | null =>
  reasons.length === 0
    ? null
    : reasons.reduce((max, r) => (r.count > max.count ? r : max), reasons[0]);

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  // Default to the current month — matches the other report screens.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const [report, locationSettings, staffList, tablesList] = await Promise.all([
    getVoidsReport({ fromDate: from, toDate: to }).catch(() => null),
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
  ]);

  const summary = report?.summary;
  const orders = report?.orders ?? [];
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";
  const currency = summary?.currency ?? "TZS";

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders,
      search: q,
      page,
      limit,
      staff: staffList,
      tables: tablesList,
    });

  const hasAny = orders.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters = q !== "" || !isDefaultRange;

  const voidedOrders = summary?.voidedOrders ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const voidedItems = summary?.voidedItems ?? 0;
  const voidAmount = summary?.voidAmount ?? 0;
  const top = topReason(summary?.reasons ?? []);
  const rate =
    totalOrders > 0 ? Math.round((voidedOrders / totalOrders) * 100) : 0;

  const subtitle =
    from === to
      ? `Voids on ${format(new Date(from), "MMM d, yyyy")}`
      : `Voids ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Voids" }]} />
      <PageHeader title="Voids report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Ban className="h-3 w-3" />}
                label="Voided orders"
                value={voidedOrders > 0 ? voidedOrders.toLocaleString() : "—"}
                delta={
                  totalOrders > 0
                    ? `${rate}% of ${totalOrders.toLocaleString()} orders`
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ListX className="h-3 w-3" />}
                label="Voided items"
                value={voidedItems > 0 ? voidedItems.toLocaleString() : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Void amount"
                value={voidAmount > 0 ? formatMoney(voidAmount) : "—"}
                unit={currency}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Tag className="h-3 w-3" />}
                label="Top reason"
                value={top ? VOID_REASON_LABELS[top.reason] : "—"}
                delta={
                  top && voidedItems > 0
                    ? `${Math.round((top.count / voidedItems) * 100)}% of items`
                    : undefined
                }
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <VoidsDataTable
                  data={pageData}
                  pageCount={pageCount}
                  pageNo={page - 1}
                  total={total}
                  tableMode={tableMode}
                  staffNames={staffNames}
                  tableNames={tableNames}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="voided orders" />
        )}
      </PageBody>
    </PageShell>
  );
}

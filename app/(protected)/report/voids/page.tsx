import { endOfMonth, format, startOfMonth } from "date-fns";
import { Ban, CircleDollarSign, ListX, Tag } from "lucide-react";
import { requireReportsReadAll } from "@/lib/auth-utils";

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
import { VoidsFilters } from "@/components/reports/voids/voids-filters";
import { VoidsDataTable } from "@/components/tables/orders/voids-data-table";
import { getVoidsReport } from "@/lib/actions/order-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { orderVoidedItems, summariseVoids } from "@/lib/orders/void-report";
import {
  VOID_REASON_LABELS,
  type VoidReason,
  type VoidReasonTally,
} from "@/types/orders/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
    staffId?: string;
    reason?: string;
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
  await requireReportsReadAll();
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const staffId = resolved.staffId ?? "";
  const reason = resolved.reason ?? "";

  // Default to the current month — matches the other report screens.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const [report, locationSettings, staffList, tablesList] = await Promise.all([
    getVoidsReport({ fromDate: from, toDate: to }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
  ]);

  const summary = report?.summary;
  const allOrders = report?.orders ?? [];
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";
  const currency = summary?.currency ?? "TZS";

  // Staff + reason filters apply over the full voided set; search and
  // pagination then run inside buildOrderListView.
  const orders = allOrders.filter((o) => {
    if (staffId && o.assignedTo !== staffId) return false;
    if (
      reason &&
      !orderVoidedItems(o).some((i) => i.voidReason === (reason as VoidReason))
    ) {
      return false;
    }
    return true;
  });

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders,
      search: q,
      page,
      limit,
      staff: staffList,
      tables: tablesList,
    });

  // Dropdown options come from the whole period so they stay stable as the
  // filters change; staff options are the assignees present in the voids.
  const reasonOptions = summariseVoids(allOrders).reasons.map((r) => ({
    value: r.reason as string,
    label: `${VOID_REASON_LABELS[r.reason]} (${r.count})`,
  }));
  const staffById = new Map(
    staffList.map((s): [string, string] => [s.id, s.fullName]),
  );
  const seenStaff = new Set<string>();
  const staffOptions: { value: string; label: string }[] = [];
  for (const o of allOrders) {
    if (o.assignedTo && !seenStaff.has(o.assignedTo)) {
      seenStaff.add(o.assignedTo);
      staffOptions.push({
        value: o.assignedTo,
        label: staffById.get(o.assignedTo) ?? "Unknown",
      });
    }
  }
  staffOptions.sort((a, b) => a.label.localeCompare(b.label));

  const hasAny = allOrders.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" || !isDefaultRange || staffId !== "" || reason !== "";

  // KPIs reflect the active filters; the rate denominator stays the period total.
  const rollup = summariseVoids(orders);
  const voidedOrders = rollup.voidedOrders;
  const totalOrders = summary?.totalOrders ?? 0;
  const voidedItems = rollup.voidedItems;
  const voidAmount = rollup.voidAmount;
  const top = topReason(rollup.reasons);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <VoidsFilters
            staffId={staffId}
            reason={reason}
            staffOptions={staffOptions}
            reasonOptions={reasonOptions}
          />
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

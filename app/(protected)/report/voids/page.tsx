import { endOfMonth, format, startOfMonth } from "date-fns";
import { Ban, CircleDollarSign, ListX } from "lucide-react";
import { requireReportsReadAll } from "@/lib/auth-utils";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { VoidsFilters } from "@/components/reports/voids/voids-filters";
import { VoidsTypeToggle } from "@/components/reports/voids/voids-type-toggle";
import { VoidEventsTable } from "@/components/reports/voids/voids-events-table";
import { getVoidsReport, listOrders } from "@/lib/actions/order-actions";
import { rethrowIfBoundary } from "@/lib/list-fallback";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import {
  buildVoidEvents,
  buildVoidReasonOptions,
  buildVoidStaffOptions,
  summariseVoidEvents,
  voidEventMatchesSearch,
  type VoidEventTypeFilter,
} from "@/lib/orders/void-events";
import { OrderStatus } from "@/types/orders/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
    staffId?: string;
    reason?: string;
    type?: string;
  }>;
};

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const staffId = resolved.staffId ?? "";
  const reason = resolved.reason ?? "";
  const type: VoidEventTypeFilter =
    resolved.type === "cancel" || resolved.type === "item" ? resolved.type : "";

  // Default to the current month — matches the other report screens.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  // Two sources: orders with voided line items (the /voids endpoint) and whole
  // cancelled orders (the standard list, status-filtered). Cancellations don't
  // flow through /voids, which is why they were missing from the report before.
  const [report, cancelled, staffList, tablesList] = await Promise.all([
    getVoidsReport({ fromDate: from, toDate: to }).catch((e) => {
      rethrowIfBoundary(e);
      return null;
    }),
    listOrders({
      status: OrderStatus.CANCELLED,
      fromDate: from,
      toDate: to,
    }).catch((e) => {
      rethrowIfBoundary(e);
      return [];
    }),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
  ]);

  const summary = report?.summary;
  const currency = summary?.currency ?? "TZS";
  const totalOrders = summary?.totalOrders ?? 0;

  const staffById = new Map(
    staffList.map((s): [string, string] => [s.id, s.fullName]),
  );
  const tableById = new Map(
    tablesList.map((t): [string, string] => [t.id, t.name]),
  );

  const allEvents = buildVoidEvents({
    voidedOrders: report?.orders ?? [],
    cancelledOrders: cancelled ?? [],
    staffById,
    tableById,
  });

  // Type / reason / staff filters scope the KPI set; search + pagination then
  // run over that scoped set so the KPIs track the dropdowns but not the search.
  const scoped = allEvents.filter((e) => {
    if (type === "cancel" && e.kind !== "ORDER_CANCEL") return false;
    if (type === "item" && e.kind !== "ITEM_VOID") return false;
    if (reason && e.reasonCode !== reason) return false;
    if (staffId && e.staffId !== staffId) return false;
    return true;
  });

  const needle = q.toLowerCase();
  const filtered = needle
    ? scoped.filter((e) => voidEventMatchesSearch(e, needle))
    : scoped;
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  // Dropdown options come from the whole period so they stay stable as the
  // filters change.
  const reasonOptions = buildVoidReasonOptions(allEvents);
  const staffOptions = buildVoidStaffOptions(allEvents);

  const hasAny = allEvents.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" ||
    !isDefaultRange ||
    staffId !== "" ||
    reason !== "" ||
    type !== "";

  // KPIs reflect the active type/reason/staff filters; the cancel-rate
  // denominator stays the period's total order count.
  const rollup = summariseVoidEvents(scoped);
  const rate =
    totalOrders > 0
      ? Math.round((rollup.cancelledOrders / totalOrders) * 100)
      : 0;

  const subtitle =
    from === to
      ? `Voids & cancellations on ${format(new Date(from), "MMM d, yyyy")}`
      : `Voids & cancellations ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Voids" }]} />
      <PageHeader title="Voids & cancellations" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <VoidsTypeToggle active={type} />
            <VoidsFilters
              staffId={staffId}
              reason={reason}
              staffOptions={staffOptions}
              reasonOptions={reasonOptions}
            />
          </div>
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Ban className="h-3 w-3" />}
                label="Cancelled orders"
                value={
                  rollup.cancelledOrders > 0
                    ? rollup.cancelledOrders.toLocaleString()
                    : "—"
                }
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
                value={
                  rollup.voidedItems > 0
                    ? rollup.voidedItems.toLocaleString()
                    : "—"
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Voided value"
                value={rollup.voidValue > 0 ? formatMoney(rollup.voidValue) : "—"}
                unit={currency}
                deltaTone="neg"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Cancelled value"
                value={
                  rollup.cancelledValue > 0
                    ? formatMoney(rollup.cancelledValue)
                    : "—"
                }
                unit={currency}
                deltaTone="neg"
              />
            </KpiStrip>

            <VoidEventsTable
              data={pageData}
              pageCount={pageCount}
              pageNo={page - 1}
              total={total}
            />
          </>
        ) : (
          <NoItems itemName="voids or cancellations" />
        )}
      </PageBody>
    </PageShell>
  );
}

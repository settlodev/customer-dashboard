import {
  Activity,
  CircleDollarSign,
  ListChecks,
  Undo2,
} from "lucide-react";
import { format, endOfMonth, startOfMonth } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { columns } from "@/components/tables/day-sessions/columns";
import { listDaySessions } from "@/lib/actions/day-session-list-actions";
import { getCurrentDestination } from "@/lib/actions/context";

const STATUS_FILTERS = [
  { value: "OPEN", label: "Open" },
  { value: "CLOSED", label: "Closed" },
];

interface SearchParams {
  page?: string;
  limit?: string;
  from?: string;
  to?: string;
  status?: "OPEN" | "CLOSED";
}

const todayIso = () => format(new Date(), "yyyy-MM-dd");

export default async function DaySessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the action's 0-based slice index and match the size
  // default, otherwise the pager skips a page and the "10" label undercounts.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  // Default to the calendar month so the operator lands on "this
  // month's sessions" without picking a range. The OrdersDateFilter
  // surfaces presets (today / yesterday / week / month / custom) and
  // writes the chosen range back as ?from=&to= URL params.
  const now = new Date();
  const defaultFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defaultTo = format(endOfMonth(now), "yyyy-MM-dd");
  const from = params.from ?? defaultFrom;
  const to = params.to ?? defaultTo;

  const destination = await getCurrentDestination();
  // Day sessions are location-scoped; a store/warehouse destination
  // falls back to its parent location via the cookie set by the
  // location switcher. Surface a friendly empty state when no
  // location is currently active.
  if (!destination || destination.type !== "LOCATION") {
    return (
      <PageShell>
        <PageBreadcrumbs items={[{ title: "Day sessions" }]} />
        <PageHeader
          title="Day sessions"
          subtitle="Pick a location to see its business-day timeline and Z-reports."
        />
        <PageBody>
          <NoItems itemName="day sessions" />
        </PageBody>
      </PageShell>
    );
  }
  const locationId = destination.id;

  const response = await listDaySessions({
    locationId,
    from,
    to,
    status: params.status,
    page: apiPage,
    size,
  });

  const data = response.content;
  const total = response.totalElements;
  const pageCount = response.totalPages;

  // KPIs aggregate over the visible page — same approach as Expenses.
  // Whole-range totals would mean a second round-trip; the page total
  // is what the operator actually sees in the table below it.
  const sumNet = data.reduce((s, r) => s + (r.netSales ?? 0), 0);
  const sumRefunds = data.reduce((s, r) => s + (r.refundAmount ?? 0), 0);
  const sumOrders = data.reduce((s, r) => s + (r.orderCount ?? 0), 0);
  const openCount = data.filter((r) => r.status === "OPEN").length;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Day sessions" }]} />
      <PageHeader
        title="Day sessions"
        subtitle="Every business-day open/close with sales, refunds, and Z-report drill-through."
      />
      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <OrdersDateFilter from={from} to={to} />
          <span className="text-xs text-gray-500">
            Showing {from} → {to}
          </span>
        </div>

        {total > 0 ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Net sales (page)"
                value={fmt(sumNet)}
                delta={`${data.length} session${data.length === 1 ? "" : "s"} on page`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ListChecks className="h-3 w-3" />}
                label="Orders (page)"
                value={fmt(sumOrders)}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<Undo2 className="h-3 w-3" />}
                label="Refunds (page)"
                value={fmt(sumRefunds)}
                deltaTone={sumRefunds > 0 ? "neg" : "pos"}
              />
              <KpiCard
                icon={<Activity className="h-3 w-3" />}
                label="Currently open"
                value={openCount > 0 ? String(openCount) : "—"}
                delta={openCount > 0 ? "Sessions in OPEN state" : ""}
                deltaTone={openCount > 0 ? "pos" : "neutral"}
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <DataTable
                  columns={columns}
                  data={data}
                  pageCount={pageCount}
                  defaultPageSize={size}
                  pageNo={apiPage}
                  total={total}
                  searchKey="businessDate"
                  filterKey="status"
                  filterOptions={STATUS_FILTERS}
                  rowClickBasePath="/day-sessions"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="day sessions" />
        )}
      </PageBody>
    </PageShell>
  );
}

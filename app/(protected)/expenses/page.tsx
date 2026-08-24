import Link from "next/link";
import { format } from "date-fns";
import { CalendarCheck, CircleDollarSign, Hourglass, Plus, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { columns } from "@/components/tables/expense/columns";
import { listExpenses } from "@/lib/actions/expense-actions";
import { thisMonthRange } from "@/lib/date-range";
import {
  EXPENSE_STATUS_LABELS,
  type ExpenseStatus,
  type PaymentStatus,
} from "@/types/expense/type";

const STATUS_FILTERS: { value: ExpenseStatus; label: string }[] = (
  Object.keys(EXPENSE_STATUS_LABELS) as ExpenseStatus[]
).map((s) => ({ value: s, label: EXPENSE_STATUS_LABELS[s] }));

interface SearchParams {
  page?: string;
  limit?: string;
  status?: ExpenseStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the backend's 0-based index and match the size default,
  // otherwise the pager skips a page and the "10" label undercounts the rows.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  // Default to the calendar month so the operator lands on "this month's
  // bills" without picking a range, and the first load stays bounded instead
  // of pulling every expense the business has ever recorded. The filter
  // writes the chosen range back as ?from=&to= (and drops ?page).
  const defaultRange = thisMonthRange();
  const from = params.from ?? defaultRange.from;
  const to = params.to ?? defaultRange.to;

  const response = await listExpenses({
    page: apiPage,
    size,
    status: params.status,
    paymentStatus: params.paymentStatus,
    startDate: from,
    endDate: to,
  });

  const data = response.content ?? [];
  const total = response.totalElements ?? 0;
  const pageCount = response.totalPages ?? 0;

  // Aggregate over the page so the KPI strip reflects what's on screen.
  const sumTotal = data.reduce((s, e) => s + (e.totalAmount ?? 0), 0);
  const sumOutstanding = data.reduce((s, e) => s + (e.balanceDue ?? 0), 0);
  const sumPaid = data.reduce((s, e) => s + (e.paidAmount ?? 0), 0);
  const pendingCount = data.filter((e) => e.status === "PENDING").length;
  const approvedCount = data.filter((e) => e.status === "APPROVED").length;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // The default month isn't a "user filter" — a business with no expenses at
  // all should land on the create-your-first empty state, not on "nothing
  // matched". An explicit range (or a status cut) does count.
  const isDefaultRange = !params.from && !params.to;
  const hasFilters =
    !!params.status || !!params.paymentStatus || !isDefaultRange;

  const rangeLabel =
    from === to
      ? `Bills dated ${format(new Date(from), "MMM d, yyyy")}`
      : `Bills dated ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Expenses" }]} />
      <PageHeader
        title="Expenses"
        subtitle={rangeLabel}
        actions={
          <Button asChild size="sm">
            <Link href="/expenses/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New expense
            </Link>
          </Button>
        }
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
                label="Page total"
                value={fmt(sumTotal)}
                unit={data[0]?.currencyCode ?? ""}
                delta={`${data.length} on page`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CalendarCheck className="h-3 w-3" />}
                label="Outstanding"
                value={fmt(sumOutstanding)}
                unit={data[0]?.currencyCode ?? ""}
                delta={
                  sumPaid > 0 ? `${fmt(sumPaid)} settled` : "Nothing settled"
                }
                deltaTone={sumOutstanding > 0 ? "neg" : "pos"}
              />
              <KpiCard
                icon={<Hourglass className="h-3 w-3" />}
                label="Awaiting approval"
                value={pendingCount > 0 ? String(pendingCount) : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ShieldCheck className="h-3 w-3" />}
                label="Approved on page"
                value={approvedCount > 0 ? String(approvedCount) : "—"}
                deltaTone="pos"
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
                  searchKey="description"
                  filterKey="status"
                  filterOptions={STATUS_FILTERS}
                  rowClickBasePath="/expenses"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems
            itemName="expenses"
            newItemUrl={hasFilters ? undefined : "/expenses/new"}
          />
        )}
      </PageBody>
    </PageShell>
  );
}

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
import {
  getExpensesSummary,
  listExpenses,
} from "@/lib/actions/expense-actions";
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
  search?: string;
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

  // The DataTable's search box writes ?search=; the Accounting Service matches
  // it against expense number, description and reference.
  const search = params.search?.trim() || undefined;

  const filters = {
    status: params.status,
    paymentStatus: params.paymentStatus,
    startDate: from,
    endDate: to,
    search,
  };

  // One page of rows plus the totals for the whole filtered window, in
  // parallel. The strip is a single aggregate on the Accounting Service, so it
  // costs a round trip rather than scaling with the number of bills in range.
  const [response, summary] = await Promise.all([
    listExpenses({ ...filters, page: apiPage, size }),
    getExpensesSummary(filters),
  ]);

  const data = response.content ?? [];
  const total = response.totalElements ?? 0;
  const pageCount = response.totalPages ?? 0;

  // Totals describe the selected range, not the visible page — paging no
  // longer moves the headline numbers.
  const currency = summary.currencyCode ?? "";

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // The default month isn't a "user filter" — a business with no expenses at
  // all should land on the create-your-first empty state, not on "nothing
  // matched". An explicit range, a status cut, or a search term does count.
  const isDefaultRange = !params.from && !params.to;
  const hasFilters =
    !!params.status || !!params.paymentStatus || !!search || !isDefaultRange;

  // Keep the table mounted whenever a filter is active, even with nothing to
  // show: its toolbar owns the search box and the status dropdown, and swapping
  // in the empty state would strand the operator with no way to clear the
  // search that emptied it. The table renders its own "No results." row.
  const showTable = total > 0 || hasFilters;

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

        {showTable ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Total expenses"
                value={fmt(summary.totalAmount)}
                unit={currency}
                delta={`${summary.count} bill${summary.count === 1 ? "" : "s"} in range`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CalendarCheck className="h-3 w-3" />}
                label="Outstanding"
                value={fmt(summary.outstandingAmount)}
                unit={currency}
                delta={
                  summary.paidAmount > 0
                    ? `${fmt(summary.paidAmount)} settled`
                    : "Nothing settled"
                }
                deltaTone={summary.outstandingAmount > 0 ? "neg" : "pos"}
              />
              <KpiCard
                icon={<Hourglass className="h-3 w-3" />}
                label="Awaiting approval"
                value={
                  summary.pendingCount > 0 ? String(summary.pendingCount) : "—"
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ShieldCheck className="h-3 w-3" />}
                label="Approved"
                value={
                  summary.approvedCount > 0 ? String(summary.approvedCount) : "—"
                }
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
                  searchPlaceholder="Search number, description or reference..."
                  filterKey="status"
                  filterOptions={STATUS_FILTERS}
                  manualFilter
                  rowClickBasePath="/expenses"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="expenses" newItemUrl="/expenses/new" />
        )}
      </PageBody>
    </PageShell>
  );
}

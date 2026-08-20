import { AlertTriangle, CircleDollarSign, Users } from "lucide-react";
import { format } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { columns } from "@/components/tables/debtor/columns";
import { DebtorsDateFilter } from "@/components/debtors/debtors-date-filter";
import {
  getArBalanceSummary,
  listArBalances,
} from "@/lib/actions/customer-ar-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

interface SearchParams {
  page?: string;
  limit?: string;
  minOutstanding?: string;
  from?: string;
  to?: string;
}

export default async function DebtorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the backend's 0-based index and match the size default.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;
  const minOutstanding = Number(params.minOutstanding) || 0;

  // Unlike the sales report, debtors defaults to NO range: it's a collections
  // view, and scoping it to the current month by default would hide the aged
  // debt the screen exists to chase. The range filters on when the debt
  // originated (oldestUnsettledAt), the same anchor the aging buckets use.
  const from = params.from ?? "";
  const to = params.to ?? "";
  const range =
    from || to ? { from: from || undefined, to: to || undefined } : undefined;

  const location = await getCurrentLocation();

  // The KPI figures come from a whole-set aggregate rather than a sum over
  // `data` — a page-local sum silently understates every total as soon as a
  // location has more debtors than fit on one page.
  const [response, summary] = location?.id
    ? await Promise.all([
        listArBalances(location.id, minOutstanding, apiPage, size, range),
        getArBalanceSummary(location.id, minOutstanding, range),
      ])
    : [null, null];

  const data = response?.content ?? [];
  const total = summary?.customerCount ?? response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;
  const currency = summary?.currency ?? data[0]?.currency ?? "";

  const fmtNum = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtDay = (d: string) => format(new Date(d), "MMM d, yyyy");

  const subtitle = range
    ? `Customer A/R — debt first unpaid ${
        from && to
          ? from === to
            ? `on ${fmtDay(from)}`
            : `${fmtDay(from)} – ${fmtDay(to)}`
          : from
            ? `from ${fmtDay(from)}`
            : `up to ${fmtDay(to)}`
      }.`
    : "Customer A/R — outstanding charges per location, aged.";

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Debtors" }]} />
      <PageHeader
        title="Debtors"
        subtitle={subtitle}
        actions={<DebtorsDateFilter from={from} to={to} />}
      />
      <PageBody>
        <KpiStrip cols={4}>
          <KpiCard
            icon={<CircleDollarSign className="h-3 w-3" />}
            label="Total outstanding"
            value={fmtNum(summary?.totalOutstanding ?? 0)}
            unit={currency}
            deltaTone="neg"
            tooltip="Every debtor matching the current filter, not just this page."
          />
          <KpiCard
            icon={<Users className="h-3 w-3" />}
            label="Customers with balance"
            value={fmtNum(total)}
            tooltip="Customers carrying an outstanding balance at this location."
          />
          <KpiCard
            icon={<AlertTriangle className="h-3 w-3" />}
            label="Overdue customers"
            value={fmtNum(summary?.overdueCount ?? 0)}
            deltaTone={(summary?.overdueCount ?? 0) > 0 ? "neg" : "pos"}
            tooltip="Debtors past the CURRENT aging bucket — oldest unpaid charge is more than a day old."
          />
          <KpiCard
            icon={<CircleDollarSign className="h-3 w-3" />}
            label="Overdue amount"
            value={fmtNum(summary?.overdueOutstanding ?? 0)}
            unit={currency}
            deltaTone={(summary?.overdueOutstanding ?? 0) > 0 ? "neg" : "pos"}
            tooltip="Outstanding balance held by overdue debtors."
          />
        </KpiStrip>

        {data.length === 0 ? (
          <NoItems itemName="customer balances" />
        ) : (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                defaultPageSize={size}
                pageNo={apiPage}
                total={response?.totalElements ?? 0}
                searchKey="customerName"
                hideSearch
              />
            </CardContent>
          </Card>
        )}
      </PageBody>
    </PageShell>
  );
}

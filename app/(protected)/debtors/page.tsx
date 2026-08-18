import { CircleDollarSign, Users } from "lucide-react";

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
import { listArBalances } from "@/lib/actions/customer-ar-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

interface SearchParams {
  page?: string;
  limit?: string;
  minOutstanding?: string;
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

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listArBalances(location.id, minOutstanding, apiPage, size)
    : null;

  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;

  const totalOutstanding = data.reduce(
    (s, c) => s + (c.outstandingBalance ?? 0),
    0,
  );
  const overdue = data.filter(
    (c) => c.agingBucket !== "CURRENT" && c.outstandingBalance > 0,
  ).length;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Debtors" }]} />
      <PageHeader
        title="Debtors"
        subtitle="Customer A/R — outstanding charges per location, aged."
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems itemName="customer balances" />
        ) : (
          <>
            <KpiStrip cols={3}>
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Total outstanding"
                value={fmt(totalOutstanding)}
                unit={data[0]?.currency ?? ""}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Users className="h-3 w-3" />}
                label="Customers with balance"
                value={String(total)}
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Overdue (on page)"
                value={String(overdue)}
                deltaTone={overdue > 0 ? "neg" : "pos"}
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
                  searchKey="customerName"
                  hideSearch
                />
              </CardContent>
            </Card>
          </>
        )}
      </PageBody>
    </PageShell>
  );
}

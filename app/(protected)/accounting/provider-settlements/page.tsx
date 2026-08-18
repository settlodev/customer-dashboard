import { CircleDollarSign, Landmark } from "lucide-react";

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
import { columns } from "@/components/tables/provider-settlement/columns";
import { listProviderSettlementBalances } from "@/lib/actions/provider-settlement-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default async function ProviderSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  // DataTable writes a 1-based `?page` and defaults its rows-per-page control
  // to 10 — convert to the backend's 0-based index and match the size default.
  const pageParam = Math.max(1, Number(params.page) || 1);
  const apiPage = pageParam - 1;
  const size = Number(params.limit) || DEFAULT_PAGE_SIZE;

  const location = await getCurrentLocation();
  const response = location?.id
    ? await listProviderSettlementBalances(location.id, apiPage, size)
    : null;
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;
  const sumOnPage = data.reduce((s, b) => s + (b.outstandingBalance ?? 0), 0);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Provider settlements" }]}
      />
      <PageHeader
        title="Provider settlements"
        subtitle="What each payment provider still owes you, and record their payouts."
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems itemName="provider settlements" />
        ) : (
          <>
            <KpiStrip cols={2}>
              <KpiCard
                icon={<Landmark className="h-3 w-3" />}
                label="Providers with balance"
                value={String(data.length)}
                delta={`of ${total} total`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Outstanding on page"
                value={fmt(sumOnPage)}
                unit={data[0]?.currency ?? ""}
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
                  searchKey="paymentMethodCode"
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

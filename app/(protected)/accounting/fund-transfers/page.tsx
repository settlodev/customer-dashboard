import Link from "next/link";
import { ArrowRightLeft, CircleDollarSign, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { columns } from "@/components/tables/fund-transfer/columns";
import { listFundTransfers } from "@/lib/actions/fund-transfer-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";

const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default async function FundTransfersPage({
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
    ? await listFundTransfers(location.id, apiPage, size)
    : null;
  const data = response?.content ?? [];
  const total = response?.totalElements ?? 0;
  const pageCount = response?.totalPages ?? 0;
  const sumOnPage = data.reduce((s, t) => s + (t.amount ?? 0), 0);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[{ title: "Accounting" }, { title: "Fund transfers" }]}
      />
      <PageHeader
        title="Fund transfers"
        subtitle="Move money between asset accounts — auto-posts a balanced JE."
        actions={
          <Button asChild size="sm">
            <Link href="/accounting/fund-transfers/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New transfer
            </Link>
          </Button>
        }
      />
      <PageBody>
        {data.length === 0 ? (
          <NoItems
            itemName="fund transfers"
            newItemUrl="/accounting/fund-transfers/new"
          />
        ) : (
          <>
            <KpiStrip cols={2}>
              <KpiCard
                icon={<ArrowRightLeft className="h-3 w-3" />}
                label="Transfers (page)"
                value={String(data.length)}
                delta={`of ${total} total`}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Volume on page"
                value={fmt(sumOnPage)}
                unit={data[0]?.currencyCode ?? ""}
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
                  searchKey="transferDate"
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

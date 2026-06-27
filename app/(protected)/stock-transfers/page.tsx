import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-transfer/column";
import { searchStockTransfers } from "@/lib/actions/stock-transfer-actions";
import { softFetch } from "@/lib/list-fallback";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getStockTransferKpi } from "@/lib/actions/reports-analytics-actions";
import { StockTransferKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;

  const [responseData, location] = await Promise.all([
    softFetch(searchStockTransfers(page ? page - 1 : 0, pageLimit)),
    getCurrentLocation(),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getStockTransferKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Transfers" }]} />
      <PageHeader
        title="Stock Transfers"
        subtitle="Move stock between locations, stores, and warehouses."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/stock-transfers/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New Transfer
              </Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="stock transfers" />
        ) : total > 0 ? (
          <>
            <StockTransferKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="transferNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
            />
          </>
        ) : (
          <NoItems newItemUrl="/stock-transfers/new" itemName="stock transfers" />
        )}
      </PageBody>
    </PageShell>
  );
}

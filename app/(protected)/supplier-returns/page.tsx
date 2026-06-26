import Link from "next/link";
import { Plus } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import NoItems from "@/components/layouts/no-items";
import DataLoadError from "@/components/layouts/data-load-error";
import { DataTable } from "@/components/tables/data-table";
import {
  columns,
  SupplierReturnRow,
} from "@/components/tables/supplier-return/columns";
import { getSupplierReturns } from "@/lib/actions/supplier-return-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getSupplierReturnKpi } from "@/lib/actions/reports-analytics-actions";
import { softFetch } from "@/lib/list-fallback";
import { SupplierReturnKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { SupplierReturnStatus } from "@/types/supplier-return/type";

const STATUS_VALUES: SupplierReturnStatus[] = [
  "DRAFT",
  "CONFIRMED",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
];

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const status = STATUS_VALUES.find((s) => s === resolvedParams.status);

  const [responseData, suppliers, location] = await Promise.all([
    softFetch(getSupplierReturns(page ? page - 1 : 0, pageLimit, status)),
    fetchAllSuppliers(),
    getCurrentLocation(),
  ]);
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: SupplierReturnRow[] = (responseData?.content ?? []).map((r) => ({
    ...r,
    supplierName: supplierMap[r.supplierId] ?? null,
  }));
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getSupplierReturnKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Supplier Returns" }]} />
      <PageHeader
        title="Supplier Returns"
        subtitle="Send goods back to suppliers — track dispatch, completion, and credit notes."
        actions={
          <Button asChild size="sm">
            <Link href="/supplier-returns/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Return
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="supplier returns" />
        ) : total > 0 || status ? (
          <>
            <SupplierReturnKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="returnNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              }))}
            />
          </>
        ) : (
          <NoItems
            newItemUrl="/supplier-returns/new"
            itemName="supplier returns"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

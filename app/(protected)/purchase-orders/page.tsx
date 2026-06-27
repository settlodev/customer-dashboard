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
import { columns, LpoRow } from "@/components/tables/lpo/columns";
import { getLpos } from "@/lib/actions/lpo-actions";
import { softFetch } from "@/lib/list-fallback";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getPurchaseOrderKpi } from "@/lib/actions/reports-analytics-actions";
import { PurchaseOrderKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { LpoStatus } from "@/types/lpo/type";

const STATUS_VALUES: LpoStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
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

  // Same shape as the products page: chain the KPI fetch off the location
  // promise so it joins the parallel Promise.all instead of being awaited
  // sequentially after.
  const locationPromise = getCurrentLocation();
  const kpiPromise = locationPromise.then((loc) =>
    loc?.id ? getPurchaseOrderKpi(loc.id).catch(() => null) : null,
  );

  const [responseData, suppliers, location, kpi] = await Promise.all([
    softFetch(getLpos(page ? page - 1 : 0, pageLimit, status)),
    fetchAllSuppliers(),
    locationPromise,
    kpiPromise,
  ]);

  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.id, s.name]));

  const data: LpoRow[] = (responseData?.content ?? []).map((l) => ({
    ...l,
    supplierName: supplierMap[l.supplierId] ?? null,
  }));
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Purchase Orders" }]} />
      <PageHeader
        title="Purchase Orders"
        subtitle="Local purchase orders sent to suppliers — track approval, receipt, and reconciliation."
        actions={
          <Button asChild size="sm">
            <Link href="/purchase-orders/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Purchase Order
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="purchase orders" />
        ) : total > 0 || status ? (
          <>
            <PurchaseOrderKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="lpoNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              defaultPageSize={pageLimit}
              disableArchive
              filterKey="status"
              filterOptions={STATUS_VALUES.map((s) => ({
                value: s,
                label: s.replace("_", " "),
              }))}
            />
          </>
        ) : (
          <NoItems
            newItemUrl="/purchase-orders/new"
            itemName="purchase orders"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

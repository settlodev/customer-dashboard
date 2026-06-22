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
import { columns } from "@/components/tables/requisition/columns";
import { getRequisitions } from "@/lib/actions/requisition-actions";
import { softFetch } from "@/lib/list-fallback";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getPurchaseRequisitionKpi } from "@/lib/actions/reports-analytics-actions";
import { PurchaseRequisitionKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import type { RequisitionStatus } from "@/types/requisition/type";

const STATUS_VALUES: RequisitionStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "CONVERTED_TO_LPO",
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

  const [responseData, location] = await Promise.all([
    softFetch(getRequisitions(page ? page - 1 : 0, pageLimit, status)),
    getCurrentLocation(),
  ]);

  const data = responseData?.content ?? [];
  const total = responseData?.totalElements ?? 0;
  const pageCount = responseData?.totalPages ?? 0;

  const kpi = location?.id ? await getPurchaseRequisitionKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Purchase Requisitions" }]} />
      <PageHeader
        title="Purchase Requisitions"
        subtitle="Internal requests for stock — submit, approve, then convert to LPOs."
        actions={
          <Button asChild size="sm">
            <Link href="/purchase-requisitions/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Requisition
            </Link>
          </Button>
        }
      />
      <PageBody>
        {!responseData ? (
          <DataLoadError itemName="purchase requisitions" />
        ) : total > 0 || status ? (
          <>
            <PurchaseRequisitionKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="requisitionNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
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
            newItemUrl="/purchase-requisitions/new"
            itemName="purchase requisitions"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

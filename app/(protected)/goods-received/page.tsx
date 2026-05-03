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
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/grn/columns";
import { getGrns } from "@/lib/actions/grn-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getGrnKpi } from "@/lib/actions/reports-analytics-actions";
import { GrnKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";

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
    getGrns(page ? page - 1 : 0, pageLimit),
    getCurrentLocation(),
  ]);
  const data = responseData.content ?? [];
  const total = responseData.totalElements ?? 0;
  const pageCount = responseData.totalPages ?? 0;

  const kpi = location?.id ? await getGrnKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Goods Received" }]} />
      <PageHeader
        title="Goods Received"
        subtitle="Receipt notes against purchase orders — verify, accept, and post stock."
        actions={
          <Button asChild size="sm">
            <Link href="/goods-received/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New GRN
            </Link>
          </Button>
        }
      />
      <PageBody>
        {total > 0 ? (
          <>
            <GrnKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="grnNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
            />
          </>
        ) : (
          <NoItems
            newItemUrl="/goods-received/new"
            itemName="goods received notes"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

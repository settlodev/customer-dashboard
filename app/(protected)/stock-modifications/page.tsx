import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getStockModificationKpi } from "@/lib/actions/reports-analytics-actions";
import { StockModificationKpiStrip } from "@/components/widgets/inventory/stock-management-kpi-strips";
import { Plus } from "lucide-react";
import {
  MODIFICATION_CATEGORY_OPTIONS,
  ModificationCategory,
} from "@/types/stock-modification/type";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    category?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const category = MODIFICATION_CATEGORY_OPTIONS.some(
    (o) => o.value === resolvedParams.category,
  )
    ? (resolvedParams.category as ModificationCategory)
    : undefined;

  const [responseData, location] = await Promise.all([
    searchStockModifications(page ? page - 1 : 0, pageLimit, category),
    getCurrentLocation(),
  ]);

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  const kpi = location?.id ? await getStockModificationKpi(location.id) : null;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Modifications" }]} />
      <PageHeader
        title="Stock Modifications"
        subtitle="Adjust stock for damages, losses, write-offs, and reclassifications."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/stock-modifications/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Modify Stock
              </Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {total > 0 || category ? (
          <>
            <StockModificationKpiStrip summary={kpi} />
            <DataTable
              columns={columns}
              data={data}
              searchKey="modificationNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              disableArchive
              rowClickBasePath="/stock-modifications"
              filterKey="category"
              filterOptions={MODIFICATION_CATEGORY_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
            />
          </>
        ) : (
          <NoItems newItemUrl="/stock-modifications/new" itemName="stock modifications" />
        )}
      </PageBody>
    </PageShell>
  );
}

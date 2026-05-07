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
import { columns } from "@/components/tables/stock-usage/column";
import { searchStockUsages } from "@/lib/actions/stock-usage-actions";
import { Plus } from "lucide-react";
import {
  STOCK_USAGE_TYPE_OPTIONS,
  StockUsageType,
} from "@/types/stock-usage/type";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    usageType?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 0;
  const pageLimit = Number(resolvedParams.limit) || 20;
  const usageType = STOCK_USAGE_TYPE_OPTIONS.some(
    (o) => o.value === resolvedParams.usageType,
  )
    ? (resolvedParams.usageType as StockUsageType)
    : undefined;

  const responseData = await searchStockUsages(
    page ? page - 1 : 0,
    pageLimit,
    usageType,
  );

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Usage" }]} />
      <PageHeader
        title="Stock Usage"
        subtitle="Record internal stock consumption — staff meals, samples, training, marketing, and maintenance."
        actions={
          <Button asChild size="sm">
            <Link href="/stock-usages/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Record Usage
            </Link>
          </Button>
        }
      />
      <PageBody>
        {total > 0 || usageType ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="usageNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            rowClickBasePath="/stock-usages"
            filterKey="usageType"
            filterOptions={STOCK_USAGE_TYPE_OPTIONS.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
          />
        ) : (
          <NoItems newItemUrl="/stock-usages/new" itemName="stock usage" />
        )}
      </PageBody>
    </PageShell>
  );
}

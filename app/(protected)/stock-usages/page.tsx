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
  USAGE_CATEGORY_OPTIONS,
  USAGE_STATUS_OPTIONS,
  type UsageCategory,
  type UsageStatus,
  type StockUsageFilters,
} from "@/types/stock-usage/type";

type Params = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    category?: string;
    status?: string;
    departmentId?: string;
    recipientId?: string;
    performedBy?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const page = Number(resolved.page) || 0;
  const pageLimit = Number(resolved.limit) || 20;

  const category = USAGE_CATEGORY_OPTIONS.some(
    (o) => o.value === resolved.category,
  )
    ? (resolved.category as UsageCategory)
    : undefined;
  const status = USAGE_STATUS_OPTIONS.some((o) => o.value === resolved.status)
    ? (resolved.status as UsageStatus)
    : undefined;

  const filters: StockUsageFilters = {
    category,
    status,
    departmentId: resolved.departmentId || undefined,
    recipientId: resolved.recipientId || undefined,
    performedBy: resolved.performedBy || undefined,
    from: resolved.from || undefined,
    to: resolved.to || undefined,
  };

  const responseData = await searchStockUsages(
    page ? page - 1 : 0,
    pageLimit,
    filters,
  );

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  const hasActiveFilter =
    !!(
      filters.category ||
      filters.status ||
      filters.departmentId ||
      filters.recipientId ||
      filters.performedBy ||
      filters.from ||
      filters.to
    );

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Usage" }]} />
      <PageHeader
        title="Stock Usage"
        subtitle="Record internal stock consumption — staff meals, samples, training, marketing, maintenance and more."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/stock-usages/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Record Usage
              </Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {total > 0 || hasActiveFilter ? (
          <DataTable
            columns={columns}
            data={data}
            searchKey="usageNumber"
            pageNo={page}
            total={total}
            pageCount={pageCount}
            disableArchive
            rowClickBasePath="/stock-usages"
            filterKey="category"
            filterOptions={USAGE_CATEGORY_OPTIONS.map((o) => ({
              label: o.label,
              value: o.value,
            }))}
            extraFilters={[
              {
                key: "status",
                label: "Status",
                options: USAGE_STATUS_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                })),
              },
            ]}
          />
        ) : (
          <NoItems newItemUrl="/stock-usages/new" itemName="stock usage" />
        )}
      </PageBody>
    </PageShell>
  );
}

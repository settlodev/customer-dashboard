import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { Plus } from "lucide-react";
import {
  MODIFICATION_CATEGORY_OPTIONS,
  ModificationCategory,
} from "@/types/stock-modification/type";

const breadcrumbItems = [{ title: "Stock Modifications", link: "/stock-modifications" }];

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

  const responseData = await searchStockModifications(
    page ? page - 1 : 0,
    pageLimit,
    category,
  );

  const data = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />
        <Button asChild>
          <Link href="/stock-modifications/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Modify Stock
          </Link>
        </Button>
      </div>

      {total > 0 || category ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="modificationNumber"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              filterKey="category"
              filterOptions={MODIFICATION_CATEGORY_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-modifications/new" itemName="stock modifications" />
      )}
    </div>
  );
}

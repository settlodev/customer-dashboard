import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/warehouse/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { StockModification } from "@/types/stock-modification/type";
import { searchStockModificationsInWarehouse } from "@/lib/actions/warehouse/stock-modification-actions";

const breadCrumbItems = [
  {
    title: "Warehouse Stock Modification",
    link: "/warehouse-stock-modifications",
  },
];
type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};
async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchStockModificationsInWarehouse(
    q,
    page,
    pageLimit,
  );

  const data: StockModification[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6 mt-10">
      <div className="flex items-center justify-between mb-2 p-4">
        <div className="relative flex-1 md:max-w-md">
          <BreadcrumbsNav items={breadCrumbItems} />
        </div>
        <div className={`flex items-center space-x-2`}>
          <Button>
            <Link href={`/warehouse-stock-modifications/new`}>
              Modify Stock Item{" "}
            </Link>
          </Button>
        </div>
      </div>
      {total > 0 || q != "" ? (
        <Card x-chunk="data-table">
          <CardHeader>
            <CardTitle>Stock Modifications</CardTitle>
            <CardDescription>Modify stock in your warehouse</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={data}
              searchKey="stockVariantName"
              pageNo={page}
              total={total}
              pageCount={pageCount}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems
          newItemUrl={`/warehouse-stock-modifications/new`}
          itemName={`Stock Modifications`}
        />
      )}
    </div>
  );
}

export default Page;

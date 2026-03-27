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
import { columns } from "@/components/tables/stock-modification/column";
import { searchStockModifications } from "@/lib/actions/stock-modification-actions";
import { StockModification } from "@/types/stock-modification/type";
import { Plus } from "lucide-react";

const breadCrumbItems = [
  { title: "Stock Modification", link: "/stock-modifications" },
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

  const responseData = await searchStockModifications(q, page, pageLimit);

  const data: StockModification[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 px-4 lg:px-8 mt-1">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2 pt-4">
        <BreadcrumbsNav items={breadCrumbItems} />

        <div className="self-end sm:self-auto">
          <Button asChild>
            <Link href="/stock-modifications/new">
              <Plus className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Modify Stock Item</span>
            </Link>
          </Button>
        </div>
      </div>

      {total > 0 || q !== "" ? (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle>Stock Modifications</CardTitle>
            <CardDescription>
              Modify stock in your business location
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
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
          newItemUrl="/stock-modifications/new"
          itemName="Stock Modifications"
        />
      )}
    </div>
  );
}

export default Page;

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
import { columns } from "@/components/tables/stock-intake/column";
import { searchStockIntakes } from "@/lib/actions/stock-intake-actions";
import { StockIntake } from "@/types/stock-intake/type";

const breadCrumbItems = [{ title: "Stock Intake", link: "/stock-intakes" }];

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

  const responseData = await searchStockIntakes(q, page, pageLimit);
  const data: StockIntake[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadCrumbItems} />

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/stock-intakes/new">Record intake</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {total > 0 || q !== "" ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Stock Intake</CardTitle>
            <CardDescription>
              Record stock intake in your location
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="stockAndStockVariantName"
              pageNo={page}
              total={total}
              pageCount={pageCount}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stock-intakes/new" itemName="Stock intakes" />
      )}
    </div>
  );
}

export default Page;

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/stock-variants/column";
import { searchStockVariants } from "@/lib/actions/stock-variant-actions";
import { StockVariant } from "@/types/stockVariant/type";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import {
  Plus,
  ArrowDownToLine,
  FileSignature,
  ArrowLeftRight,
} from "lucide-react";

const breadcrumbItems = [{ title: "Stock Items", link: "/stock-variants" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function StockVariantPage({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchStockVariants(q, page, pageLimit);

  const data: StockVariant[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-intakes/new">
              <ArrowDownToLine className="mr-1.5 h-4 w-4" />
              Intake
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-modifications/new">
              <FileSignature className="mr-1.5 h-4 w-4" />
              Modify
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/stock-transfers/new">
              <ArrowLeftRight className="mr-1.5 h-4 w-4" />
              Transfer
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/stocks/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Stock
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="stockAndStockVariantName"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              rowClickBasePath="/stock-variants"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/stocks/new" itemName="stock items" />
      )}
    </div>
  );
}

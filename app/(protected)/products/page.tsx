import { Button } from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Card, CardContent } from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import { DataTable } from "@/components/tables/data-table";
import { columns } from "@/components/tables/product/column";
import { Product } from "@/types/product/type";
import { productSummary, searchProducts } from "@/lib/actions/product-actions";
import { ProductCSVDialog } from "@/components/csv/CSVImport";
import { Plus } from "lucide-react";
import ProductSummary from "@/components/widgets/products/product-summary";
import TableExport from "@/components/widgets/export";

const breadCrumbItems = [{ title: "Products", link: "/products" }];

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

  const [responseData, summaryData] = await Promise.all([
    searchProducts(q, page, pageLimit),
    productSummary(),
  ]);

  const filteredData: Product[] = responseData.content.filter(
    (product) => !product.isArchived,
  );

  console.log("The products are", filteredData);

  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadCrumbItems} />

        <div className="flex items-center gap-2">
          <TableExport filename="products" useEndpoint />
          <ProductCSVDialog />
          <Button asChild>
            <Link href="/products/new/edit">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary */}
      <ProductSummary data={summaryData} />

      {/* Content */}
      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={filteredData}
              searchKey="name"
              pageNo={page}
              total={total}
              pageCount={pageCount}
              rowClickBasePath="/products"
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/products/new/edit" itemName="products" />
      )}
    </div>
  );
}

export default Page;

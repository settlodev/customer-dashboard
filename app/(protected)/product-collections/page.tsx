import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/product-collection/column";
import { searchProductCollections } from "@/lib/actions/product-collection-actions";
import { ProductCollection } from "@/types/product-collection/type";
import { Plus } from "lucide-react";

const breadcrumbItems = [{ title: "Collections", link: "/product-collections" }];

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);

  const responseData = await searchProductCollections(q, page, pageLimit);

  const data: ProductCollection[] = responseData.content;
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbsNav items={breadcrumbItems} />

        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/product-collections/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Collection
            </Link>
          </Button>
        </div>
      </div>

      {total > 0 || q !== "" ? (
        <Card>
          <CardContent className="px-2 sm:px-6 pt-6">
            <DataTable
              columns={columns}
              data={data}
              searchKey="name"
              pageNo={page}
              total={total}
              pageCount={pageCount}
            />
          </CardContent>
        </Card>
      ) : (
        <NoItems newItemUrl="/product-collections/new" itemName="product collections" />
      )}
    </div>
  );
}

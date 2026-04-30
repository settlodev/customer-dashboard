import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { StatusTabs } from "@/components/layouts/status-tabs";
import { parseListStatus } from "@/components/layouts/list-status";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/product-collection/column";
import { searchProductCollections } from "@/lib/actions/product-collection-actions";
import { ProductCollection } from "@/types/product-collection/type";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = resolvedSearchParams.search || "";
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit);
  const status = parseListStatus(resolvedSearchParams.status);

  const responseData = await searchProductCollections(q, page, pageLimit);

  const data: ProductCollection[] = responseData.content.filter((c) =>
    status === "archived" ? c.archivedAt != null : c.archivedAt == null,
  );
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Collections" }]} />
      <PageHeader
        title="Collections"
        subtitle="Curated bundles of products."
        actions={
          <Button asChild>
            <Link href="/product-collections/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Collection
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/product-collections" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
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
          <NoItems
            newItemUrl="/product-collections/new"
            itemName="product collections"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

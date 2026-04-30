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
import { columns } from "@/components/tables/category/columns";
import { searchCategories } from "@/lib/actions/category-actions";
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

  const responseData = await searchCategories(q, page, pageLimit);
  // Mirrors the products list: filter the server-paginated page
  // client-side. Counts may drift slightly per-page, but this matches
  // the rest of the inventory section so the UX is coherent.
  const data = responseData.content.filter((c) =>
    status === "archived" ? c.archivedAt != null : c.archivedAt == null,
  );
  const total = responseData.totalElements;
  const pageCount = responseData.totalPages;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Categories" }]} />
      <PageHeader
        title="Categories"
        subtitle="Group products into navigable categories."
        actions={
          <Button asChild>
            <Link href="/categories/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        }
      />

      <PageBody>
        <StatusTabs basePath="/categories" value={status} />

        {total > 0 || q !== "" ? (
          <Card>
            <CardContent className="px-2 pt-6 sm:px-6">
              <DataTable
                columns={columns}
                data={data}
                pageCount={pageCount}
                pageNo={page}
                searchKey="name"
                total={total}
              />
            </CardContent>
          </Card>
        ) : (
          <NoItems itemName="categories" newItemUrl="/categories/new" />
        )}
      </PageBody>
    </PageShell>
  );
}

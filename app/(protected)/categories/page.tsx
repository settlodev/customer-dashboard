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
import { fetchCategoriesHierarchical } from "@/lib/actions/category-actions";
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

  const q = (resolvedSearchParams.search || "").trim().toLowerCase();
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit) || 10;
  const status = parseListStatus(resolvedSearchParams.status);

  // Children must sit directly under their parent in the rendered list,
  // so we need the whole set in one shot — server-side pagination would
  // split a parent from its descendants. The upstream cap is 200, which
  // matches the form selectors.
  const ordered = await fetchCategoriesHierarchical();

  const statusFiltered = ordered.filter((c) =>
    status === "archived" ? c.archivedAt != null : c.archivedAt == null,
  );

  const filtered = q
    ? statusFiltered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.parentName?.toLowerCase().includes(q) ?? false),
      )
    : statusFiltered;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageLimit));
  const startIdx = (page > 0 ? page - 1 : 0) * pageLimit;
  const data = filtered.slice(startIdx, startIdx + pageLimit);

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
                rowClickBasePath="/categories"
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

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
import { DepartmentFilter } from "@/components/tables/category/department-filter";
import { fetchCategoriesHierarchical } from "@/lib/actions/category-actions";
import { Plus } from "lucide-react";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    department?: string;
    sort?: string;
    dir?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams.search || "").trim().toLowerCase();
  const page = Number(resolvedSearchParams.page) || 0;
  const pageLimit = Number(resolvedSearchParams.limit) || 10;
  const status = parseListStatus(resolvedSearchParams.status);
  const department = (resolvedSearchParams.department || "").trim();
  // Only the two displayed columns are orderable; anything else falls back
  // to the default hierarchical order.
  const sort =
    resolvedSearchParams.sort === "name" ||
    resolvedSearchParams.sort === "departmentName"
      ? resolvedSearchParams.sort
      : null;
  const dir = resolvedSearchParams.dir === "desc" ? "desc" : "asc";

  // Children must sit directly under their parent in the rendered list,
  // so we need the whole set in one shot — server-side pagination would
  // split a parent from its descendants. The upstream cap is 200, which
  // matches the form selectors.
  const ordered = await fetchCategoriesHierarchical();

  // Department filter options come from the categories themselves (deduped
  // by id) so the dropdown only offers departments that actually have
  // categories. Built off the full set so the choices stay stable across
  // the active/archived tabs and any active filter. Names can lag the
  // cross-service mirror — skip the unresolved ones rather than show a
  // blank option.
  const departmentOptions = Array.from(
    ordered
      .reduce((map, c) => {
        if (c.departmentId && c.departmentName && !map.has(c.departmentId)) {
          map.set(c.departmentId, c.departmentName);
        }
        return map;
      }, new Map<string, string>())
      .entries(),
  )
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  let rows = ordered.filter((c) =>
    status === "archived" ? c.archivedAt != null : c.archivedAt == null,
  );

  if (department) {
    rows = rows.filter((c) => c.departmentId === department);
  }

  if (q) {
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.parentName?.toLowerCase().includes(q) ?? false),
    );
  }

  // An explicit column sort takes precedence over the hierarchy: children
  // get ordered alongside everything else (their parent still shows in the
  // row's "in …" sub-label). Without a sort param the depth-first order
  // from fetchCategoriesHierarchical is preserved.
  if (sort) {
    rows = [...rows].sort((a, b) => {
      const av = (sort === "departmentName" ? a.departmentName : a.name) ?? "";
      const bv = (sort === "departmentName" ? b.departmentName : b.name) ?? "";
      const cmp = av.localeCompare(bv, undefined, { sensitivity: "base" });
      return dir === "desc" ? -cmp : cmp;
    });
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageLimit));
  const startIdx = (page > 0 ? page - 1 : 0) * pageLimit;
  const data = rows.slice(startIdx, startIdx + pageLimit);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusTabs basePath="/categories" value={status} />
          <DepartmentFilter options={departmentOptions} />
        </div>

        {total > 0 || q !== "" || department !== "" ? (
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

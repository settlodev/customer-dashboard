import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { columns } from "@/components/tables/stock-category/columns";
import { fetchAllStockCategories } from "@/lib/actions/stock-category-actions";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const sp = await searchParams;
  const q = (sp.search || "").trim().toLowerCase();
  const page = Number(sp.page) || 0;
  const pageLimit = Number(sp.limit) || 10;

  // The list is small (one flat set per location) and the backend endpoint is
  // unpaged, so filter and page client-side rather than adding server paging
  // for a handful of rows.
  const all = await fetchAllStockCategories();
  const filtered = q
    ? all.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q),
      )
    : all;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Stock Categories" }]} />
      <PageHeader
        title="Stock Categories"
        subtitle="Group your stock items for filtering and reporting"
        actions={
          <Button asChild>
            <Link href="/stock-categories/new">
              <Plus className="mr-2 h-4 w-4" /> New Stock Category
            </Link>
          </Button>
        }
      />

      <PageBody>
        {all.length > 0 || q !== "" ? (
          <DataTable
            columns={columns}
            data={filtered}
            searchKey="name"
            searchPlaceholder="Search stock categories…"
            pageNo={page}
            total={filtered.length}
            pageCount={Math.max(1, Math.ceil(filtered.length / pageLimit))}
          />
        ) : (
          <NoItems
            newItemUrl="/stock-categories/new"
            itemName="stock categories"
          />
        )}
      </PageBody>
    </PageShell>
  );
}

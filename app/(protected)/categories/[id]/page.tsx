import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/category/type";
import { getCategory } from "@/lib/actions/category-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getCategoryItemSales } from "@/lib/actions/category-sales-actions";
import { CategoryDetailView } from "./category-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{
  tab?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}>;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const resolved = await searchParams;
  const tab = resolved.tab;

  // Adding a category is a sibling route now that /categories/[id] is a detail
  // view; bounce there if someone hits it through the dynamic segment.
  if (id === "new") redirect("/categories/new");

  let category: Category | null = null;
  try {
    category = await getCategory(id);
    if (!category) notFound();
  } catch {
    notFound();
  }

  // Sales period — defaults to the current month, matching the report hub. The
  // category's items are aggregated + paginated by the Reports Service (from
  // the current catalog taxonomy), so the browser only loads the current page.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const pageNo = Number(resolved.page) || 1; // 1-based in the URL
  const limit = Number(resolved.limit) || 10;

  const [currency, sales] = await Promise.all([
    getLocationCurrency().catch(() => "TZS"),
    getCategoryItemSales({
      categoryId: id,
      from,
      to,
      page: pageNo - 1,
      size: limit,
      sort: resolved.sort,
      search: resolved.search,
    }),
  ]);

  const statusLabel =
    category.archivedAt != null
      ? "Archived"
      : category.active
        ? "Active"
        : "Inactive";
  const statusClass =
    category.archivedAt != null
      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      : category.active
        ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
  const subtitleParts = [category.departmentName, category.parentName].filter(
    Boolean,
  ) as string[];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Categories", href: "/categories" },
          { title: category.name },
        ]}
      />
      <PageHeader
        title={category.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        subtitle={subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/categories/${category.id}/edit`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Link>
          </Button>
        }
      />

      <PageBody>
        <CategoryDetailView
          category={category}
          currency={currency}
          from={from}
          to={to}
          sales={{
            totals: sales.totals,
            items: sales.items.content,
            pageCount: sales.items.totalPages,
            pageNo: pageNo - 1,
            total: sales.items.totalElements,
          }}
          initialTab={tab}
        />
      </PageBody>
    </PageShell>
  );
}

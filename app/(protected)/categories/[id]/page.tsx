import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/category/type";
import { getCategory } from "@/lib/actions/category-actions";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getItemSalesSummary } from "@/lib/actions/item-sales-actions";
import { fetchAllProducts } from "@/lib/actions/product-actions";
import {
  CategoryDetailView,
  type CategoryProductSale,
} from "./category-detail-view";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string }>;

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  // Adding a category is a sibling route now that /categories/[id] is a
  // detail view; bounce there if someone hits it through the dynamic seg.
  if (id === "new") redirect("/categories/new");

  let category: Category | null = null;
  try {
    category = await getCategory(id);
    if (!category) notFound();
  } catch {
    notFound();
  }

  // Sales for this category's products — last 30 days. Item sales are
  // per-product, so join to the products that belong to this category.
  // (Multi-attribution: a product in multiple categories shows under each.)
  const [location, currency] = await Promise.all([
    getCurrentLocation().catch(() => null),
    getLocationCurrency().catch(() => "TZS"),
  ]);
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate30 = thirtyDaysAgo.toISOString().split("T")[0];
  const toDate = now.toISOString().split("T")[0];

  const [summary, products] = await Promise.all([
    location?.id
      ? getItemSalesSummary(location.id, fromDate30, toDate)
      : Promise.resolve(null),
    fetchAllProducts().catch(() => []),
  ]);

  // Aggregate item sales per product.
  const byProduct = new Map<
    string,
    {
      qty: number;
      gross: number;
      net: number;
      cost: number;
      profit: number;
      discount: number;
    }
  >();
  for (const it of summary?.items ?? []) {
    const cur = byProduct.get(it.productId) ?? {
      qty: 0,
      gross: 0,
      net: 0,
      cost: 0,
      profit: 0,
      discount: 0,
    };
    cur.qty += it.quantitySold;
    cur.gross += it.grossSales;
    cur.net += it.netSales;
    cur.cost += it.totalCost;
    cur.profit += it.grossProfit;
    cur.discount += it.totalDiscount;
    byProduct.set(it.productId, cur);
  }

  // Products that belong to this category, with their sales (zeros if none).
  const productSales: CategoryProductSale[] = products
    .filter((p) => (p.categories ?? []).some((c) => c.id === id))
    .map((p) => {
      const s = byProduct.get(p.id);
      return {
        productId: p.id,
        name: p.name,
        quantitySold: s?.qty ?? 0,
        grossSales: s?.gross ?? 0,
        netSales: s?.net ?? 0,
        totalCost: s?.cost ?? 0,
        grossProfit: s?.profit ?? 0,
        totalDiscount: s?.discount ?? 0,
      };
    })
    .sort((a, b) => b.netSales - a.netSales);

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

  const subtitleParts = [
    category.departmentName,
    category.parentName,
  ].filter(Boolean) as string[];

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
        subtitle={
          subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined
        }
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
          productSales={productSales}
          currency={currency}
          initialTab={tab}
        />
      </PageBody>
    </PageShell>
  );
}

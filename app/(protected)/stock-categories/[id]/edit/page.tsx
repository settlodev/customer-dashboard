import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockCategoryForm from "@/components/forms/stock_category_form";
import { getStockCategory } from "@/lib/actions/stock-category-actions";

type Params = { params: Promise<{ id: string }> };

export default async function Page({ params }: Params) {
  const { id } = await params;

  let category;
  try {
    category = await getStockCategory(id);
  } catch {
    notFound();
  }
  if (!category) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Categories", href: "/stock-categories" },
          { title: category.name },
        ]}
      />
      <PageHeader
        title={category.name}
        subtitle="Edit this stock category"
      />
      <PageBody>
        <StockCategoryForm item={category} />
      </PageBody>
    </PageShell>
  );
}

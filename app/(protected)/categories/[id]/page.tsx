import { notFound } from "next/navigation";
import { Category } from "@/types/category/type";
import { getCategory } from "@/lib/actions/category-actions";
import CategoryForm from "@/components/forms/category_form";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";

type Params = Promise<{ id: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Category | null = null;

  if (!isNewItem) {
    try {
      item = await getCategory(resolvedParams.id);
    } catch {
      notFound();
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Categories", href: "/categories" },
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Add Category" : "Edit Category"}
        subtitle={
          isNewItem
            ? "Create a new category for your business"
            : "Update category details and settings"
        }
      />

      <PageBody>
        <CategoryForm item={item} />
      </PageBody>
    </PageShell>
  );
}

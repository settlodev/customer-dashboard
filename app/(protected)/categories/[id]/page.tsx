import { notFound } from "next/navigation";
import { Category } from "@/types/category/type";
import { getCategory } from "@/lib/actions/category-actions";
import CategoryForm from "@/components/forms/category_form";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";

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

  const breadcrumbItems = [
    { title: "Categories", link: "/categories" },
    {
      title: isNewItem ? "New" : item?.name || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Category" : "Edit Category"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Create a new category for your business"
              : "Update category details and settings"}
          </p>
        </div>

        <CategoryForm item={item} />
      </div>
    </div>
  );
}

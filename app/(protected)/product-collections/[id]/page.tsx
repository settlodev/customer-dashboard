import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { ProductCollection } from "@/types/product-collection/type";
import { getProductCollection } from "@/lib/actions/product-collection-actions";
import ProductCollectionForm from "@/components/forms/product_collection_form";

type Params = Promise<{ id: string }>;

export default async function ProductCollectionPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ProductCollection | null = null;

  if (!isNewItem) {
    try {
      item = await getProductCollection(resolvedParams.id);
    } catch {
      notFound();
    }
  }

  const breadcrumbItems = [
    { title: "Collections", link: "/product-collections" },
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
            {isNewItem ? "Create Collection" : "Edit Collection"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Group products into a collection"
              : "Update collection details"}
          </p>
        </div>

        <ProductCollectionForm item={item} />
      </div>
    </div>
  );
}

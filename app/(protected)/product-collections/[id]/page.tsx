import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { ProductCollection } from "@/types/product-collection/type";
import { getProductCollection } from "@/lib/actions/product-collection-actions";
import ProductCollectionForm from "@/components/forms/product_collection_form";

type Params = Promise<{ id: string }>;

export default async function ProductCollectionPage({
  params,
}: {
  params: Params;
}) {
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

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Collections", href: "/product-collections" },
          { title: isNewItem ? "New" : item?.name || "Edit" },
        ]}
      />
      <PageHeader
        title={isNewItem ? "Create Collection" : "Edit Collection"}
        subtitle={
          isNewItem
            ? "Group products into a collection"
            : "Update collection details"
        }
      />

      <PageBody>
        <ProductCollectionForm item={item} />
      </PageBody>
    </PageShell>
  );
}

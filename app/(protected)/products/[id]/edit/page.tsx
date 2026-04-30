import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Product } from "@/types/product/type";
import ProductForm from "@/components/forms/product_form";
import { getProduct } from "@/lib/actions/product-actions";

type Params = Promise<{ id: string }>;

// Edit page for an existing product. New-product creation lives at /products/new.
export default async function ProductEditPage({ params }: { params: Params }) {
  const resolvedParams = await params;

  let product: Product | null = null;
  try {
    product = await getProduct(resolvedParams.id);
    if (!product) notFound();
  } catch {
    throw new Error("Failed to load product details");
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Products", href: "/products" },
          { title: product.name, href: `/products/${product.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${product.name}`}
        subtitle="Update product details, variants, modifiers, and addons."
      />
      <PageBody>
        <ProductForm item={product} />
      </PageBody>
    </PageShell>
  );
}

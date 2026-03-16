import { ApiResponse } from "@/types/types";
import { UUID } from "node:crypto";
import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Product } from "@/types/product/type";
import ProductForm from "@/components/forms/product_form";
import { getProduct } from "@/lib/actions/product-actions";

type Params = Promise<{ id: string }>;
export default async function ProductPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: ApiResponse<Product> | null = null;

  if (!isNewItem) {
    try {
      item = await getProduct(resolvedParams.id as UUID);
      if (item.totalElements == 0) notFound();
    } catch (error) {
      console.log(error);
      throw new Error("Failed to load product details");
    }
  }

  const breadCrumbItems = [
    { title: "Products", link: "/products" },
    {
      title: isNewItem ? "New" : item?.content[0].name || "Edit",
      link: "",
    },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadCrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {isNewItem ? "Add Product" : "Edit Product"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Add a new product to your business"
              : "Update product details and variants"}
          </p>
        </div>

        {/* Form */}
        <ProductForm item={isNewItem ? null : item?.content[0]} />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Brand } from "@/types/brand/type";
import { getBrand } from "@/lib/actions/brand-actions";
import BrandForm from "@/components/forms/brand_form";

type Params = Promise<{ id: string }>;

export default async function BrandPage({ params }: { params: Params }) {
  const resolvedParams = await params;
  const isNewItem = resolvedParams.id === "new";
  let item: Brand | null = null;

  if (!isNewItem) {
    try {
      item = await getBrand(resolvedParams.id);
    } catch {
      notFound();
    }
  }

  const breadcrumbItems = [
    { title: "Brands", link: "/brands" },
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
            {isNewItem ? "Add Brand" : "Edit Brand"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Create a new brand for your business"
              : "Update brand details"}
          </p>
        </div>

        <BrandForm item={item} />
      </div>
    </div>
  );
}

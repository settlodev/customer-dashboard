import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { Supplier } from "@/types/supplier/type";
import { getSupplier } from "@/lib/actions/supplier-actions";
import SupplierForm from "@/components/forms/supplier_form";

type Params = Promise<{ id: string }>;

export default async function SupplierPage({ params }: { params: Params }) {
  const paramsData = await params;
  const isNewItem = paramsData.id === "new";
  let item: Supplier | null = null;

  if (!isNewItem) {
    try {
      item = await getSupplier(paramsData.id);
    } catch {
      notFound();
    }
  }

  const breadcrumbItems = [
    { title: "Suppliers", link: "/suppliers" },
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
            {isNewItem ? "Add Supplier" : "Edit Supplier"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isNewItem
              ? "Add a new supplier to your business"
              : "Update supplier details and contact information"}
          </p>
        </div>

        <SupplierForm item={item} />
      </div>
    </div>
  );
}

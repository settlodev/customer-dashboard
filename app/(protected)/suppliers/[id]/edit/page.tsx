import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getSupplier } from "@/lib/actions/supplier-actions";
import SupplierForm from "@/components/forms/supplier-form";

type Params = Promise<{ id: string }>;

export default async function EditSupplierPage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getSupplier(id);
  if (!item) notFound();

  const breadcrumbItems = [
    { title: "Suppliers", link: "/suppliers" },
    { title: item.name, link: `/suppliers/${item.id}` },
    { title: "Edit", link: "" },
  ];

  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8">
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Edit supplier
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Update commercial details, contact person, or marketplace link.
          </p>
        </div>

        <SupplierForm item={item} />
      </div>
    </div>
  );
}

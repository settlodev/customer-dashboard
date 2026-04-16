import { notFound } from "next/navigation";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import { getSupplier } from "@/lib/actions/supplier-actions";
import SupplierForm from "@/components/forms/supplier_form";

type Params = Promise<{ id: string }>;
export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const isNew = id === "new";
  const item = isNew ? null : await getSupplier(id);
  if (!isNew && !item) notFound();
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 mt-12">
      <BreadcrumbsNav items={[{ title: "Suppliers", link: "/warehouse-suppliers" }, { title: isNew ? "New" : item?.name || "Edit", link: "" }]} />
      <h1 className="text-2xl font-bold mt-4">{isNew ? "Add Supplier" : "Edit Supplier"}</h1>
      <div className="mt-4"><SupplierForm item={item} /></div>
    </div>
  );
}

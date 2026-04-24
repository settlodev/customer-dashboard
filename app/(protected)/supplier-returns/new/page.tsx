import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import SupplierReturnForm from "@/components/forms/supplier-return-form";

const breadcrumbItems = [
  { title: "Supplier Returns", link: "/supplier-returns" },
  { title: "New", link: "" },
];

export default function NewSupplierReturnPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">New Supplier Return</h1>
        <p className="text-sm text-muted-foreground">
          Return damaged, expired, or wrongly-shipped goods to a supplier.
        </p>
      </div>
      <SupplierReturnForm />
    </div>
  );
}

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import SupplierForm from "@/components/forms/supplier-form";

const breadcrumbItems = [
  { title: "Suppliers", link: "/suppliers" },
  { title: "New", link: "" },
];

export default function NewSupplierPage() {
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8">
      <div className="space-y-6 max-w-4xl">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Add supplier
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Add a business supplier. Optionally link to a marketplace-verified
            record to pre-fill commercial details.
          </p>
        </div>

        <SupplierForm item={null} />
      </div>
    </div>
  );
}

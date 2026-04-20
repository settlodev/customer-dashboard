import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import LpoForm from "@/components/forms/lpo-form";

const breadcrumbItems = [
  { title: "Purchase Orders", link: "/stock-purchases" },
  { title: "New", link: "" },
];

export default function NewLpoPage() {
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
        <div>
          <div className="hidden sm:block mb-2">
            <BreadcrumbsNav items={breadcrumbItems} />
          </div>
          <h1 className="text-2xl font-bold">Local Purchase Order</h1>
          <p className="text-sm text-muted-foreground">
            Draft an order for a supplier. Submit and approve to unlock GRN
            receiving against it.
          </p>
        </div>
        <LpoForm />
      </div>
    </div>
  );
}

import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import LpoForm from "@/components/forms/lpo-form";

const breadcrumbItems = [
  { title: "Purchase Orders", link: "/purchase-orders" },
  { title: "New", link: "" },
];

export default function NewLpoPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">Purchase Order</h1>
        <p className="text-sm text-muted-foreground">
          Draft an order for a supplier. Submit and approve to unlock GRN
          receiving against it.
        </p>
      </div>
      <LpoForm />
    </div>
  );
}

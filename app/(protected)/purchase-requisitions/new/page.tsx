import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import RequisitionForm from "@/components/forms/requisition-form";

const breadcrumbItems = [
  { title: "Purchase Requisitions", link: "/purchase-requisitions" },
  { title: "New", link: "" },
];

export default function NewRequisitionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">New Purchase Requisition</h1>
        <p className="text-sm text-muted-foreground">
          Request materials. Once approved it can be converted to LPO(s)
          grouped by preferred supplier.
        </p>
      </div>
      <RequisitionForm />
    </div>
  );
}

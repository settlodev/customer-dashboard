import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import RequisitionForm from "@/components/forms/requisition-form";

const breadcrumbItems = [
  { title: "Purchase Requisitions", link: "/purchase-requisitions" },
  { title: "New", link: "" },
];

export default function NewRequisitionPage() {
  return (
    <div className="flex-1 px-4 pt-4 pb-8 md:px-8 md:pt-6 md:pb-8 mt-12">
      <div className="space-y-6">
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
    </div>
  );
}

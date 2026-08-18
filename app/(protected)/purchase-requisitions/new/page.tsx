import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import RequisitionForm from "@/components/forms/requisition-form";

export default function NewRequisitionPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Purchase Requisitions", href: "/purchase-requisitions" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Purchase Requisition"
        subtitle="Request materials. Once approved it can be converted to LPO(s) grouped by preferred supplier."
      />
      <PageBody>
        <RequisitionForm />
      </PageBody>
    </PageShell>
  );
}

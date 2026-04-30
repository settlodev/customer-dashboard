import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import SupplierReturnForm from "@/components/forms/supplier-return-form";

export default function NewSupplierReturnPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Supplier Returns", href: "/supplier-returns" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Supplier Return"
        subtitle="Return damaged, expired, or wrongly-shipped goods to a supplier."
      />
      <PageBody>
        <SupplierReturnForm />
      </PageBody>
    </PageShell>
  );
}

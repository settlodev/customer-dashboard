import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import SupplierForm from "@/components/forms/supplier-form";

export default function NewSupplierPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Suppliers", href: "/suppliers" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add supplier"
        subtitle="Add a business supplier. Optionally link to a marketplace-verified record to pre-fill commercial details."
      />

      <PageBody>
        <SupplierForm item={null} />
      </PageBody>
    </PageShell>
  );
}

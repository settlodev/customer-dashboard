import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StoreForm from "@/components/forms/store_form";

export default function NewStorePage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stores", href: "/stores" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add store"
        subtitle="Create a new store for this business. Subscription billing is configured on the detail page after activation."
      />
      <PageBody>
        <StoreForm item={null} />
      </PageBody>
    </PageShell>
  );
}

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import DiscountForm from "@/components/forms/discount_form";

export default function NewDiscountPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Discounts", href: "/discounts" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add Discount"
        subtitle="Create a new discount rule for your business"
      />

      <PageBody>
        <DiscountForm item={null} />
      </PageBody>
    </PageShell>
  );
}

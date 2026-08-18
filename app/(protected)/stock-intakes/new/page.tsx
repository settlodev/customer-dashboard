import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockIntakeForm from "@/components/forms/stock_intake_form";

export default function NewStockIntakePage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Intakes", href: "/stock-intakes" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Record stock intake"
        subtitle="Capture stock quantities, costs, and batches. Intakes are created as a draft — confirm to post movements and update inventory."
      />
      <PageBody>
        <StockIntakeForm />
      </PageBody>
    </PageShell>
  );
}

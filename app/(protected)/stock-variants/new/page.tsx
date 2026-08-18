import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockForm from "@/components/forms/stock_form";

export default function NewStockPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Items", href: "/stock-variants" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="Add Stock Item"
        subtitle="Add a new stock item to track inventory."
      />
      <PageBody>
        <StockForm item={null} />
      </PageBody>
    </PageShell>
  );
}

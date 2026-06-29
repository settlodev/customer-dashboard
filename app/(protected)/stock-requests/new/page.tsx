import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import StockTransferRequestForm from "@/components/forms/stock_transfer_request_form";

export default function NewStockRequestPage() {
  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Requests", href: "/stock-requests" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Stock Request"
        subtitle="Request stock from another location, store, or warehouse."
      />
      <PageBody>
        <StockTransferRequestForm />
      </PageBody>
    </PageShell>
  );
}

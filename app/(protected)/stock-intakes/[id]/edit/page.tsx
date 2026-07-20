import { notFound, redirect } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { getStockIntakeRecord } from "@/lib/actions/stock-intake-record-actions";
import StockIntakeForm from "@/components/forms/stock_intake_form";

type Params = Promise<{ id: string }>;

export default async function EditStockIntakePage({ params }: { params: Params }) {
  const { id } = await params;
  const item = await getStockIntakeRecord(id);
  if (!item) notFound();
  // A confirmed intake has already moved the ledger; its value is fixed
  // through a batch value correction on the detail page instead.
  if (item.status !== "DRAFT") redirect(`/stock-intakes/${id}`);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Stock Intakes", href: "/stock-intakes" },
          { title: item.referenceNumber, href: `/stock-intakes/${item.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${item.referenceNumber}`}
        subtitle="Update quantities, costs, and batch details before confirming."
      />
      <PageBody>
        <StockIntakeForm item={item} />
      </PageBody>
    </PageShell>
  );
}

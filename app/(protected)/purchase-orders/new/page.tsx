import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import LpoForm, { type LpoFormInitialValues } from "@/components/forms/lpo-form";
import { getRequisition } from "@/lib/actions/requisition-actions";

type Params = {
  searchParams: Promise<{ fromRequisition?: string }>;
};

export default async function NewLpoPage({ searchParams }: Params) {
  const { fromRequisition } = await searchParams;

  let initialValues: LpoFormInitialValues | undefined;
  let sourceLabel: string | null = null;

  if (fromRequisition) {
    const requisition = await getRequisition(fromRequisition);
    if (requisition) {
      sourceLabel = requisition.requisitionNumber;
      initialValues = {
        supplierId: "",
        notes: `From requisition ${requisition.requisitionNumber}`,
        items: requisition.items.map((item) => ({
          stockVariantId: item.stockVariantId,
          orderedQuantity: Number(item.requestedQuantity ?? 0),
          unitCost: Number(item.estimatedUnitCost ?? 0),
          currency: (item.currency ?? "").toUpperCase(),
        })),
      };
    }
  }

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Purchase Orders", href: "/purchase-orders" },
          { title: "New" },
        ]}
      />
      <PageHeader
        title="New Purchase Order"
        subtitle={
          sourceLabel
            ? `Pre-populated from requisition ${sourceLabel}. Pick a supplier and adjust the lines, then submit and approve to unlock GRN receiving.`
            : "Draft an order for a supplier. Submit and approve to unlock GRN receiving against it."
        }
      />
      <PageBody>
        <LpoForm initialValues={initialValues} />
      </PageBody>
    </PageShell>
  );
}

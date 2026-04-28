import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import LpoForm, { type LpoFormInitialValues } from "@/components/forms/lpo-form";
import { getRequisition } from "@/lib/actions/requisition-actions";

const breadcrumbItems = [
  { title: "Purchase Orders", link: "/purchase-orders" },
  { title: "New", link: "" },
];

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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-4">
      <div>
        <div className="hidden sm:block mb-2">
          <BreadcrumbsNav items={breadcrumbItems} />
        </div>
        <h1 className="text-2xl font-bold">Purchase Order</h1>
        <p className="text-sm text-muted-foreground">
          {sourceLabel
            ? `Pre-populated from requisition ${sourceLabel}. Pick a supplier and adjust the lines, then submit and approve to unlock GRN receiving.`
            : "Draft an order for a supplier. Submit and approve to unlock GRN receiving against it."}
        </p>
      </div>
      <LpoForm initialValues={initialValues} />
    </div>
  );
}

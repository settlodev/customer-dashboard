import SharePurchaseOrder from "@/components/local-purchase-order/share-purchase-order";

export default function SharePurchaseOrderPage({
  params,
}: {
  params: { id: string };
}) {
  return <SharePurchaseOrder purchaseId={params.id} />;
}

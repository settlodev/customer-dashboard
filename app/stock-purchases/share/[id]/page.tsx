import SharePurchaseOrder from "@/components/local-purchase-order/share-purchase-order";

export default async function SharePurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await the params promise before accessing properties
  const { id } = await params;

  return <SharePurchaseOrder purchaseId={id} />;
}

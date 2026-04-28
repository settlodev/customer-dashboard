import { redirect } from "next/navigation";

/**
 * Backward-compat redirect for LPO share links issued before the canonical
 * URL moved to {@code /po/[token]}. Existing tokens still resolve.
 */
export default async function SharedPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/po/${id}`);
}

import { UUID } from "node:crypto";
import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import { VfdReceiptSheet } from "@/components/widgets/orders/vfd-receipt-sheet";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { getOrderDetail, getVfdReceipt } from "@/lib/actions/order-actions";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for an order's TRA fiscal (VFD)
 * receipt. Mirrors the GRN / Close-of-Day printable routes: chrome-free
 * `(printables)` group, server component, opened directly in a new tab
 * from `PrintVfdButton` — this route itself issues the receipt via
 * `getVfdReceipt`, which is idempotent, so landing here again (or a
 * reprint) returns the same stored fiscal receipt rather than re-signing.
 *
 * A failed sign (order not closed, device unreachable, etc.) renders a
 * plain error panel instead of the receipt — no retry loop, no partial
 * document.
 */
export default async function OrderVfdReceiptPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [order, vfdResult, currency] = await Promise.all([
    getOrderDetail(id as UUID),
    getVfdReceipt(id as UUID),
    getLocationCurrency(),
  ]);

  if (!order) notFound();

  if ("error" in vfdResult) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Couldn&apos;t issue the VFD receipt
          </h1>
          <p className="mt-2 text-sm text-slate-600">{vfdResult.error}</p>
        </div>
      </div>
    );
  }

  const { vfd } = vfdResult;

  return (
    <PrintableDocument
      documentTitle={`${order.orderNumber} - Tax Receipt`}
      autoPrint
    >
      <VfdReceiptSheet order={order} vfd={vfd} currency={currency} />
    </PrintableDocument>
  );
}

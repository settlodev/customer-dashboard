import { AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import {
  VfdReceiptSheet,
  invoiceToVfdSubject,
} from "@/components/widgets/orders/vfd-receipt-sheet";
import {
  getInvoice,
  getInvoiceVfdReceipt,
  listInvoicePayments,
} from "@/lib/actions/invoicing-invoice-actions";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print view for an invoice's TRA fiscal (VFD) receipt —
 * the invoice-side twin of `(printables)/orders/[id]/vfd`. The route itself
 * issues the receipt via `getInvoiceVfdReceipt`, which is idempotent per
 * invoice, so a reprint returns the stored fiscal receipt rather than
 * signing the sale again.
 *
 * A failed sign (invoice voided, location not VFD-registered, device
 * unreachable, DIRM rejection) renders a plain error panel — no retry loop,
 * no partial document.
 */
export default async function InvoiceVfdReceiptPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [invoice, payments, vfdResult] = await Promise.all([
    getInvoice(id),
    listInvoicePayments(id),
    getInvoiceVfdReceipt(id),
  ]);
  if (!invoice) notFound();

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

  return (
    <PrintableDocument
      documentTitle={`${invoice.invoiceNumber} - Tax Receipt`}
      autoPrint
    >
      <VfdReceiptSheet
        subject={invoiceToVfdSubject(invoice, payments)}
        vfd={vfdResult.vfd}
        currency={invoice.currencyCode}
      />
    </PrintableDocument>
  );
}

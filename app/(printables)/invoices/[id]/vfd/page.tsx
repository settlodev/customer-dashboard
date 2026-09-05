import { AlertTriangle, ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
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
 * no partial document. The panel always offers the invoice itself as the way
 * out: the commonest failure is fiscalising before any payment is recorded,
 * where a fiscal receipt is simply the wrong document and the invoice is the
 * one the customer should be sent.
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
    // A fiscal receipt acknowledges money received, so an invoice with nothing
    // paid against it can never produce one. Say that plainly and point at the
    // invoice rather than leaving a dead end on a blank tab.
    const awaitingPayment = /payment has been recorded|no payment/i.test(
      vfdResult.error,
    );

    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle
            className={`mx-auto h-8 w-8 ${awaitingPayment ? "text-amber-500" : "text-red-500"}`}
          />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            {awaitingPayment
              ? "No payment recorded yet"
              : "Couldn't issue the VFD receipt"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {awaitingPayment
              ? `A tax receipt can only be issued once money has been received against ${invoice.invoiceNumber}. Send the invoice instead — the receipt becomes available as soon as a payment is recorded.`
              : vfdResult.error}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href={`/invoices/${invoice.id}/print`}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-700"
            >
              <FileText className="h-3.5 w-3.5" />
              Open the invoice
            </Link>
            <Link
              href={`/invoices/${invoice.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to invoice
            </Link>
          </div>
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

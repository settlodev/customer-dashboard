import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import {
  getInvoice,
  listInvoicePayments,
} from "@/lib/actions/invoicing-invoice-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildReceiptDocument } from "@/lib/invoicing-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated receipt for an invoice — the payments received against it
 * and the balance still open (zero once fully paid). Printable from the
 * dashboard as soon as any payment has been recorded; the customer-facing
 * receipt link (/receipt/[token]) is the same document, gated on PAID.
 */
export default async function InvoiceReceiptPrintPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [invoice, payments, letterhead] = await Promise.all([
    getInvoice(id),
    listInvoicePayments(id),
    getLetterhead(),
  ]);
  if (!invoice) notFound();
  // A receipt acknowledges money received — nothing received, nothing to print.
  if (!(invoice.paidAmount > 0)) notFound();

  const { data, theme } = buildReceiptDocument(invoice, { letterhead, payments });

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={`${invoice.invoiceNumber} - Receipt`}
      autoPrint
    />
  );
}

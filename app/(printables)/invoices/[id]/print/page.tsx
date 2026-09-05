import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import {
  getInvoice,
  listInvoicePayments,
} from "@/lib/actions/invoicing-invoice-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildInvoiceDocument } from "@/lib/invoicing-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for an Accounting invoice — the same
 * document the customer link (/inv/[token]) renders, via the shared mapper
 * in lib/invoicing-document.ts, sourced from the tenant-scoped endpoints so
 * no share token needs to exist. Opened in a new tab by "Download PDF" on
 * the invoice detail page; the print dialog opens once assets have loaded.
 */
export default async function InvoicePrintPage({ params }: { params: Params }) {
  const { id } = await params;

  const [invoice, payments, letterhead] = await Promise.all([
    getInvoice(id),
    listInvoicePayments(id),
    getLetterhead(),
  ]);
  if (!invoice) notFound();

  const { data, theme } = buildInvoiceDocument(invoice, { letterhead, payments });

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={`${invoice.invoiceNumber} - Invoice`}
      autoPrint
    />
  );
}

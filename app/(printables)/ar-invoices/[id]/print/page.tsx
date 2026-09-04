import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import { getCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildArInvoiceDocument } from "@/lib/ar-invoice-document";

type Params = Promise<{ id: string }>;

/**
 * Authenticated print/download view for a consolidated customer A/R invoice
 * (the invoice raised over a customer's signed bills). Same document as the
 * public /ar-invoice/[token] link, via lib/ar-invoice-document.ts.
 */
export default async function ArInvoicePrintPage({ params }: { params: Params }) {
  const { id } = await params;

  const [invoice, letterhead] = await Promise.all([
    getCustomerArInvoice(id),
    getLetterhead(),
  ]);
  if (!invoice) notFound();

  const { data, theme } = buildArInvoiceDocument(invoice, letterhead);

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={`${invoice.invoiceNumber} - Invoice`}
      autoPrint
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import { getPublicCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
import { buildArInvoiceDocument } from "@/lib/ar-invoice-document";

type Params = Promise<{ token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicCustomerArInvoice(token);
  if (!invoice) return { title: "Invoice · Settlo", robots: { index: false } };

  const { documentTitle } = buildArInvoiceDocument(invoice);
  const description = `Invoice ${invoice.invoiceNumber} covering ${invoice.orders.length} order(s).`;

  return {
    title: documentTitle,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: documentTitle, description, type: "article" },
    twitter: { card: "summary", title: documentTitle, description },
  };
}

/**
 * Public view of a consolidated A/R invoice. Reads through to the live
 * orders on every request, so a bill settled at the till shows as paid on
 * the customer's next refresh without the link being re-issued. Rendered
 * through the shared mapper (lib/ar-invoice-document.ts) so it is the same
 * document as the dashboard's "Download PDF".
 */
export default async function SharedArInvoicePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicCustomerArInvoice(token);
  if (!invoice) notFound();

  const { data, theme, documentTitle } = buildArInvoiceDocument(invoice);

  return (
    <PrintableDocument data={data} theme={theme} documentTitle={documentTitle} />
  );
}

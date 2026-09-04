import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import { getPublicArInvoice } from "@/lib/actions/invoicing-public-actions";
import { buildReceiptDocument } from "@/lib/invoicing-document";
import type { PublicArInvoice } from "@/types/invoicing/type";

type Params = Promise<{ token: string }>;

const isPaid = (inv: PublicArInvoice) =>
  inv.status === "ISSUED" && inv.paymentStatus === "PAID";

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice || !isPaid(invoice)) {
    return { title: "Receipt · Settlo", robots: { index: false } };
  }

  const { documentTitle } = buildReceiptDocument(invoice, {
    payments: invoice.payments,
  });
  const description = `Receipt for invoice ${invoice.invoiceNumber} from ${
    invoice.businessName || invoice.locationName || "Settlo"
  }.`;

  return {
    title: documentTitle,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: documentTitle, description, type: "article" },
    twitter: { card: "summary", title: documentTitle, description },
  };
}

/**
 * A paid invoice rendered as a RECEIPT — same token as the invoice link
 * (/inv/[token]), same shared document system. The token now exists from
 * conversion, so an invoice that is not yet fully paid is sent to its
 * invoice view instead of being shown as a receipt for money not received.
 */
export default async function PublicReceiptPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice) notFound();
  if (!isPaid(invoice)) redirect(`/inv/${encodeURIComponent(token)}`);

  const { data, theme, documentTitle } = buildReceiptDocument(invoice, {
    payments: invoice.payments,
  });

  return (
    <PrintableDocument data={data} theme={theme} documentTitle={documentTitle} />
  );
}

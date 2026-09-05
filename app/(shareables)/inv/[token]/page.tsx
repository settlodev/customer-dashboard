import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Receipt } from "lucide-react";

import { PrintableDocument } from "@/components/documents";
import {
  ActionBarSpacer,
  PublicActionBar,
} from "@/components/documents/PublicActionBar";
import { Button } from "@/components/ui/button";
import { getPublicArInvoice } from "@/lib/actions/invoicing-public-actions";
import { buildInvoiceDocument } from "@/lib/invoicing-document";

type Params = Promise<{ token: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice) return { title: "Invoice · Settlo", robots: { index: false } };

  const { documentTitle } = buildInvoiceDocument(invoice, {
    payments: invoice.payments,
  });
  const description = `Invoice ${invoice.invoiceNumber} from ${
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
 * The customer's copy of an Accounting invoice. Letterhead, customer and
 * lines are the snapshot frozen at conversion; the payment rows and balance
 * are live, so the one link shows the invoice being settled and — once it is
 * fully paid — offers the receipt (/receipt/[token], same token).
 */
export default async function PublicInvoicePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice) notFound();

  const { data, theme, documentTitle } = buildInvoiceDocument(invoice, {
    payments: invoice.payments,
  });
  const paid = invoice.paymentStatus === "PAID" && invoice.status === "ISSUED";

  return (
    <>
      <PrintableDocument data={data} theme={theme} documentTitle={documentTitle} />
      {paid && (
        <>
          <ActionBarSpacer />
          <PublicActionBar className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              This invoice has been paid in full.
            </p>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/receipt/${encodeURIComponent(token)}`}>
                <Receipt className="mr-1.5 h-4 w-4" />
                View receipt
              </Link>
            </Button>
          </PublicActionBar>
        </>
      )}
    </>
  );
}

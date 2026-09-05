import { FileDown } from "lucide-react";
import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { buildArInvoiceDocument } from "@/lib/ar-invoice-document";
import {
  AR_INVOICE_PAYMENT_LABELS,
  AR_INVOICE_PAYMENT_TONES,
} from "@/types/customer-ar-invoice/type";

import { ArInvoiceDetailClient } from "./ar-invoice-detail-client";

type Params = Promise<{ id: string }>;

export default async function ArInvoicePage({ params }: { params: Params }) {
  const { id } = await params;
  const invoice = await getCustomerArInvoice(id);
  if (!invoice) notFound();

  const cancelled = invoice.status === "CANCELLED";
  // Same branded document as the share link and "Download PDF" — the
  // letterhead fills in what the frozen snapshot lacks (e.g. the logo).
  const letterhead = await getLetterhead();
  const document = buildArInvoiceDocument(invoice, letterhead);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Customers", href: "/customers" },
          {
            title: invoice.customerName ?? "Customer",
            href: `/customers/${invoice.customerId}`,
          },
          { title: invoice.invoiceNumber },
        ]}
      />
      <PageHeader
        title={invoice.invoiceNumber}
        titleAccessory={
          cancelled ? (
            <Badge variant="soft">Cancelled</Badge>
          ) : (
            <Badge variant={AR_INVOICE_PAYMENT_TONES[invoice.paymentStatus]}>
              {AR_INVOICE_PAYMENT_LABELS[invoice.paymentStatus]}
            </Badge>
          )
        }
        subtitle={`Consolidated invoice for ${invoice.customerName ?? "customer"} — ${
          invoice.orders.length
        } ${invoice.orders.length === 1 ? "signed bill" : "signed bills"}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <a
              href={`/ar-invoices/${invoice.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              Download PDF
            </a>
          </Button>
        }
      />
      <PageBody>
        <ArInvoiceDetailClient invoice={invoice} document={document} />
      </PageBody>
    </PageShell>
  );
}

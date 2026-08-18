import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import {
  getInvoice,
  getInvoiceTimeline,
} from "@/lib/actions/invoicing-invoice-actions";
import {
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_PAYMENT_STATUS_TONES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TONES,
  isInvoiceOverdue,
} from "@/types/invoicing/type";

import { InvoiceDetailClient } from "./invoice-detail-client";

type Params = Promise<{ id: string }>;
type Search = Promise<{ pay?: string }>;

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { id } = await params;
  const { pay } = await searchParams;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const timeline = await getInvoiceTimeline(invoice.id);
  const overdue = isInvoiceOverdue(invoice);

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Invoices", href: "/invoices" },
          { title: invoice.invoiceNumber },
        ]}
      />
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={invoice.customerName}
        titleAccessory={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_PAYMENT_STATUS_TONES[invoice.paymentStatus]}`}
            >
              {INVOICE_PAYMENT_STATUS_LABELS[invoice.paymentStatus]}
            </span>
            {overdue && (
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                Overdue
              </span>
            )}
            {invoice.status === "VOIDED" && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INVOICE_STATUS_TONES.VOIDED}`}
              >
                {INVOICE_STATUS_LABELS.VOIDED}
              </span>
            )}
          </div>
        }
      />
      <PageBody>
        <InvoiceDetailClient
          invoice={invoice}
          timeline={timeline}
          autoOpenPay={pay === "1"}
        />
      </PageBody>
    </PageShell>
  );
}

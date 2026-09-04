import { FileDown, Printer, Receipt } from "lucide-react";
import { notFound } from "next/navigation";

import { PermissionGuard } from "@/components/auth/permission-guard";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import {
  getInvoice,
  getInvoiceTimeline,
  listInvoicePayments,
} from "@/lib/actions/invoicing-invoice-actions";
import { getLetterhead } from "@/lib/actions/letterhead-actions";
import { getLocationVfdRegistration } from "@/lib/actions/location-vfd-actions";
import { buildInvoiceDocument } from "@/lib/invoicing-document";
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

  // `getCurrentLocation` is a cookie read; the VFD registration lookup needs
  // its id, so resolve it first and let the rest run in parallel.
  const currentLocation = await getCurrentLocation();
  const [timeline, payments, letterhead, vfdRegistrationResult] =
    await Promise.all([
      getInvoiceTimeline(invoice.id),
      listInvoicePayments(invoice.id),
      getLetterhead(),
      currentLocation?.id
        ? getLocationVfdRegistration(currentLocation.id)
        : Promise.resolve({ data: null } as const),
    ]);
  const vfdRegistration =
    "data" in vfdRegistrationResult ? vfdRegistrationResult.data : null;

  const overdue = isInvoiceOverdue(invoice);
  const issued = invoice.status === "ISSUED";
  const hasPayment = issued && invoice.paidAmount > 0;
  const canPrintReceipt = hasPayment;
  // Fiscalising is a real TRA submission: only once money has actually been
  // received, only where the location's VFD registration is verified, and
  // never for a voided invoice. The backend enforces the same gate.
  const canPrintVfd = hasPayment && vfdRegistration?.verified === true;

  // The on-screen document IS the printed/shared document — same mapper as
  // /invoices/[id]/print and the customer link, with the letterhead filling
  // in whatever the frozen snapshot lacks (the logo on older invoices).
  const document = buildInvoiceDocument(invoice, { letterhead, payments });

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
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href={`/invoices/${invoice.id}/print`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileDown className="mr-1.5 h-4 w-4" />
                Download PDF
              </a>
            </Button>
            {canPrintReceipt && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={`/invoices/${invoice.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Receipt className="mr-1.5 h-4 w-4" />
                  Print receipt
                </a>
              </Button>
            )}
            {canPrintVfd && (
              <PermissionGuard permission="printing:tax_receipt">
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`/invoices/${invoice.id}/vfd`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Print VFD receipt for invoice ${invoice.invoiceNumber}`}
                  >
                    <Printer className="mr-1.5 h-4 w-4" />
                    Print VFD
                  </a>
                </Button>
              </PermissionGuard>
            )}
          </div>
        }
      />
      <PageBody>
        <InvoiceDetailClient
          invoice={invoice}
          payments={payments}
          timeline={timeline}
          document={document}
          autoOpenPay={pay === "1"}
        />
      </PageBody>
    </PageShell>
  );
}

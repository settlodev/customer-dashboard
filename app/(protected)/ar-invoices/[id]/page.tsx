import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { getCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
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
      />
      <PageBody>
        <ArInvoiceDetailClient invoice={invoice} />
      </PageBody>
    </PageShell>
  );
}

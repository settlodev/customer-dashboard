import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicCustomerArInvoice } from "@/lib/actions/customer-ar-invoice-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import type {
  CustomerArInvoice,
  CustomerArInvoicePaymentStatus,
} from "@/types/customer-ar-invoice/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const STATUS_BADGE: Record<
  CustomerArInvoicePaymentStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  SETTLED: { label: "Settled", tone: "success" },
  PARTIALLY_PAID: { label: "Part paid", tone: "warning" },
  UNPAID: { label: "Unpaid", tone: "danger" },
};

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "";

/** Business name is the letterhead; the branch name is the fallback. */
const issuerName = (invoice: CustomerArInvoice) =>
  invoice.businessName?.trim() || invoice.locationName?.trim() || "";

/**
 * Branch name, street address, then "City, Region, Country" — each part
 * dropped when absent so a half-filled profile doesn't render stray commas.
 *
 * The branch goes here rather than in `legalName`, which DocumentHeader
 * renders INSTEAD of `name` — using it would replace the business name on
 * the letterhead with the branch name.
 */
const issuerAddressLines = (invoice: CustomerArInvoice): string[] => {
  const lines: string[] = [];
  const branch = invoice.locationName?.trim();
  if (branch && branch !== invoice.businessName?.trim()) lines.push(branch);
  if (invoice.locationAddress?.trim()) {
    lines.push(
      ...invoice.locationAddress
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    );
  }
  const locality = [
    invoice.locationCity,
    invoice.locationRegion,
    invoice.issuerCountry,
  ]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
  if (locality) lines.push(locality);
  return lines;
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicCustomerArInvoice(token);
  if (!invoice) return { title: "Invoice · Settlo", robots: { index: false } };

  const title = `${issuerName(invoice) || "Settlo"} - Invoice`;
  const description = `Invoice ${invoice.invoiceNumber} covering ${invoice.orders.length} order(s).`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

/**
 * Public view of a consolidated A/R invoice. Reads through to the live
 * orders on every request, so a bill settled at the till shows as paid on
 * the customer's next refresh without the link being re-issued.
 */
export default async function SharedArInvoicePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicCustomerArInvoice(token);
  if (!invoice) notFound();

  const currency = invoice.currency || DEFAULT_CURRENCY;
  const documentTitle = `${issuerName(invoice) || "Settlo"} - Invoice`;

  // The business is the issuer; the branch is named in the address block
  // underneath so the customer knows which site the charges came from.
  const issuer: BusinessIdentity = {
    name: issuerName(invoice) || "Business",
    addressLines: issuerAddressLines(invoice),
    phone: invoice.issuerPhone || undefined,
    email: invoice.issuerEmail || undefined,
    tin: invoice.issuerTin || undefined,
    vrn: invoice.issuerVrn || undefined,
  };

  const recipient: Party | undefined = invoice.customerName
    ? {
        name: invoice.customerName,
        phone: invoice.customerPhone || undefined,
        email: invoice.customerEmail || undefined,
      }
    : undefined;

  // One document, several orders — each order's items are listed under a
  // header line carrying its number and date, so the customer can tie every
  // charge back to the visit it came from.
  const items: LineItem[] = invoice.orders.flatMap((order) => {
    const when = fmtDate(order.closedDate ?? order.openedDate);
    const label = order.orderNumber ?? order.orderId.slice(0, 8);
    return order.items.map((item) => ({
      name: item.name,
      description: `${label}${when ? ` · ${when}` : ""}`,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      amount: Number(item.netAmount ?? 0),
    }));
  });

  const status = STATUS_BADGE[invoice.paymentStatus];

  const data: BusinessDocumentData = {
    meta: {
      type: "invoice",
      documentNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || undefined,
      status,
    },
    issuer,
    recipient,
    items,
    totals: {
      subtotal: invoice.totalAmount,
      total: invoice.totalAmount,
      payments:
        invoice.paidAmount > 0
          ? [
              {
                date: invoice.issueDate,
                method: "Payments received",
                amount: invoice.paidAmount,
              },
            ]
          : undefined,
      amountDue: invoice.outstandingAmount,
    },
    currency,
    notes: invoice.notes || undefined,
    footerMessage: "Thank you for your business and continued support",
  };

  return (
    <PrintableDocument
      data={data}
      theme={{
        primaryColor: SETTLO_PRIMARY,
        secondaryColor: SETTLO_SECONDARY,
      }}
      documentTitle={documentTitle}
    />
  );
}

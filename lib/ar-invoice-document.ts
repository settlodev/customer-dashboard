// Consolidated customer A/R invoice (OMS `customer_invoice`) → BusinessDocument.
// Shared by the public share page (/ar-invoice/[token]), the authenticated
// print view (/ar-invoices/[id]/print) and the detail screen, so an invoice
// raised over signed bills carries the same letterhead as every other document.

import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { isDisplayableImageUrl } from "@/lib/image-url";
import { invoicingTheme, type InvoicingDocument } from "@/lib/invoicing-document";
import type {
  CustomerArInvoice,
  CustomerArInvoicePaymentStatus,
} from "@/types/customer-ar-invoice/type";
import type { LocationLetterhead } from "@/types/letterhead/type";

const STATUS_BADGE: Record<
  CustomerArInvoicePaymentStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  SETTLED: { label: "Settled", tone: "success" },
  PARTIALLY_PAID: { label: "Part paid", tone: "warning" },
  UNPAID: { label: "Unpaid", tone: "danger" },
};

const clean = (s?: string | null): string | undefined => {
  const t = s?.trim();
  return t ? t : undefined;
};

const fmtDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { dateStyle: "medium" })
    : "";

/**
 * Business name is the letterhead; the branch leads the address block (it
 * must not go in `legalName`, which DocumentHeader renders INSTEAD of the
 * name). Frozen snapshot first, the live letterhead only for what it lacks —
 * typically the logo on invoices issued before logos were frozen.
 */
function issuerFrom(
  invoice: CustomerArInvoice,
  letterhead?: LocationLetterhead | null,
): BusinessIdentity {
  const lh = letterhead?.letterhead ?? null;
  const name =
    clean(invoice.businessName) ??
    clean(invoice.locationName) ??
    clean(lh?.businessName) ??
    "Business";
  const lines: string[] = [];
  const branch = clean(invoice.locationName) ?? clean(lh?.locationName);
  if (branch && branch !== name) lines.push(branch);
  if (invoice.locationAddress?.trim()) {
    lines.push(
      ...invoice.locationAddress
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    );
  }
  const locality = [invoice.locationCity, invoice.locationRegion, invoice.issuerCountry]
    .map(clean)
    .filter(Boolean)
    .join(", ");
  if (locality) lines.push(locality);

  const logo = clean(invoice.issuerLogoUrl) ?? clean(lh?.logoUrl);
  return {
    name,
    logoUrl: isDisplayableImageUrl(logo) ? logo : undefined,
    addressLines: lines,
    phone: clean(invoice.issuerPhone) ?? clean(lh?.phone),
    email: clean(invoice.issuerEmail) ?? clean(lh?.email),
    website: clean(invoice.issuerWebsite) ?? clean(lh?.website),
    tin: clean(invoice.issuerTin) ?? clean(letterhead?.taxIds?.tin),
    vrn: clean(invoice.issuerVrn) ?? clean(letterhead?.taxIds?.vrn),
  };
}

export function buildArInvoiceDocument(
  invoice: CustomerArInvoice,
  letterhead?: LocationLetterhead | null,
): InvoicingDocument {
  const issuer = issuerFrom(invoice, letterhead);
  const currency = invoice.currency || DEFAULT_CURRENCY;

  const recipient: Party | undefined = clean(invoice.customerName)
    ? {
        name: invoice.customerName!.trim(),
        phone: clean(invoice.customerPhone),
        email: clean(invoice.customerEmail),
      }
    : undefined;

  // One document, several bills — each bill's items sit under a line naming
  // the order and its date so every charge ties back to the visit.
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

  const cancelled = invoice.status === "CANCELLED";

  const data: BusinessDocumentData = {
    meta: {
      type: "invoice",
      documentNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate || undefined,
      status: cancelled
        ? { label: "Cancelled", tone: "neutral" }
        : STATUS_BADGE[invoice.paymentStatus],
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
    notes: clean(invoice.notes),
    footerMessage: "Thank you for your business and continued support",
  };

  return {
    data,
    theme: invoicingTheme(letterhead),
    documentTitle: `${issuer.name || "Settlo"} - Invoice`,
  };
}

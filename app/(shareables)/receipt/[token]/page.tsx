import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicArInvoice } from "@/lib/actions/invoicing-public-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import type { PublicArInvoice } from "@/types/invoicing/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";
const THEME = { primaryColor: SETTLO_PRIMARY, secondaryColor: SETTLO_SECONDARY };

const num = (v: number | null | undefined) => Number(v ?? 0);

const buildTitle = (inv: PublicArInvoice): string => {
  const name =
    inv.businessName?.trim() || inv.locationName?.trim() || "Settlo";
  return `${name} - Receipt`;
};

const composeAddress = (raw?: string | null): string[] =>
  raw
    ? raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

function issuerFrom(inv: PublicArInvoice): BusinessIdentity {
  const addressLines = composeAddress(inv.locationAddress);
  const locale = [inv.locationCity, inv.locationRegion, inv.issuerCountry]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  if (locale) addressLines.push(locale);

  return {
    name: inv.locationName?.trim() || inv.businessName?.trim() || "Business",
    addressLines,
    tin: inv.businessTin ?? undefined,
    vrn: inv.businessVrn ?? undefined,
    phone: inv.issuerPhone?.trim() || undefined,
    email: inv.issuerEmail?.trim() || undefined,
  };
}

/**
 * A paid invoice rendered as a RECEIPT snapshot — same shared document system
 * as the proforma/invoice share. The token only ever exists for a fully-paid
 * invoice (the backend mints it on `POST /invoices/{id}/share`, gated on PAID),
 * so the document is always "Paid" with a zero balance.
 */
function receiptToData(inv: PublicArInvoice): BusinessDocumentData {
  const items: LineItem[] = inv.lines.map((l) => ({
    name: l.description || "—",
    quantity: num(l.quantity),
    unitPrice: num(l.unitPrice),
    amount: num(l.lineTotal),
  }));

  const recipient: Party | undefined = inv.customerName
    ? {
        name: inv.customerName,
        phone: inv.customerPhone ?? undefined,
        email: inv.customerEmail ?? undefined,
        tin: inv.customerTin ?? undefined,
      }
    : undefined;

  return {
    meta: {
      type: "receipt",
      documentNumber: inv.invoiceNumber,
      referenceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      status: { label: "Paid", tone: "success" },
    },
    issuer: issuerFrom(inv),
    recipient,
    items,
    totals: {
      subtotal: num(inv.subtotalAmount),
      taxes:
        num(inv.taxAmount) > 0
          ? [{ label: "Tax", rate: 0, amount: num(inv.taxAmount) }]
          : undefined,
      discount:
        num(inv.discountAmount) > 0
          ? { label: "Discount", amount: num(inv.discountAmount) }
          : undefined,
      total: num(inv.totalAmount),
      payments: [
        {
          date: inv.issueDate,
          method: "Payment received",
          amount: num(inv.paidAmount),
        },
      ],
      amountDue: num(inv.balanceDue),
    },
    currency: inv.currencyCode || DEFAULT_CURRENCY,
    footerMessage: "Thank you for your payment",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice) return { title: "Receipt · Settlo", robots: { index: false } };

  const title = buildTitle(invoice);
  const description = `Receipt for invoice ${invoice.invoiceNumber} from ${
    invoice.businessName || invoice.locationName || "Settlo"
  }.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function PublicReceiptPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicArInvoice(token);
  if (!invoice) notFound();

  return (
    <PrintableDocument
      data={receiptToData(invoice)}
      theme={THEME}
      documentTitle={buildTitle(invoice)}
    />
  );
}

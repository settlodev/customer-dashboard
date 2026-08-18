import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicInvoice } from "@/lib/actions/order-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const PAYMENT_BADGE: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  PAID: { label: "Paid", tone: "success" },
  PARTIAL: { label: "Partial payment", tone: "warning" },
  NOT_PAID: { label: "Unpaid", tone: "danger" },
};

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Invoice`;
};

const composeAddress = (raw: string | null | undefined): string[] => {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);
  if (!invoice) return { title: "Invoice · Settlo", robots: { index: false } };

  const title = buildPageTitle(invoice.locationName);
  const description = `Invoice for order #${invoice.orderNumber} from ${invoice.businessName || invoice.locationName || "Settlo"}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SharedInvoicePage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const invoice = await getPublicInvoice(token);
  if (!invoice) notFound();

  const currency = invoice.currency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: SETTLO_PRIMARY,
    secondaryColor: SETTLO_SECONDARY,
  };
  const documentTitle = buildPageTitle(invoice.locationName);

  const issuer: BusinessIdentity = {
    name: invoice.businessName?.trim() || invoice.locationName || "Business",
    addressLines: composeAddress(invoice.locationAddress),
    phone: invoice.locationPhone || undefined,
  };

  const recipient: Party | undefined = invoice.customerName
    ? { name: invoice.customerName }
    : undefined;

  const items: LineItem[] = invoice.items.map((item) => {
    const detailParts = [
      item.specialInstructions || undefined,
      item.modifiers.length > 0 ? item.modifiers.join(", ") : undefined,
      item.addons.length > 0
        ? `Add-ons: ${item.addons.join(", ")}`
        : undefined,
    ].filter(Boolean) as string[];

    return {
      name: item.name || "—",
      description: detailParts.length > 0 ? detailParts.join("\n") : undefined,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      amount:
        item.totalPrice != null
          ? Number(item.totalPrice)
          : Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0),
    };
  });

  const subtotal = Number(invoice.subtotal ?? 0);
  const taxAmount = Number(invoice.taxAmount ?? 0);
  const discountAmount = Number(invoice.discountAmount ?? 0);
  const total = Number(invoice.totalAmount ?? subtotal);
  const amountPaid = Number(invoice.amountPaid ?? 0);
  const amountDue = Number(invoice.amountDue ?? Math.max(total - amountPaid, 0));

  const paymentKey = (invoice.paymentStatus ?? "").toUpperCase();
  const status = PAYMENT_BADGE[paymentKey];

  const data: BusinessDocumentData = {
    meta: {
      type: "invoice",
      documentNumber: invoice.orderNumber,
      issueDate: invoice.openedAt,
      status,
    },
    issuer,
    recipient,
    items,
    totals: {
      subtotal,
      taxes: taxAmount > 0 ? [{ label: "Tax", rate: 0, amount: taxAmount }] : undefined,
      discount: discountAmount > 0
        ? { label: "Discount", amount: discountAmount }
        : undefined,
      total,
      payments:
        amountPaid > 0
          ? [
              {
                date: invoice.viewedAt ?? invoice.openedAt,
                method: "Recorded payments",
                amount: amountPaid,
              },
            ]
          : undefined,
      amountDue,
    },
    currency,
    footerMessage: "Thank you for your business and continued support",
  };

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={documentTitle}
    />
  );
}

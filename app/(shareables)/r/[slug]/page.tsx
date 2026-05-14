import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicReceiptSnapshot } from "@/lib/actions/order-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

type Params = Promise<{ slug: string }>;

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
  return `${name} - Receipt`;
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
  const { slug } = await params;
  const receipt = await getPublicReceiptSnapshot(slug);
  if (!receipt) return { title: "Receipt · Settlo", robots: { index: false } };

  const title = buildPageTitle(receipt.locationName);
  const description = `Receipt for order #${receipt.orderNumber} from ${receipt.businessName || receipt.locationName || "Settlo"}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SharedReceiptPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const receipt = await getPublicReceiptSnapshot(slug);
  if (!receipt) notFound();

  const currency = receipt.currency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: SETTLO_PRIMARY,
    secondaryColor: SETTLO_SECONDARY,
  };
  const documentTitle = buildPageTitle(receipt.locationName);

  const issuer: BusinessIdentity = {
    name: receipt.businessName?.trim() || receipt.locationName || "Business",
    addressLines: composeAddress(receipt.locationAddress),
    phone: receipt.locationPhone || undefined,
  };

  const recipient: Party | undefined = receipt.customerName
    ? {
        name: receipt.customerName,
        phone: receipt.customerPhone ?? undefined,
      }
    : undefined;

  const items: LineItem[] = receipt.items.map((item) => {
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

  const subtotal = Number(receipt.subtotal ?? 0);
  const taxAmount = Number(receipt.taxAmount ?? 0);
  const discountAmount = Number(receipt.discountAmount ?? 0);
  const total = Number(receipt.totalAmount ?? subtotal);
  const amountPaid = Number(receipt.amountPaid ?? 0);
  const amountDue = Number(receipt.amountDue ?? Math.max(total - amountPaid, 0));
  const tipTotal = Number(receipt.tipAmount ?? 0);

  const paymentKey = (receipt.paymentStatus ?? "").toUpperCase();
  const status = PAYMENT_BADGE[paymentKey];

  const isFinalReceipt = receipt.receiptType === "RECEIPT";

  const data: BusinessDocumentData = {
    meta: {
      type: "receipt",
      titleOverride: receipt.receiptType === "BILL" ? "BILL" : undefined,
      documentNumber: receipt.orderNumber,
      issueDate: receipt.snapshotCreatedAt,
      referenceNumber: receipt.orderSlug ?? undefined,
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
        receipt.payments.length > 0
          ? receipt.payments.map((p) => ({
              date: p.paidAt ?? receipt.snapshotCreatedAt,
              method: p.paymentMethod ?? "Payment",
              amount: Number(p.amount ?? 0),
            }))
          : amountPaid > 0
            ? [
                {
                  date: receipt.snapshotCreatedAt,
                  method: "Recorded payments",
                  amount: amountPaid,
                },
              ]
            : undefined,
      amountDue,
    },
    currency,
    notes: tipTotal > 0
      ? `Tip included: ${tipTotal.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })} ${currency}`
      : undefined,
    footerMessage: isFinalReceipt
      ? "Thank you for your payment"
      : "Thank you for your business and continued support",
  };

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={documentTitle}
    />
  );
}

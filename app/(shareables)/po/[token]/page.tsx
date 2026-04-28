import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicLpo } from "@/lib/actions/lpo-actions";
import { PublicLpoAcknowledge } from "@/components/lpo/public-acknowledge";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  SUPPLIER_ACK_LABELS,
  type SupplierAcknowledgement,
} from "@/types/lpo/type";
import type { LetterheadBlock } from "@/types/letterhead/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const STATUS_BADGE: Record<
  SupplierAcknowledgement,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  PENDING: { label: SUPPLIER_ACK_LABELS.PENDING, tone: "warning" },
  ACCEPTED: { label: SUPPLIER_ACK_LABELS.ACCEPTED, tone: "success" },
  REJECTED: { label: SUPPLIER_ACK_LABELS.REJECTED, tone: "danger" },
};

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Purchase Order`;
};

const composeAddress = (
  letterhead: LetterheadBlock | null | undefined,
): string[] => {
  if (!letterhead) return [];
  const lines: string[] = [];
  if (letterhead.addressLine) lines.push(letterhead.addressLine);
  if (letterhead.postalCode) lines.push(`P.O.Box ${letterhead.postalCode}`);
  const locality = [letterhead.ward, letterhead.district].filter(Boolean).join(", ");
  if (locality) lines.push(locality);
  if (letterhead.region) lines.push(letterhead.region);
  if (letterhead.countryName) lines.push(letterhead.countryName);
  return lines;
};

const formatSignatureDate = (
  iso: string | null | undefined,
): string | undefined => {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const lpo = await getPublicLpo(token);
  if (!lpo) return { title: "Purchase Order · Settlo" };

  const brand = lpo.letterhead?.brand ?? null;
  const letterhead = lpo.letterhead?.letterhead ?? null;
  const title = brand?.seoTitle?.trim() || buildPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Purchase order ${lpo.lpoNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
  const ogImage =
    brand?.shareImageUrl ?? brand?.logoWideUrl ?? brand?.logoSquareUrl ?? undefined;

  return {
    title,
    description,
    icons: brand?.faviconUrl ? { icon: brand.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
      type: "article",
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SharedLpoPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const lpo = await getPublicLpo(token);
  if (!lpo) notFound();

  const letterhead = lpo.letterhead?.letterhead ?? null;
  const taxIds = lpo.letterhead?.taxIds ?? null;
  const brand = lpo.letterhead?.brand ?? null;
  const currency = lpo.currency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
  const documentTitle = buildPageTitle(letterhead?.locationName);

  const issuer: BusinessIdentity = {
    name: letterhead?.businessName ?? "Business",
    logoUrl: letterhead?.logoUrl ?? undefined,
    addressLines: composeAddress(letterhead),
    phone: letterhead?.phone ?? undefined,
    email: letterhead?.email ?? undefined,
    website: letterhead?.website ?? undefined,
    tin: taxIds?.tin ?? undefined,
    vrn: taxIds?.vrn ?? undefined,
  };

  const supplierAddressLines = lpo.supplierAddress
    ? lpo.supplierAddress.split("\n").map((l) => l.trim()).filter(Boolean)
    : [];

  const recipient: Party = {
    name: lpo.supplierName || "Supplier",
    contactPerson: lpo.supplierContactPersonName ?? undefined,
    addressLines: supplierAddressLines,
    phone: lpo.supplierContactPersonPhone || lpo.supplierPhone || undefined,
    email: lpo.supplierEmail ?? undefined,
    tin: lpo.supplierTinNumber ?? undefined,
  };

  const items: LineItem[] = lpo.items.map((item) => ({
    name: item.variantName || "—",
    quantity: Number(item.orderedQuantity || 0),
    unitPrice: Number(item.unitCost || 0),
    amount: item.lineTotal != null ? Number(item.lineTotal) : undefined,
  }));

  const subtotal =
    lpo.totalAmount ??
    items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const noteParts: string[] = [];
  if (lpo.deliveryLocationName) {
    noteParts.push(`Deliver to: ${lpo.deliveryLocationName}`);
  }
  if (lpo.notes?.trim()) noteParts.push(lpo.notes.trim());
  if (lpo.acknowledgementNote?.trim()) {
    noteParts.push(`Supplier note: ${lpo.acknowledgementNote.trim()}`);
  }

  const data: BusinessDocumentData = {
    meta: {
      type: "purchase_order",
      documentNumber: lpo.lpoNumber,
      issueDate: lpo.issuedAt,
      status: STATUS_BADGE[lpo.supplierAcknowledgement],
    },
    issuer,
    recipient,
    items,
    totals: {
      subtotal,
      total: subtotal,
      amountDue: subtotal,
    },
    currency,
    notes: noteParts.join("\n\n"),
    signatures: [
      {
        label: "Issued by",
        date: formatSignatureDate(lpo.issuedAt),
      },
      {
        label: "Acknowledged by supplier",
        date: formatSignatureDate(lpo.acknowledgedAt),
      },
    ],
    footerMessage: "",
  };

  return (
    <>
      <PrintableDocument
        data={data}
        theme={theme}
        documentTitle={documentTitle}
      />
      {lpo.supplierAcknowledgement === "PENDING" && (
        <PublicLpoAcknowledge token={token} lpoNumber={lpo.lpoNumber} />
      )}
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicSupplierReturn } from "@/lib/actions/supplier-return-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  SUPPLIER_RETURN_STATUS_LABELS,
  type SupplierReturnStatus,
} from "@/types/supplier-return/type";
import type { LetterheadBlock } from "@/types/letterhead/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const STATUS_BADGE: Record<
  SupplierReturnStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  DRAFT: { label: SUPPLIER_RETURN_STATUS_LABELS.DRAFT, tone: "neutral" },
  CONFIRMED: { label: SUPPLIER_RETURN_STATUS_LABELS.CONFIRMED, tone: "info" },
  DISPATCHED: { label: SUPPLIER_RETURN_STATUS_LABELS.DISPATCHED, tone: "warning" },
  COMPLETED: { label: SUPPLIER_RETURN_STATUS_LABELS.COMPLETED, tone: "success" },
  CANCELLED: { label: SUPPLIER_RETURN_STATUS_LABELS.CANCELLED, tone: "neutral" },
};

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Supplier Return`;
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
  const sr = await getPublicSupplierReturn(token);
  if (!sr) return { title: "Supplier Return · Settlo" };

  const brand = sr.letterhead?.brand ?? null;
  const letterhead = sr.letterhead?.letterhead ?? null;
  const title = brand?.seoTitle?.trim() || buildPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Supplier return ${sr.returnNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
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

export default async function SharedSupplierReturnPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const sr = await getPublicSupplierReturn(token);
  if (!sr) notFound();

  const letterhead = sr.letterhead?.letterhead ?? null;
  const taxIds = sr.letterhead?.taxIds ?? null;
  const brand = sr.letterhead?.brand ?? null;
  const currency = sr.currency || DEFAULT_CURRENCY;
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

  const recipient: Party = {
    name: sr.supplierName || "Supplier",
    addressLines: [],
  };

  const items: LineItem[] = sr.items.map((item) => ({
    name: item.stockVariantDisplayName || "—",
    description: item.reason?.trim() || undefined,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unitCost ?? 0),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const noteParts: string[] = [];
  if (sr.reason?.trim()) noteParts.push(`Reason: ${sr.reason.trim()}`);
  if (sr.notes?.trim()) noteParts.push(sr.notes.trim());

  const data: BusinessDocumentData = {
    meta: {
      type: "supplier_return",
      documentNumber: sr.returnNumber,
      issueDate: sr.returnDate ?? sr.createdAt,
      status: STATUS_BADGE[sr.status],
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
        label: "Returned by",
        date: formatSignatureDate(sr.returnDate ?? sr.createdAt),
      },
      { label: "Received by supplier" },
    ],
    footerMessage: "",
  };

  return (
    <PrintableDocument
      data={data}
      theme={theme}
      documentTitle={documentTitle}
    />
  );
}

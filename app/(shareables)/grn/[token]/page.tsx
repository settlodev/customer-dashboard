import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { getPublicGrn } from "@/lib/actions/grn-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  GRN_STATUS_LABELS,
  type GrnStatus,
} from "@/types/grn/type";
import type { LetterheadBlock } from "@/types/letterhead/type";

type Params = Promise<{ token: string }>;

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const STATUS_BADGE: Record<
  GrnStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  DRAFT: { label: GRN_STATUS_LABELS.DRAFT, tone: "neutral" },
  INSPECTION_HOLD: { label: GRN_STATUS_LABELS.INSPECTION_HOLD, tone: "warning" },
  RECEIVED: { label: GRN_STATUS_LABELS.RECEIVED, tone: "success" },
  CANCELLED: { label: GRN_STATUS_LABELS.CANCELLED, tone: "neutral" },
};

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Goods Received Note`;
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


export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const grn = await getPublicGrn(token);
  if (!grn) return { title: "Goods Received Note · Settlo" };

  const brand = grn.letterhead?.brand ?? null;
  const letterhead = grn.letterhead?.letterhead ?? null;
  const title = brand?.seoTitle?.trim() || buildPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Goods received note ${grn.grnNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
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

export default async function SharedGrnPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const grn = await getPublicGrn(token);
  if (!grn) notFound();

  const letterhead = grn.letterhead?.letterhead ?? null;
  const taxIds = grn.letterhead?.taxIds ?? null;
  const brand = grn.letterhead?.brand ?? null;
  const currency = grn.currency || DEFAULT_CURRENCY;
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
    name: grn.supplierName || "Supplier",
    contactPerson: grn.deliveryPersonName
      ? `Delivered by ${grn.deliveryPersonName}`
      : undefined,
    addressLines: [],
    phone: grn.deliveryPersonPhone ?? undefined,
    email: grn.deliveryPersonEmail ?? undefined,
  };

  const items: LineItem[] = grn.items.map((item) => ({
    name: item.variantName || "—",
    description:
      [
        item.batchNumber ? `Batch ${item.batchNumber}` : undefined,
        item.expiryDate ? `Expires ${item.expiryDate}` : undefined,
        item.inspectionStatus ? `Inspection: ${item.inspectionStatus}` : undefined,
      ]
        .filter(Boolean)
        .join("\n") || undefined,
    quantity: Number(item.receivedQuantity || 0),
    unitPrice: Number(item.unitCost || 0),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const data: BusinessDocumentData = {
    meta: {
      type: "goods_received_note",
      titleOverride: "Goods Received Note",
      documentNumber: grn.grnNumber,
      issueDate: grn.receivedDate,
      status: STATUS_BADGE[grn.status],
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
    notes: grn.notes ?? undefined,
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

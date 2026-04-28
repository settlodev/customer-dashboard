import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableDocument } from "@/components/documents";
import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
} from "@/components/documents";
import { getPublicRequisition } from "@/lib/actions/requisition-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  PRIORITY_LABELS,
  type RequisitionStatus,
} from "@/types/requisition/type";
import type { LetterheadBlock } from "@/types/letterhead/type";

type Params = Promise<{ token: string }>;

// Settlo brand fallback. Used when the location and the whitelabel app
// haven't customised colours.
const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const buildPageTitle = (locationName: string | null | undefined): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Purchase Requisition`;
};

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { token } = await params;
  const requisition = await getPublicRequisition(token);
  if (!requisition) return { title: "Purchase Requisition · Settlo" };

  const brand = requisition.letterhead?.brand ?? null;
  const letterhead = requisition.letterhead?.letterhead ?? null;
  const title = brand?.seoTitle?.trim() || buildPageTitle(letterhead?.locationName);
  const description =
    brand?.seoDescription?.trim() ||
    `Purchase requisition ${requisition.requisitionNumber} from ${letterhead?.businessName ?? "Settlo"}.`;
  const ogImage = brand?.shareImageUrl ?? brand?.logoWideUrl ?? brand?.logoSquareUrl ?? undefined;

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

const STATUS_BADGE: Record<
  RequisitionStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED: { label: "Pending Approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CONVERTED_TO_LPO: { label: "Converted to LPO", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

const composeLetterheadAddress = (
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

export default async function SharedRequisitionPage({
  params,
}: {
  params: Params;
}) {
  const { token } = await params;
  const requisition = await getPublicRequisition(token);
  if (!requisition) notFound();

  const letterhead = requisition.letterhead?.letterhead ?? null;
  const taxIds = requisition.letterhead?.taxIds ?? null;
  const brand = requisition.letterhead?.brand ?? null;
  const currency = requisition.currency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
  const documentTitle = buildPageTitle(letterhead?.locationName);

  const issuer: BusinessIdentity = {
    name: letterhead?.businessName ?? "Business",
    logoUrl: letterhead?.logoUrl ?? undefined,
    addressLines: composeLetterheadAddress(letterhead),
    phone: letterhead?.phone ?? undefined,
    email: letterhead?.email ?? undefined,
    website: letterhead?.website ?? undefined,
    tin: taxIds?.tin ?? undefined,
    vrn: taxIds?.vrn ?? undefined,
  };

  const items: LineItem[] = requisition.items.map((item) => ({
    name: item.stockVariantDisplayName || "—",
    description: item.notes?.trim() || undefined,
    quantity: Number(item.requestedQuantity || 0),
    unitPrice: Number(item.estimatedUnitCost ?? 0),
  }));

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const noteParts: string[] = [];
  noteParts.push(`Priority: ${PRIORITY_LABELS[requisition.priority]}`);
  if (requisition.notes?.trim()) noteParts.push(requisition.notes.trim());
  if (requisition.rejectionReason?.trim()) {
    noteParts.push(`Rejection reason: ${requisition.rejectionReason.trim()}`);
  }

  const data: BusinessDocumentData = {
    meta: {
      type: "purchase_requisition",
      documentNumber: requisition.requisitionNumber,
      issueDate: requisition.createdAt,
      dueDate: requisition.requiredByDate || undefined,
      status: STATUS_BADGE[requisition.status],
    },
    issuer,
    items,
    totals: {
      subtotal,
      total: subtotal,
      amountDue: subtotal,
    },
    currency,
    notes: noteParts.join("\n\n"),
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

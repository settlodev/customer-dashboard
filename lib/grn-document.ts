// Shared GRN → BusinessDocument mapping used by BOTH the public share page
// (/grn/[token], sourced from PublicGrn) and the authenticated print view
// (/goods-received/[id]/print, sourced from Grn + a letterhead lookup).
// Keeping the assembly here is what guarantees "download as PDF" and the
// share link produce the same document.

import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import {
  GRN_STATUS_LABELS,
  type GrnStatus,
  type InspectionStatus,
} from "@/types/grn/type";
import type {
  LetterheadBlock,
  LocationLetterhead,
} from "@/types/letterhead/type";

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

export const GRN_DOCUMENT_STATUS_BADGE: Record<
  GrnStatus,
  { label: string; tone: "neutral" | "success" | "warning" | "danger" | "info" }
> = {
  DRAFT: { label: GRN_STATUS_LABELS.DRAFT, tone: "neutral" },
  INSPECTION_HOLD: { label: GRN_STATUS_LABELS.INSPECTION_HOLD, tone: "warning" },
  RECEIVED: { label: GRN_STATUS_LABELS.RECEIVED, tone: "success" },
  CANCELLED: { label: GRN_STATUS_LABELS.CANCELLED, tone: "neutral" },
};

export const buildGrnPageTitle = (
  locationName: string | null | undefined,
): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Goods Received Note`;
};

export const composeLetterheadAddress = (
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

// Structural common denominator of Grn and PublicGrn — just the fields the
// document needs, so either payload satisfies it without adapters.
export interface GrnDocumentSource {
  grnNumber: string;
  status: GrnStatus;
  currency: string | null;
  notes: string | null;
  receivedDate: string;
  supplierName?: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  deliveryPersonEmail: string | null;
  items: Array<{
    variantName: string;
    receivedQuantity: number;
    unitCost: number;
    batchNumber: string | null;
    expiryDate: string | null;
    inspectionStatus: InspectionStatus | null;
  }>;
}

export interface GrnDocument {
  data: BusinessDocumentData;
  theme: { primaryColor: string; secondaryColor: string };
  documentTitle: string;
}

export function buildGrnDocument(
  grn: GrnDocumentSource,
  letterheadPayload: LocationLetterhead | null,
): GrnDocument {
  const letterhead = letterheadPayload?.letterhead ?? null;
  const taxIds = letterheadPayload?.taxIds ?? null;
  const brand = letterheadPayload?.brand ?? null;
  const currency = grn.currency || DEFAULT_CURRENCY;
  const theme = {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
  const documentTitle = buildGrnPageTitle(letterhead?.locationName);

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
      status: GRN_DOCUMENT_STATUS_BADGE[grn.status],
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

  return { data, theme, documentTitle };
}

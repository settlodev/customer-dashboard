// Shared stock-transfer → BusinessDocument mapping used by BOTH the public
// share page (/dn/[token], sourced from PublicStockTransfer) and the
// authenticated print view (/stock-transfers/[id]/print, sourced from
// StockTransfer + a letterhead lookup). Keeping the assembly here is what
// guarantees "download as PDF" and the share link produce the same document.
//
// The document is a DELIVERY NOTE — the paper the driver carries. It is a
// quantities document: `hideAmounts` strips prices/totals, because internal
// transfer costs have no place on a sheet handed around loading bays.

import type {
  BusinessDocumentData,
  BusinessIdentity,
  LineItem,
  Party,
} from "@/components/documents";
import { composeLetterheadAddress } from "@/lib/grn-document";
import {
  TRANSFER_STATUS_LABELS,
  type TransferStatus,
} from "@/types/stock-transfer/type";
import type { LocationLetterhead } from "@/types/letterhead/type";

const SETTLO_PRIMARY = "#ED7B40";
const SETTLO_SECONDARY = "#1E293B";

const TRANSFER_DOCUMENT_STATUS_TONES: Record<
  TransferStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  REQUESTED: "neutral",
  CONFIRMED: "neutral",
  DISPATCHED: "info",
  PARTIALLY_RECEIVED: "warning",
  PENDING_MAPPING: "warning",
  RECEIVED: "success",
  ACCEPTED: "neutral",
  REJECTED: "danger",
  DECLINED: "danger",
  RETURN_IN_TRANSIT: "warning",
  RETURNED: "neutral",
  CANCELLED: "neutral",
};

export const buildTransferNotePageTitle = (
  locationName: string | null | undefined,
): string => {
  const name = locationName?.trim() || "Settlo";
  return `${name} - Delivery Note`;
};

const formatSignatureDate = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Structural common denominator of StockTransfer and PublicStockTransfer —
// just the fields the document needs, so either payload satisfies it.
export interface TransferDocumentSource {
  transferNumber: string;
  status: TransferStatus;
  notes: string | null;
  transferDate: string;
  receivedDate: string | null;
  sourceLocationName: string | null;
  destinationLocationName: string | null;
  transferredByName: string | null;
  receivedByName?: string | null;
  items: Array<{
    variantName: string;
    quantity: number;
    baseUnitName?: string | null;
  }>;
}

export interface TransferDocument {
  data: BusinessDocumentData;
  theme: { primaryColor: string; secondaryColor: string };
  documentTitle: string;
}

export function buildTransferDeliveryNote(
  transfer: TransferDocumentSource,
  letterheadPayload: LocationLetterhead | null,
): TransferDocument {
  const letterhead = letterheadPayload?.letterhead ?? null;
  const taxIds = letterheadPayload?.taxIds ?? null;
  const brand = letterheadPayload?.brand ?? null;
  const theme = {
    primaryColor: brand?.primaryColor?.trim() || SETTLO_PRIMARY,
    secondaryColor: brand?.secondaryColor?.trim() || SETTLO_SECONDARY,
  };
  const documentTitle = buildTransferNotePageTitle(
    letterhead?.locationName ?? transfer.sourceLocationName,
  );

  const issuer: BusinessIdentity = {
    // Transfers can leave from a store or warehouse, which has no
    // LocationReference letterhead — fall back to the plain source name.
    name:
      letterhead?.businessName ?? transfer.sourceLocationName ?? "Business",
    logoUrl: letterhead?.logoUrl ?? undefined,
    addressLines: composeLetterheadAddress(letterhead),
    phone: letterhead?.phone ?? undefined,
    email: letterhead?.email ?? undefined,
    website: letterhead?.website ?? undefined,
    tin: taxIds?.tin ?? undefined,
    vrn: taxIds?.vrn ?? undefined,
  };

  const recipient: Party = {
    name: transfer.destinationLocationName || "Destination",
    addressLines: [],
  };

  const items: LineItem[] = transfer.items.map((item) => ({
    name: item.variantName || "—",
    quantity: Number(item.quantity || 0),
    unitPrice: 0,
    unitOfMeasure: item.baseUnitName ?? undefined,
  }));

  const data: BusinessDocumentData = {
    meta: {
      type: "delivery_note",
      documentNumber: transfer.transferNumber,
      issueDate: transfer.transferDate,
      referenceNumber: transfer.sourceLocationName
        ? `From ${transfer.sourceLocationName}`
        : undefined,
      status: {
        label: TRANSFER_STATUS_LABELS[transfer.status] ?? transfer.status,
        tone: TRANSFER_DOCUMENT_STATUS_TONES[transfer.status] ?? "neutral",
      },
    },
    issuer,
    recipient,
    items,
    totals: { subtotal: 0, total: 0, amountDue: 0 },
    hideAmounts: true,
    currency: "TZS", // required by the template but never rendered (hideAmounts)
    notes: transfer.notes ?? undefined,
    footerMessage: "",
    signatures: [
      {
        label: "Dispatched by",
        name: transfer.transferredByName ?? undefined,
        date: formatSignatureDate(transfer.transferDate),
      },
      { label: "Driver / Carrier" },
      {
        label: "Received by",
        name: transfer.receivedByName ?? undefined,
        date: formatSignatureDate(transfer.receivedDate),
      },
    ],
  };

  return { data, theme, documentTitle };
}

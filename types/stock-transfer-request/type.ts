import type { DestinationType } from "@/types/catalogue/enums";

/**
 * A destination-initiated stock transfer *request* (the approval flow that
 * precedes a real stock transfer). The active destination raises a request to
 * pull stock FROM a source; the source then approves (optionally trimming
 * quantities), which mints a real StockTransfer the source dispatches via the
 * existing transfer lifecycle.
 *
 * Mirrors the Inventory Service `TransferRequestResponse`.
 */
export type TransferRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "CANCELLED";

export interface TransferRequest {
  id: string;
  requestNumber: string;
  /** The destination that raised the request (the requester). */
  requestingLocationType: DestinationType;
  requestingLocationId: string;
  requestingLocationName: string | null;
  /** The destination the stock is being requested FROM (the approver). */
  sourceLocationType: DestinationType;
  sourceLocationId: string;
  sourceLocationName: string | null;
  status: TransferRequestStatus;
  requestedBy: string;
  requestedByName: string | null;
  requestedAt: string | null;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  declineReason: string | null;
  /** The StockTransfer minted on approval — present once APPROVED. */
  resultingTransferId: string | null;
  notes: string | null;
  items: TransferRequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequestItem {
  id: string;
  stockVariantId: string;
  variantName: string;
  requestedQuantity: number;
  /** Set on approval — may be trimmed below requestedQuantity; null while PENDING. */
  approvedQuantity: number | null;
  notes: string | null;
}

export const TRANSFER_REQUEST_STATUS_LABELS: Record<TransferRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export const TRANSFER_REQUEST_STATUS_COLORS: Record<TransferRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  DECLINED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

/**
 * Side-aware status label. Only PENDING differs by viewer: the source owes
 * a decision, the requester is just waiting. Every other status
 * (APPROVED/DECLINED/CANCELLED) reads identically on both sides.
 */
export function getTransferRequestStatusLabel(
  request: Pick<TransferRequest, "status" | "sourceLocationId" | "requestingLocationId">,
  activeDestinationId: string | null,
): string {
  const isSource =
    !!activeDestinationId && activeDestinationId === request.sourceLocationId;

  if (isSource && request.status === "PENDING") {
    return "Awaiting your decision";
  }
  return TRANSFER_REQUEST_STATUS_LABELS[request.status] ?? request.status;
}

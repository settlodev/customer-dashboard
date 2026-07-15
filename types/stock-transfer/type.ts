import type { DestinationType } from "@/types/catalogue/enums";

export type TransferStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DISPATCHED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "ACCEPTED"
  | "DECLINED"
  | "RETURN_IN_TRANSIT"
  | "RETURNED"
  | "CANCELLED";

export type TransferType =
  | "SUPPLY"
  | "RETURN"
  | "RETURN_TO_STORE"
  | "INTER_LOCATION"
  | "INTER_STORE";

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceLocationType: DestinationType;
  sourceLocationId: string;
  sourceLocationName: string | null;
  destinationLocationType: DestinationType;
  destinationLocationId: string;
  destinationLocationName: string | null;
  transferType: TransferType | null;
  status: TransferStatus;
  transferredBy: string;
  transferredByName: string | null;
  transferDate: string;
  receivedBy: string | null;
  receivedByName: string | null;
  receivedDate: string | null;
  notes: string | null;
  declinedBy: string | null;
  declinedByName: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  returnedAt: string | null;
  /** Currency of item costs — source location's base currency. */
  currency: string | null;
  items: StockTransferItem[];
  /** Snapshot: this transfer needs the destination to Accept before dispatch. */
  approvalRequired: boolean;
  /** Derived (approvalRequired && status === "REQUESTED") — drives Accept/Reject. */
  awaitingApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  id: string;
  stockVariantId: string;
  variantName: string;
  quantity: number;
  unitCost: number | null;
  receivedQuantity: number | null;
  /** Inherited from the parent transfer (source location currency). */
  currency: string | null;
}

/**
 * A selectable transfer destination, flattened across the three destination
 * kinds (location / store / warehouse) so a single picker can list them all.
 * `subline` is a short disambiguator — region for locations, code for
 * stores/warehouses.
 */
export interface DestinationOption {
  id: string;
  name: string;
  type: DestinationType;
  subline?: string;
}

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  DISPATCHED: "Dispatched",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  RETURN_IN_TRANSIT: "Return In Transit",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

function resolveTransferSide(
  transfer: Pick<StockTransfer, "sourceLocationId" | "destinationLocationId">,
  activeDestinationId: string | null,
): "SOURCE" | "DESTINATION" | null {
  if (!activeDestinationId) return null;
  if (activeDestinationId === transfer.sourceLocationId) return "SOURCE";
  if (activeDestinationId === transfer.destinationLocationId) return "DESTINATION";
  return null;
}

const SOURCE_STATUS_LABEL_OVERRIDES: Partial<Record<TransferStatus, string>> = {
  DECLINED: "Declined — return pending",
};

const DESTINATION_STATUS_LABEL_OVERRIDES: Partial<Record<TransferStatus, string>> = {
  DISPATCHED: "In Transit",
  DECLINED: "Declined by you",
  RETURN_IN_TRANSIT: "Returning",
};

/**
 * Side-aware status label — overrides TRANSFER_STATUS_LABELS only where the
 * meaning genuinely differs by viewer (e.g. DISPATCHED reads "In Transit" at
 * the destination). Falls back to the side-independent map when the viewer's
 * side can't be resolved (activeDestinationId is null or matches neither end).
 */
export function getTransferStatusLabel(
  transfer: Pick<
    StockTransfer,
    "status" | "sourceLocationId" | "destinationLocationId" | "awaitingApproval"
  >,
  activeDestinationId: string | null,
): string {
  const side = resolveTransferSide(transfer, activeDestinationId);

  if (side === "DESTINATION" && transfer.status === "REQUESTED") {
    return transfer.awaitingApproval
      ? "Awaiting your approval"
      : TRANSFER_STATUS_LABELS.REQUESTED;
  }
  if (side === "SOURCE") {
    return (
      SOURCE_STATUS_LABEL_OVERRIDES[transfer.status] ??
      TRANSFER_STATUS_LABELS[transfer.status] ??
      transfer.status
    );
  }
  if (side === "DESTINATION") {
    return (
      DESTINATION_STATUS_LABEL_OVERRIDES[transfer.status] ??
      TRANSFER_STATUS_LABELS[transfer.status] ??
      transfer.status
    );
  }
  return TRANSFER_STATUS_LABELS[transfer.status] ?? transfer.status;
}

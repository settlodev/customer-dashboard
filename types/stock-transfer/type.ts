import type { DestinationType } from "@/types/catalogue/enums";

export type TransferStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DISPATCHED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  /** Received on the source side, but ≥1 line has no destination-catalogue match yet. */
  | "PENDING_MAPPING"
  | "ACCEPTED"
  /** Destination refused a pending (pre-dispatch) transfer. Terminal, no stock moved. */
  | "REJECTED"
  | "DECLINED"
  | "RETURN_IN_TRANSIT"
  | "RETURNED"
  | "CANCELLED";

/**
 * How a transfer line resolved against the DESTINATION's own catalogue at
 * dispatch. PENDING lines are not credited at receive — the destination must
 * map them (link or create) via the reconcile flow. AUTO_UNCONFIRMED is a
 * fuzzy auto-match: credited like RESOLVED, surfaced so a human can spot a
 * wrong guess. Null on rows that pre-date the mapping feature.
 */
export type TransferItemMappingStatus = "RESOLVED" | "AUTO_UNCONFIRMED" | "PENDING";

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
  /** Public delivery-note link token — null until shared (mirrors GRN sharing). */
  shareToken?: string | null;
  shareTokenIssuedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statuses at which the delivery note exists as a document — the goods have
 * physically left the source, so there is something for a driver to carry
 * (and, later, an audit record of what was shipped).
 */
export const TRANSFER_DOCUMENT_STATUSES: TransferStatus[] = [
  "DISPATCHED",
  "PARTIALLY_RECEIVED",
  "PENDING_MAPPING",
  "RECEIVED",
  "DECLINED",
  "RETURN_IN_TRANSIT",
  "RETURNED",
];

/** Public (share-token) delivery-note payload — no costs, letterhead embedded. */
export interface PublicStockTransferItem {
  variantName: string;
  quantity: number;
  receivedQuantity: number | null;
  baseUnitName: string | null;
}

export interface PublicStockTransfer {
  id: string;
  transferNumber: string;
  status: TransferStatus;
  notes: string | null;
  transferDate: string;
  receivedDate: string | null;
  createdAt: string;
  shareTokenIssuedAt: string | null;
  sourceLocationName: string | null;
  destinationLocationName: string | null;
  transferredByName: string | null;
  receivedByName: string | null;
  items: PublicStockTransferItem[];
  letterhead: import("@/types/letterhead/type").LocationLetterhead | null;
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
  /** Base unit the line's quantities are expressed in (the source variant's unit). */
  baseUnitId?: string | null;
  baseUnitName?: string | null;
  mappingStatus?: TransferItemMappingStatus | null;
  /** The destination catalogue's own variant this line is credited to once mapped. */
  resolvedDestVariantId?: string | null;
  resolvedDestVariantName?: string | null;
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
  PENDING_MAPPING: "Pending Item Mapping",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  DECLINED: "Declined",
  RETURN_IN_TRANSIT: "Return In Transit",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

/**
 * Status badge colours, shared by the list table and the detail header so the
 * two can't drift. Typed against TransferStatus so a new status won't compile
 * until it gets a colour (and, above, a label).
 */
export const TRANSFER_STATUS_COLORS: Record<TransferStatus, string> = {
  REQUESTED: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-cyan-50 text-cyan-700",
  DISPATCHED: "bg-indigo-50 text-indigo-700",
  PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700",
  RECEIVED: "bg-emerald-50 text-emerald-700",
  PENDING_MAPPING: "bg-violet-50 text-violet-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-rose-50 text-rose-700",
  DECLINED: "bg-red-50 text-red-700",
  RETURN_IN_TRANSIT: "bg-orange-50 text-orange-700",
  RETURNED: "bg-gray-50 text-gray-700",
  CANCELLED: "bg-gray-100 text-gray-500",
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
  PENDING_MAPPING: "Awaiting destination mapping",
};

const DESTINATION_STATUS_LABEL_OVERRIDES: Partial<Record<TransferStatus, string>> = {
  DISPATCHED: "In Transit",
  DECLINED: "Declined by you",
  REJECTED: "Rejected by you",
  RETURN_IN_TRANSIT: "Returning",
  PENDING_MAPPING: "Needs item mapping",
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

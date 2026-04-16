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

export type TransferType = "SUPPLY" | "RETURN" | "RETURN_TO_STORE" | "INTER_LOCATION";

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
  items: StockTransferItem[];
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

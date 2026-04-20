// ── Serial numbers ─────────────────────────────────────────────────

export type SerialNumberStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "RETURNED"
  | "DAMAGED";

export interface SerialNumber {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  locationId: string;
  serialNumber: string;
  status: SerialNumberStatus;
  batchId: string | null;
  grnId: string | null;
  soldMovementId: string | null;
  notes: string | null;
  createdAt: string;
}

export const SERIAL_STATUS_LABELS: Record<SerialNumberStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RETURNED: "Returned",
  DAMAGED: "Damaged",
};

export const SERIAL_STATUS_TONES: Record<SerialNumberStatus, string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  RESERVED: "bg-amber-50 text-amber-700",
  SOLD: "bg-gray-50 text-gray-600",
  RETURNED: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-red-50 text-red-700",
};

// ── Batches (subset used for recall) ───────────────────────────────

export type BatchStatus = "ACTIVE" | "EXPIRED" | "RECALLED" | "DEPLETED";

export interface StockBatchSummary {
  id: string;
  batchNumber: string;
  locationId: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  quantityOnHand: number;
  initialQuantity: number;
  unitCost: number | null;
  currency: string | null;
  expiryDate: string | null;
  status: BatchStatus;
  receivedDate: string | null;
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  RECALLED: "Recalled",
  DEPLETED: "Depleted",
};

export const BATCH_STATUS_TONES: Record<BatchStatus, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  RECALLED: "bg-red-50 text-red-700",
  DEPLETED: "bg-gray-50 text-gray-600",
};

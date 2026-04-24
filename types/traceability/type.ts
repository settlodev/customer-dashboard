// ── Serial numbers ─────────────────────────────────────────────────

export type SerialNumberStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "RETURNED"
  | "DAMAGED"
  | "LOST"
  | "EXPIRED"
  | "WRITTEN_OFF"
  | "RECALLED";

export interface SerialNumber {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  locationId: string;
  serialNumber: string;
  status: SerialNumberStatus;
  batchId: string | null;
  batchNumber: string | null;
  grnId: string | null;
  soldMovementId: string | null;
  // Denormalised trace context — populated by the search endpoint so the
  // UI can render a full row without N more round-trips. May be null when
  // the serial has no batch, no supplier, or the sold movement is missing.
  supplierId: string | null;
  supplierName: string | null;
  receivedDate: string | null;
  saleReferenceId: string | null;
  saleReferenceType: string | null;
  notes: string | null;
  createdAt: string;
}

export const SERIAL_STATUS_LABELS: Record<SerialNumberStatus, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  RETURNED: "Returned",
  DAMAGED: "Damaged",
  LOST: "Lost",
  EXPIRED: "Expired",
  WRITTEN_OFF: "Written off",
  RECALLED: "Recalled",
};

export const SERIAL_STATUS_TONES: Record<SerialNumberStatus, string> = {
  AVAILABLE: "bg-green-50 text-green-700",
  RESERVED: "bg-amber-50 text-amber-700",
  SOLD: "bg-gray-50 text-gray-600",
  RETURNED: "bg-blue-50 text-blue-700",
  DAMAGED: "bg-red-50 text-red-700",
  LOST: "bg-red-50 text-red-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  WRITTEN_OFF: "bg-gray-200 text-gray-700",
  RECALLED: "bg-red-100 text-red-800",
};

export interface SerialEvent {
  id: string;
  status: SerialNumberStatus;
  previousStatus: SerialNumberStatus | null;
  movementId: string | null;
  referenceType: string | null;
  referenceId: string | null;
  actorUserId: string | null;
  notes: string | null;
  occurredAt: string;
}

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
  // Populated when the batch was recalled at any point. Retained across revert
  // so a reader of the row alone can see the full history.
  recallReason: string | null;
  recalledAt: string | null;
  recalledBy: string | null;
  // Populated when a prior recall was reverted. Null for never-reverted rows;
  // cleared when a fresh recall is issued.
  recallRevertedAt: string | null;
  recallRevertReason: string | null;
  recallRevertedBy: string | null;
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

// ── Pre-recall impact preview ──────────────────────────────────────

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE"
  | "RECIPE_USAGE"
  | "OPENING_BALANCE"
  | "WASTE"
  | "PRODUCTION_ISSUE"
  | "PRODUCTION_OUTPUT"
  | "RECALL";

export type MovementReferenceType =
  | "GRN"
  | "SALE_ORDER"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RETURN"
  | "CONSUMPTION_RULE"
  | "STOCK_MODIFICATION"
  | "OPENING_STOCK"
  | "STOCK_INTAKE"
  | "SUPPLIER_RETURN"
  | "ORDER_VOID"
  | "BOM_RULE"
  | "PRODUCTION_ORDER"
  | "BATCH_RECALL";

export interface BatchMovement {
  id: string;
  locationId: string;
  locationType: string;
  stockVariantId: string;
  stockVariantName: string | null;
  stockName: string | null;
  movementType: MovementType;
  referenceType: MovementReferenceType | null;
  referenceId: string | null;
  quantity: number;
  baseQuantity: number;
  unitCost: number | null;
  currency: string | null;
  batchId: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface BatchImpact {
  batchNumber: string;
  affectedBatchCount: number;
  totalOnHand: number;
  totalReceived: number;
  totalConsumed: number;
  batches: BatchImpactRow[];
  movementImpacts: BatchImpactMovement[];
  windowFrom: string | null;
  windowTo: string | null;
}

export interface AffectedOrder {
  orderId: string;
  totalQuantity: number;
  firstOccurredAt: string | null;
}

export interface BatchImpactRow {
  batchId: string;
  locationType: string;
  locationId: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  status: BatchStatus;
  quantityOnHand: number;
  initialQuantity: number;
  expiryDate: string | null;
  receivedDate: string | null;
}

export interface BatchImpactMovement {
  movementType: MovementType;
  locationId: string;
  totalBaseQuantity: number;
  movementCount: number;
}

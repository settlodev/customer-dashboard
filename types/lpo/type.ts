import type { DestinationType } from "@/types/catalogue/enums";

// ── Status enum (matches backend exactly — no SENT) ────────────────

export type LpoStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

// ── Entities ───────────────────────────────────────────────────────

export interface Lpo {
  id: string;
  lpoNumber: string;
  supplierId: string;
  locationType: DestinationType;
  locationId: string;
  status: LpoStatus;
  /** LPO-level primary currency — inferred from the first item. Line-level
   *  `items[].currency` is authoritative when items span multiple currencies. */
  currency: string | null;
  notes: string | null;
  items: LpoItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LpoItem {
  id: string;
  stockVariantId: string;
  variantName: string | null;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  /** Supplier-quoted currency for this line. Preserved for GRN receive-time
   *  conversion to the location's base currency. */
  currency: string | null;
}

// ── Request payloads ───────────────────────────────────────────────

export interface CreateLpoItemPayload {
  stockVariantId: string;
  orderedQuantity: number;
  unitCost: number;
  currency?: string;
}

export interface CreateLpoPayload {
  supplierId: string;
  locationType: DestinationType;
  notes?: string;
  items: CreateLpoItemPayload[];
}

export interface UpdateLpoStatusPayload {
  status: LpoStatus;
}

// ── Display helpers ────────────────────────────────────────────────

export const LPO_STATUS_LABELS: Record<LpoStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const LPO_STATUS_TONES: Record<LpoStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-indigo-50 text-indigo-700",
  PARTIALLY_RECEIVED: "bg-amber-50 text-amber-700",
  RECEIVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

/** LPOs whose goods can still be received — used by GRN LPO picker. */
export const OPEN_LPO_STATUSES: LpoStatus[] = ["APPROVED", "PARTIALLY_RECEIVED"];

/**
 * State-machine transitions allowed by the backend. Mirrors
 * {@code LpoService.validateStatusTransition}. CANCELLED is allowed from any
 * state except RECEIVED — encoded separately for clarity.
 */
export const LPO_NEXT_STATUSES: Record<LpoStatus, LpoStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED"],
  APPROVED: ["PARTIALLY_RECEIVED", "RECEIVED"],
  PARTIALLY_RECEIVED: ["RECEIVED"],
  RECEIVED: [],
  CANCELLED: [],
};

/** True when the LPO can be cancelled — any status except RECEIVED/CANCELLED. */
export function canCancelLpo(status: LpoStatus): boolean {
  return status !== "RECEIVED" && status !== "CANCELLED";
}

/** True when the LPO can be soft-deleted. Only DRAFT, per backend. */
export function canDeleteLpo(status: LpoStatus): boolean {
  return status === "DRAFT";
}

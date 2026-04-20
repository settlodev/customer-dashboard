import type { DestinationType } from "@/types/catalogue/enums";

// ── Status enums (match backend exactly) ────────────────────────────

export type GrnStatus = "DRAFT" | "INSPECTION_HOLD" | "RECEIVED" | "CANCELLED";

export type InspectionStatus = "PENDING" | "PASSED" | "FAILED" | "PARTIAL";

export type LandedCostType = "FREIGHT" | "CUSTOMS" | "INSURANCE" | "HANDLING" | "OTHER";

// ── GRN entities ────────────────────────────────────────────────────

export interface Grn {
  id: string;
  grnNumber: string;
  lpoId: string | null;
  supplierId: string;
  /** Populated via LPO/supplier join — may be null if resolution fails. */
  supplierName?: string | null;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  receivedBy: string;
  receivedByName: string | null;
  receivedDate: string;
  status: GrnStatus;
  /** Location base currency — the currency all `unitCost` values are stored in. */
  currency: string | null;
  notes: string | null;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  deliveryPersonEmail: string | null;
  items: GrnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GrnItem {
  id: string;
  stockVariantId: string;
  variantName: string;
  receivedQuantity: number;
  /** Converted unit cost in the location's base currency. */
  unitCost: number;
  /** Settlement currency — matches the location's base currency. */
  currency: string | null;
  /** Supplier-invoiced currency (may differ from `currency` on foreign purchases). */
  originalCurrency: string | null;
  /** Supplier's per-unit price in `originalCurrency`. */
  originalUnitCost: number | null;
  /** Exchange rate captured at receive time. */
  rateUsed: number | null;
  batchNumber: string | null;
  supplierBatchReference: string | null;
  expiryDate: string | null;
  inspectionStatus: InspectionStatus | null;
  inspectedQuantity: number | null;
  rejectedQuantity: number | null;
}

export interface LandedCost {
  id: string;
  grnId: string;
  costType: LandedCostType;
  amount: number;
  currency: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Request payloads ────────────────────────────────────────────────

export interface CreateGrnItemPayload {
  stockVariantId: string;
  receivedQuantity: number;
  unitCost: number;
  batchNumber?: string;
  supplierBatchReference?: string;
  expiryDate?: string;
  serialNumbers?: string[];
}

export interface CreateGrnPayload {
  lpoId?: string;
  supplierId: string;
  locationType: DestinationType;
  receivedBy: string;
  receivedDate: string;
  notes?: string;
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryPersonEmail?: string;
  items: CreateGrnItemPayload[];
}

export interface AddLandedCostPayload {
  costType: LandedCostType;
  amount: number;
  description?: string;
}

export interface RecordInspectionPayload {
  inspectionStatus: InspectionStatus;
  inspectedQuantity?: number;
  rejectedQuantity?: number;
}

// ── Display helpers ─────────────────────────────────────────────────

export const GRN_STATUS_LABELS: Record<GrnStatus, string> = {
  DRAFT: "Draft",
  INSPECTION_HOLD: "On Inspection Hold",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const GRN_STATUS_TONES: Record<GrnStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  INSPECTION_HOLD: "bg-indigo-50 text-indigo-700",
  RECEIVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  PARTIAL: "Partial",
};

export const INSPECTION_STATUS_TONES: Record<InspectionStatus, string> = {
  PENDING: "bg-gray-50 text-gray-700",
  PASSED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  PARTIAL: "bg-amber-50 text-amber-700",
};

export const LANDED_COST_TYPE_OPTIONS: { value: LandedCostType; label: string }[] = [
  { value: "FREIGHT", label: "Freight" },
  { value: "CUSTOMS", label: "Customs" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "HANDLING", label: "Handling" },
  { value: "OTHER", label: "Other" },
];

export const INSPECTION_STATUS_OPTIONS: { value: InspectionStatus; label: string }[] = [
  { value: "PASSED", label: "Passed — all items good" },
  { value: "PARTIAL", label: "Partial — some rejected" },
  { value: "FAILED", label: "Failed — nothing accepted" },
];

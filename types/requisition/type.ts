import type { DestinationType } from "@/types/catalogue/enums";

// ── Enums (match backend) ──────────────────────────────────────────

export type RequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_LPO"
  | "CANCELLED";

export type RequisitionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

// ── Entities ───────────────────────────────────────────────────────

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  locationType: DestinationType;
  locationId: string;
  businessId: string;
  requestedBy: string;
  requestedByName: string | null;
  status: RequisitionStatus;
  currency: string | null;
  priority: RequisitionPriority;
  requiredByDate: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedByName: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  convertedLpoId: string | null;
  convertedAt: string | null;
  notes: string | null;
  items: RequisitionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface RequisitionItem {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  requestedQuantity: number;
  estimatedUnitCost: number | null;
  currency: string | null;
  preferredSupplierId: string | null;
  notes: string | null;
}

// ── Payloads ───────────────────────────────────────────────────────

export interface CreateRequisitionItemPayload {
  stockVariantId: string;
  requestedQuantity: number;
  estimatedUnitCost?: number;
  preferredSupplierId?: string;
  notes?: string;
}

export interface CreateRequisitionPayload {
  locationType: DestinationType;
  priority?: RequisitionPriority;
  requiredByDate?: string;
  notes?: string;
  items: CreateRequisitionItemPayload[];
}

// ── Display helpers ────────────────────────────────────────────────

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED_TO_LPO: "Converted to LPO",
  CANCELLED: "Cancelled",
};

export const REQUISITION_STATUS_TONES: Record<RequisitionStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED: "bg-indigo-50 text-indigo-700",
  REJECTED: "bg-red-50 text-red-700",
  CONVERTED_TO_LPO: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export const PRIORITY_LABELS: Record<RequisitionPriority, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_TONES: Record<RequisitionPriority, string> = {
  LOW: "bg-gray-50 text-gray-600",
  NORMAL: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-red-700",
};

export const PRIORITY_OPTIONS: { value: RequisitionPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function canSubmitRequisition(status: RequisitionStatus): boolean {
  return status === "DRAFT";
}

export function canApproveRequisition(status: RequisitionStatus): boolean {
  return status === "SUBMITTED";
}

export function canCancelRequisition(status: RequisitionStatus): boolean {
  return status === "DRAFT" || status === "SUBMITTED";
}

export function canConvertRequisition(status: RequisitionStatus): boolean {
  return status === "APPROVED";
}

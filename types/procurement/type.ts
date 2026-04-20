import type { DestinationType } from "@/types/catalogue/enums";

// ── Purchase Requisition ────────────────────────────────────────────

export type RequisitionStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONVERTED" | "CANCELLED";
export type RequisitionPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  locationType: DestinationType;
  locationId: string;
  businessId: string;
  requestedBy: string;
  requestedByName: string | null;
  status: RequisitionStatus;
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
  variantName: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
  unitId: string;
  unitName: string;
  estimatedUnitCost: number | null;
  notes: string | null;
}

// ── Supplier Order ──────────────────────────────────────────────────

export type SupplierOrderStatus = "DRAFT" | "SUBMITTED" | "CONFIRMED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface SupplierOrder {
  id: string;
  accountId: string;
  locationType: DestinationType;
  locationId: string;
  supplierId: string | null;
  settloSupplierId: string | null;
  loanApplicationId: string | null;
  totalAmount: number;
  status: SupplierOrderStatus;
  orderReference: string;
  notes: string | null;
  items: SupplierOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierOrderItem {
  id: string;
  stockVariantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ── Labels ──────────────────────────────────────────────────────────

export const REQUISITION_STATUS_LABELS: Record<RequisitionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CONVERTED: "Converted to LPO",
  CANCELLED: "Cancelled",
};


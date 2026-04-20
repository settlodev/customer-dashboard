import type { DestinationType } from "@/types/catalogue/enums";

export type SupplierReturnStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

export interface SupplierReturn {
  id: string;
  returnNumber: string;
  supplierId: string;
  locationType: DestinationType;
  locationId: string;
  grnId: string | null;
  status: SupplierReturnStatus;
  currency: string | null;
  reason: string | null;
  returnedBy: string | null;
  returnedByName: string | null;
  returnDate: string | null;
  notes: string | null;
  items: SupplierReturnItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierReturnItem {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  quantity: number;
  unitCost: number | null;
  currency: string | null;
  originalCurrency: string | null;
  originalUnitCost: number | null;
  rateUsed: number | null;
  reason: string | null;
}

export interface CreateSupplierReturnItemPayload {
  stockVariantId: string;
  quantity: number;
  unitCost?: number;
  currency?: string;
  reason?: string;
}

export interface CreateSupplierReturnPayload {
  supplierId: string;
  locationType: DestinationType;
  grnId?: string;
  reason?: string;
  notes?: string;
  items: CreateSupplierReturnItemPayload[];
}

export const SUPPLIER_RETURN_STATUS_LABELS: Record<SupplierReturnStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SUPPLIER_RETURN_STATUS_TONES: Record<SupplierReturnStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  DISPATCHED: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function canConfirmReturn(status: SupplierReturnStatus): boolean {
  return status === "DRAFT";
}

export function canDispatchReturn(status: SupplierReturnStatus): boolean {
  return status === "CONFIRMED";
}

export function canCompleteReturn(status: SupplierReturnStatus): boolean {
  return status === "DISPATCHED";
}

export function canCancelReturn(status: SupplierReturnStatus): boolean {
  return status === "DRAFT" || status === "CONFIRMED";
}

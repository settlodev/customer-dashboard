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
  /** Header override: this return's unit costs are tax-inclusive. */
  pricesIncludeTax?: boolean;
  /** Sum of line net amounts, base currency. */
  netAmount?: number;
  /** Sum of line tax amounts credited, base currency — recoverable or memo depending on `SupplierReturnItem.taxRecoverable`. */
  taxAmount?: number;
  /** Gross — `netAmount + taxAmount`. Equals `netAmount` when there is no recoverable tax. */
  totalAmount?: number;
  reason: string | null;
  returnedBy: string | null;
  returnedByName: string | null;
  returnDate: string | null;
  notes: string | null;
  shareToken: string | null;
  shareTokenIssuedAt: string | null;
  items: SupplierReturnItem[];
  createdAt: string;
  updatedAt: string;
}

// Public payload returned by GET /api/v1/public/supplier-returns/{token}.
export interface PublicSupplierReturn {
  id: string;
  returnNumber: string;
  status: SupplierReturnStatus;
  currency: string | null;
  reason: string | null;
  notes: string | null;
  returnDate: string | null;
  createdAt: string;
  shareTokenIssuedAt: string | null;
  supplierId: string;
  supplierName: string | null;
  items: PublicSupplierReturnItem[];
  letterhead: import("@/types/letterhead/type").LocationLetterhead | null;
}

export interface PublicSupplierReturnItem {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  quantity: number;
  unitCost: number | null;
  currency: string | null;
  reason: string | null;
  /** Snapshot of the tax type applied — line override, else the stock item's default. `null` = no tax. */
  taxTypeId?: string | null;
  /** Rate snapshot at the time this line was written, e.g. `18` for 18%. */
  taxRatePercent?: number;
  /**
   * Line tax credited, base currency. Recoverable (added on top) or
   * memo-only (already inside `unitCost`) per `taxRecoverable`. Present on
   * the wire — `PublicSupplierReturnResponse` (Settlo Inventory Service)
   * reuses the same `SupplierReturnItemResponse` class as the authenticated
   * endpoint — just not previously declared on this type.
   */
  taxAmount?: number;
  /** Whether this business could reclaim `taxAmount` at document-write time — false means it is already folded into `unitCost`. */
  taxRecoverable?: boolean;
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
  /** Snapshot of the tax type applied — line override, else the stock item's default. `null` = no tax. */
  taxTypeId?: string | null;
  /** Rate snapshot at the time this line was written, e.g. `18` for 18%. */
  taxRatePercent?: number;
  /** Line tax credited, base currency. Recoverable (added on top) or memo-only (already inside `unitCost`) per `taxRecoverable`. */
  taxAmount?: number;
  /** Whether this business could reclaim `taxAmount` at document-write time — false means it is already folded into `unitCost`. */
  taxRecoverable?: boolean;
}

export interface CreateSupplierReturnItemPayload {
  stockVariantId: string;
  quantity: number;
  unitCost?: number;
  currency?: string;
  reason?: string;
  /** Per-line override. `null`/omitted falls through to the stock item's default. */
  taxTypeId?: string | null;
}

export interface CreateSupplierReturnPayload {
  supplierId: string;
  locationType: DestinationType;
  grnId?: string;
  reason?: string;
  notes?: string;
  /** This return's unit costs are tax-inclusive. */
  pricesIncludeTax?: boolean;
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
  DRAFT: "bg-muted text-ink-2",
  CONFIRMED: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  DISPATCHED: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  COMPLETED: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
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

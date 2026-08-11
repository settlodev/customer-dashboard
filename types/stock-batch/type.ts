export type BatchStatus = "ACTIVE" | "EXPIRED" | "RECALLED" | "DEPLETED";

export interface StockBatch {
  id: string;
  batchNumber: string;
  supplierBatchReference: string | null;
  locationId: string;
  stockVariantId: string;
  variantName: string;
  stockName: string;
  unitId: string;
  unitName: string;
  unitAbbreviation: string;
  divisibleUnitId: string | null;
  divisibleUnitName: string | null;
  divisibleUnitAbbreviation: string | null;
  divisibleUnitRatio: number | null;
  supplierId: string | null;
  grnId: string | null;
  expiryDate: string | null;
  quantityOnHand: number;
  initialQuantity: number;
  unitCost: number | null;
  receivedDate: string;
  status: BatchStatus;
  notes: string | null;
  /** Settlement currency — matches the location's base currency. */
  currency: string | null;
  /** Supplier's invoice currency (null for batches created before multi-currency). */
  originalCurrency: string | null;
  /** Supplier's per-unit price in `originalCurrency`. */
  originalUnitCost: number | null;
  /** Exchange rate locked at receive time. */
  rateUsed: number | null;
  createdAt: string;
  updatedAt: string;
}

export const BATCH_STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; color: string; bgColor: string }
> = {
  ACTIVE: {
    label: "Active",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  EXPIRED: {
    label: "Expired",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  RECALLED: {
    label: "Recalled",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  DEPLETED: {
    label: "Depleted",
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-muted/50",
  },
};

/**
 * One page of batches. The Inventory Service returns a raw Spring `Page`, whose
 * 0-based index field is `number` (not `page`, as the Reports Service uses) —
 * see {@link import("@/types/audit-log/type").AuditLogPage} for the same shape.
 */
export interface BatchPage {
  content: StockBatch[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Batch statuses in the order the panel's filter offers them. */
export const BATCH_STATUS_ORDER: BatchStatus[] = [
  "ACTIVE",
  "DEPLETED",
  "EXPIRED",
  "RECALLED",
];

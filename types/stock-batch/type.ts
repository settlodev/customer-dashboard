export type BatchStatus = "ACTIVE" | "EXPIRED" | "RECALLED" | "DEPLETED";

export interface StockBatch {
  id: string;
  batchNumber: string;
  supplierBatchReference: string | null;
  locationId: string;
  stockVariantId: string;
  variantName: string;
  stockName: string;
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
    bgColor: "bg-gray-50 dark:bg-gray-900",
  },
};

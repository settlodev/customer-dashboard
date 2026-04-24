import type { DestinationType } from "@/types/catalogue/enums";

export type StockIntakeRecordStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface StockIntakeRecord {
  id: string;
  referenceNumber: string;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  status: StockIntakeRecordStatus;
  notes: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  orderedDate: string | null;
  receivedDate: string | null;
  supplierId: string | null;
  /** Supplier name snapshotted at create time (stays faithful if supplier is later renamed). */
  supplierName: string | null;
  /** Supplier's own reference (delivery note, invoice number, etc). */
  supplierReference: string | null;
  /** Location's base currency (settlement currency for this intake). */
  currency: string | null;
  items: StockIntakeRecordItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StockIntakeRecordItem {
  id: string;
  stockVariantId: string;
  stockVariantName: string;
  stockVariantSku: string | null;
  quantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber: string | null;
  expiryDate: string | null;
  supplierBatchReference: string | null;
  notes: string | null;
  /** Settlement currency — always the location base currency. */
  currency: string | null;
  /** ISO 4217 code the user originally entered (may differ from `currency`). */
  originalCurrency: string | null;
  /** User-entered cost in `originalCurrency`. */
  originalUnitCost: number | null;
  /** Exchange rate captured at confirm time (originalCurrency → currency). */
  rateUsed: number | null;
  /** Per-unit serial numbers for serial-tracked variants. */
  serialNumbers: string[] | null;
}

export const STOCK_INTAKE_RECORD_STATUS_LABELS: Record<StockIntakeRecordStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

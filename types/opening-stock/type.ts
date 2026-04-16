import type { DestinationType } from "@/types/catalogue/enums";

export type OpeningStockStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface OpeningStock {
  id: string;
  referenceNumber: string;
  locationType: DestinationType;
  locationId: string;
  locationName: string | null;
  status: OpeningStockStatus;
  notes: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  confirmedByName: string | null;
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  items: OpeningStockItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OpeningStockItem {
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
}

export const OPENING_STOCK_STATUS_LABELS: Record<OpeningStockStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
};

import { UUID } from "crypto";

export declare interface StockPurchaseItem {
  stockVariantId: UUID;
  quantity: number;
  stockVariantName?: string;
}

export declare interface StockPurchase {
  id: UUID;
  supplier: UUID;
  supplierName: string;
  stockIntakePurchaseOrderItems: StockPurchaseItem[];
  deliveryDate: string;
  notes: string;
  dateCreated: string;
  dateModified?: string;
  shareLink: string;
  isArchived: boolean;
  canDelete: boolean;
}

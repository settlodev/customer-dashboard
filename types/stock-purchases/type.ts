import { UUID } from "crypto";

export declare interface StockPurchaseItem {
  id: UUID;
  stockVariantId: UUID;
  quantity: number;
  stockVariantName?: string;
  stock: string;
  stockName: string;
  stockVariant: string;
  unitCost: number;
}

export declare interface StockPurchase {
  id: UUID;
  supplier: UUID;
  supplierName: string;
  supplierEmail: string;
  supplierPhoneNumber: string;
  orderNumber: string;
  stockIntakePurchaseOrderItems: StockPurchaseItem[];
  deliveryDate: string;
  notes: string;
  dateCreated: string;
  dateModified?: string;
  shareLink: string;
  isArchived: boolean;
  canDelete: boolean;
  status: string;
}

export interface StockIntakeFromLPOItem {
  stockIntakePurchaseOrderItem: string;
  quantityReceived: number;
  totalCost: number;
}

export interface StockIntakeFromLPOPayload {
  staff: string;
  receivedAt: string;
  receivedItems: StockIntakeFromLPOItem[];
}

export interface StockIntakeFromLPOItem {
  stockIntakePurchaseOrderItem: string;
  quantityReceived: number;
  totalCost: number;
}

export interface StockIntakeFromLPOPayload {
  staff: string;
  receivedAt: string;
  receivedItems: StockIntakeFromLPOItem[];
}

export interface SubmissionItem {
  itemId: string;
  receivedQuantity: number;
  unitCost: number;
}

export interface SubmissionData {
  purchaseOrderId: string;
  items: SubmissionItem[];
}

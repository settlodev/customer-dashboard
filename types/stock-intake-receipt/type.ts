export declare interface StockPurchaseItem {
  id?: string;
  stockIntakePurchaseOrderItem: string | null;
  stock: string;
  stockName: string;
  stockVariant: string;
  stockVariantName: string;
  code?: string;
  quantityReceived: number;
  bonusQuantity?: number;
  totalCost: number;
  previousCostPerItem: number;
  lastCostPerItem?: number;
  sellingPrice?: number;
  margin?: number;
  condition?: "GOOD" | "DAMAGED" | "PARTIAL";
}

export interface StockReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderNumber: string;
  invoiceNumber?: string;
  receivedAt: string;
  dateReceived?: string;
  supplier: string;
  supplierName: string;
  supplierPhoneNumber?: string;
  supplierEmail?: string;
  staff: string;
  staffFirstName: string;
  staffLastName: string;
  businessName?: string;
  locationName?: string;
  locationEmail?: string;
  locationPhone?: string;
  locationAddress?: string;
  status?: "DRAFT" | "COMPLETED" | "CANCELLED" | "PARTIAL";
  condition?: "GOOD" | "DAMAGED" | "PARTIAL";
  notes?: string;
  stockIntakeReceiptItems: StockPurchaseItem[];
}

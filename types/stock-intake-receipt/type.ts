export declare interface StockPurchaseItem {
  stock: string;
  stockName: string;
  stockVariant: string;
  stockVariantName: string;
  quantityReceived: number;
  totalCost: number;
  previousCostPerItem: number;
  bonusQuantity?: number;
  lastCostPerItem?: number;
  sellingPrice?: number;
  margin?: number;
  code?: string;
  id?: string;
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
  supplierPhysicalAddress?: string;
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
  items: StockPurchaseItem[];
}

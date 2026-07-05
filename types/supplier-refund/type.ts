export type SupplierRefundStatus = "OWED" | "RECEIVED" | "CANCELLED";

export const SUPPLIER_REFUND_STATUS_LABELS: Record<SupplierRefundStatus, string> = {
  OWED: "Owed",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export interface SupplierRefund {
  id: string;
  slug: string;
  refundNumber: string;
  returnId: string;
  returnNumber: string;
  expenseId: string;
  supplierId?: string | null;
  amount: number;
  currencyCode: string;
  status: SupplierRefundStatus;
  receivedAmount?: number | null;
  cashAccountId?: string | null;
  cashAccountCode?: string | null;
  cashAccountName?: string | null;
  receivedDate?: string | null;
  reference?: string | null;
  notes?: string | null;
  journalEntryId?: string | null;
  locationId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

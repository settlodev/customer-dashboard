/**
 * Consolidated customer A/R invoices — one collection document over several
 * of a customer's unsettled signed bills, served by the Order Management
 * Service.
 *
 * These are NOT the Accounting Service's `Invoice` (see types/invoicing).
 * That one recognises revenue when it's issued; this one recognises nothing,
 * because signing each bill already did. It only groups receivables that are
 * already on the books so the customer can be billed for them once.
 */

/** The invoice document's own lifecycle. */
export type CustomerArInvoiceStatus = "OPEN" | "CANCELLED";

/**
 * Settlement state. Always derived server-side from the linked orders, so a
 * payment taken at the POS moves it without anything having to sync.
 */
export type CustomerArInvoicePaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "SETTLED";

export interface CustomerArInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  netAmount: number;
  taxTypeName?: string | null;
}

/** One signed bill on the invoice, with the items that made it up. */
export interface CustomerArInvoiceOrder {
  orderId: string;
  orderNumber?: string | null;
  openedDate?: string | null;
  closedDate?: string | null;
  businessDate?: string | null;
  orderNetAmount: number;
  /** What this bill owed when the invoice was cut. Frozen. */
  invoicedAmount: number;
  paidAmount: number;
  writtenOffAmount: number;
  outstandingAmount: number;
  items: CustomerArInvoiceItem[];
}

export interface CustomerArInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAccountNumber?: string | null;
  locationId: string;
  // ── Issuer letterhead, frozen at issue ─────────────────────────────
  locationName?: string | null;
  businessName?: string | null;
  locationAddress?: string | null;
  issuerTin?: string | null;
  issuerVrn?: string | null;
  issuerPhone?: string | null;
  issuerEmail?: string | null;
  locationCity?: string | null;
  locationRegion?: string | null;
  issuerCountry?: string | null;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  status: CustomerArInvoiceStatus;
  paymentStatus: CustomerArInvoicePaymentStatus;
  notes?: string | null;
  shareToken?: string | null;
  shareTokenIssuedAt?: string | null;
  totalAmount: number;
  paidAmount: number;
  writtenOffAmount: number;
  outstandingAmount: number;
  createdAt?: string | null;
  orders: CustomerArInvoiceOrder[];
}

export interface CustomerArInvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string | null;
  issueDate: string;
  dueDate?: string | null;
  status: CustomerArInvoiceStatus;
  paymentStatus: CustomerArInvoicePaymentStatus;
  currency: string;
  orderCount: number;
  /** Bills this invoice claims — used to grey out ones already covered. */
  orderIds: string[];
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  shareToken?: string | null;
}

export interface CustomerArInvoiceShare {
  invoiceId: string;
  invoiceNumber: string;
  shareToken?: string | null;
  shareTokenIssuedAt?: string | null;
}

export interface CustomerArInvoicePaymentResult {
  invoiceId: string;
  invoiceNumber: string;
  amountApplied: number;
  outstandingAfter: number;
  allocations: Array<{
    orderId: string;
    orderNumber?: string | null;
    amountApplied: number;
    outstandingAfter: number;
  }>;
}

/**
 * A customer's unsettled signed bill, straight off the OMS statement
 * endpoint — the candidates for a consolidated invoice.
 */
export interface CustomerSignedBill {
  id: string;
  orderNumber?: string | null;
  openedDate?: string | null;
  closedDate?: string | null;
  businessDate?: string | null;
  netAmount?: number | null;
  signedAmount?: number | null;
  orderStatus?: string | null;
  items?: Array<{ name?: string | null; quantity?: number | null }>;
}

export const AR_INVOICE_PAYMENT_LABELS: Record<
  CustomerArInvoicePaymentStatus,
  string
> = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Part paid",
  SETTLED: "Settled",
};

export const AR_INVOICE_PAYMENT_TONES: Record<
  CustomerArInvoicePaymentStatus,
  "pos" | "warn" | "neg"
> = {
  UNPAID: "neg",
  PARTIALLY_PAID: "warn",
  SETTLED: "pos",
};

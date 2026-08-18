/**
 * Shared types for all business documents (invoices, receipts, POs, etc.)
 *
 * Design principle: one unified data shape that can represent any document
 * the platform issues. Document-type-specific behaviour is driven by `type`
 * and the optional fields that apply to each type.
 */

export type DocumentType =
  | "invoice"
  | "receipt"
  | "quote"
  | "purchase_order"
  | "purchase_requisition"
  | "request_for_quotation"
  | "goods_received_note"
  | "supplier_return"
  | "delivery_note"
  | "credit_note"
  | "statement";

/**
 * The "issuer" — your SaaS account owner's business.
 * In a multi-tenant SaaS this is loaded from the authenticated tenant/business.
 */
export interface BusinessIdentity {
  name: string;
  legalName?: string;
  logoUrl?: string;
  tin?: string;
  vrn?: string;
  addressLines: string[];
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * The counterparty — customer for invoices/receipts, supplier for POs, etc.
 */
export interface Party {
  name: string;
  contactPerson?: string;
  addressLines?: string[];
  phone?: string;
  email?: string;
  tin?: string;
}

export interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  /**
   * Optional pre-computed amount. If omitted, computed as quantity * unitPrice.
   */
  amount?: number;
  unitOfMeasure?: string;
  /**
   * Per-line tax amount (e.g. purchase-tax GRN/LPO lines). When any item in
   * the table sets this, {@link LineItemsTable} renders a Tax column for
   * every row (0 rendered explicitly, not left blank, for lines with none).
   */
  taxAmount?: number;
  /** Effective tax rate (%) for this line, shown as a small hint under the amount. */
  taxRatePercent?: number;
}

export interface TaxLine {
  label: string;
  /**
   * Rate (%) shown as a "label rate%:" suffix. Omit for a lump-sum tax
   * figure with no single meaningful rate (e.g. mixed-rate lines) — the
   * label then renders on its own rather than a misleading "0%".
   */
  rate?: number;
  amount: number;
}

export interface PaymentRecord {
  date: string;
  method: string;
  amount: number;
  reference?: string;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  branch?: string;
  accountNumber: string;
  swiftCode?: string;
  currency?: string;
}

export interface DocumentMeta {
  /**
   * Document type drives the title, label set, and which sections render.
   */
  type: DocumentType;

  /**
   * Override the default title (e.g. "TAX INVOICE" instead of "INVOICE").
   */
  titleOverride?: string;

  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  referenceNumber?: string;

  /**
   * Status badge — "PAID", "OVERDUE", "DRAFT", etc.
   */
  status?: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "info" };
}

export interface DocumentTotals {
  subtotal: number;
  taxes?: TaxLine[];
  discount?: { label: string; amount: number };
  shipping?: number;
  total: number;
  payments?: PaymentRecord[];
  amountDue: number;
}

export interface BusinessDocumentData {
  meta: DocumentMeta;
  issuer: BusinessIdentity;
  /**
   * The external counterparty (customer for invoices/receipts, vendor for POs).
   * Omit for internal-only documents like purchase requisitions where there
   * is no external party — the recipient block will be hidden instead of
   * duplicating the issuer's own details.
   */
  recipient?: Party;
  items: LineItem[];
  totals: DocumentTotals;
  currency: string;
  /**
   * Free-text notes / payment terms shown at the foot.
   */
  notes?: string;
  /**
   * Bank details rendered with the notes — typical for invoices.
   */
  bankDetails?: BankDetails;
  /**
   * Footer line — defaults to "Thank you for your business and continued support".
   */
  footerMessage?: string;
  /**
   * Optional signature block(s) — useful for purchase orders / requisitions.
   */
  signatures?: { label: string; name?: string; date?: string }[];
  /**
   * Quantities-only rendering: hides the per-line Price/Amount columns, the
   * totals summary, and the Amount Due box. For documents where money has no
   * place — delivery notes handed to a driver, internal movement slips.
   * `totals` still needs to be present (zeros are fine); it just won't render.
   */
  hideAmounts?: boolean;
}

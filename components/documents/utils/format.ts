import { DocumentType } from "../types";

/**
 * Format a number as currency. Defaults to USD but accepts any ISO code.
 * Uses en-US locale to match the screenshot ($1,492.62 style).
 */
export function formatCurrency(amount: number, currency: string = "USD", locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date as "January 13, 2026" — the long-form style from the reference.
 * Accepts ISO strings or Date objects.
 */
export function formatLongDate(value: string | Date, locale: string = "en-US"): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Map document type to its display title. Override-able via meta.titleOverride.
 */
export function getDocumentTitle(type: DocumentType): string {
  const titles: Record<DocumentType, string> = {
    invoice: "INVOICE",
    receipt: "RECEIPT",
    quote: "QUOTE",
    purchase_order: "PURCHASE ORDER",
    purchase_requisition: "PURCHASE REQUISITION",
    request_for_quotation: "REQUEST FOR QUOTATION",
    goods_received_note: "GOODS RECEIVED NOTE",
    supplier_return: "SUPPLIER RETURN",
    delivery_note: "DELIVERY NOTE",
    credit_note: "CREDIT NOTE",
    statement: "STATEMENT",
  };
  return titles[type];
}

/**
 * Some labels change based on document type — e.g. invoices say "Bill to",
 * purchase orders say "Vendor", receipts say "Received from".
 */
export function getRecipientLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: "Bill to",
    receipt: "Received from",
    quote: "Quote for",
    purchase_order: "Vendor",
    purchase_requisition: "Requested for",
    request_for_quotation: "Quote from",
    goods_received_note: "Received from",
    supplier_return: "Returned to",
    delivery_note: "Deliver to",
    credit_note: "Credit to",
    statement: "Statement for",
  };
  return labels[type];
}

/**
 * The number-field label changes per document type.
 */
export function getDocumentNumberLabel(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    invoice: "Invoice Number",
    receipt: "Receipt Number",
    quote: "Quote Number",
    purchase_order: "PO Number",
    purchase_requisition: "Requisition Number",
    request_for_quotation: "RFQ Number",
    goods_received_note: "GRN Number",
    supplier_return: "Return Number",
    delivery_note: "Delivery Note No.",
    credit_note: "Credit Note No.",
    statement: "Statement No.",
  };
  return labels[type];
}

export function getIssueDateLabel(type: DocumentType): string {
  return type === "purchase_order" || type === "purchase_requisition"
    ? "Date Issued"
    : type === "receipt"
      ? "Receipt Date"
      : type === "quote"
        ? "Quote Date"
        : "Invoice Date";
}

/**
 * Compute line amount when not pre-supplied.
 */
export function computeLineAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

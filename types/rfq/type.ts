import type { DestinationType } from "@/types/catalogue/enums";

// ── Status enums (match backend exactly) ───────────────────────────

export type RfqStatus =
  | "DRAFT"
  | "SENT"
  | "QUOTES_RECEIVED"
  | "EVALUATED"
  | "AWARDED"
  | "CONVERTED_TO_LPO"
  | "CANCELLED"
  | "EXPIRED";

export type QuoteStatus = "PENDING" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

// ── Entities ───────────────────────────────────────────────────────

export interface Rfq {
  id: string;
  rfqNumber: string;
  locationType: DestinationType;
  locationId: string;
  businessId: string;
  title: string;
  status: RfqStatus;
  /** Location base currency. */
  currency: string | null;
  /** Currency buyers want suppliers to quote in. */
  targetCurrency: string | null;
  submissionDeadline: string | null;
  requiredByDate: string | null;
  createdBy: string;
  createdByName: string | null;
  sentAt: string | null;
  evaluatedAt: string | null;
  evaluatedBy: string | null;
  evaluatedByName: string | null;
  awardedAt: string | null;
  awardedToSupplier: string | null;
  convertedLpoId: string | null;
  convertedAt: string | null;
  notes: string | null;
  items: RfqItem[];
  quotes: SupplierQuote[];
  createdAt: string;
  updatedAt: string;
}

export interface RfqItem {
  id: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  requestedQuantity: number;
  targetUnitPrice: number | null;
  currency: string | null;
  specifications: string | null;
}

export interface SupplierQuote {
  id: string;
  rfqId: string;
  supplierId: string;
  status: QuoteStatus;
  totalAmount: number | null;
  currency: string | null;
  leadTimeDays: number | null;
  paymentTerms: string | null;
  validityDate: string | null;
  submittedAt: string | null;
  isAwarded: boolean | null;
  notes: string | null;
  items: SupplierQuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierQuoteItem {
  id: string;
  rfqItemId: string;
  stockVariantId: string;
  quotedUnitPrice: number;
  quotedQuantity: number;
  currency: string | null;
  leadTimeDays: number | null;
  notes: string | null;
}

export interface QuoteComparison {
  rfqId: string;
  rfqNumber: string;
  currency: string | null;
  items: ComparisonItem[];
}

export interface ComparisonItem {
  rfqItemId: string;
  stockVariantId: string;
  stockVariantDisplayName: string | null;
  requestedQuantity: number;
  offers: SupplierOffer[];
}

export interface SupplierOffer {
  supplierQuoteId: string;
  supplierId: string;
  quotedUnitPrice: number;
  quotedQuantity: number;
  totalPrice: number;
  leadTimeDays: number | null;
  isCheapest: boolean;
  isFastest: boolean;
}

// ── Payloads ───────────────────────────────────────────────────────

export interface CreateRfqItemPayload {
  stockVariantId: string;
  requestedQuantity: number;
  targetUnitPrice?: number;
  specifications?: string;
}

export interface CreateRfqPayload {
  locationType: DestinationType;
  title: string;
  targetCurrency?: string;
  submissionDeadline?: string;
  requiredByDate?: string;
  notes?: string;
  items: CreateRfqItemPayload[];
  invitedSupplierIds?: string[];
}

export interface QuoteItemPayload {
  rfqItemId: string;
  quotedUnitPrice: number;
  quotedQuantity: number;
  currency?: string;
  leadTimeDays?: number;
  notes?: string;
}

export interface SubmitQuotePayload {
  leadTimeDays?: number;
  currency?: string;
  paymentTerms?: string;
  validityDate?: string;
  notes?: string;
  items: QuoteItemPayload[];
}

export interface AwardQuotePayload {
  supplierQuoteId: string;
}

// ── Display helpers ────────────────────────────────────────────────

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  QUOTES_RECEIVED: "Quotes Received",
  EVALUATED: "Evaluated",
  AWARDED: "Awarded",
  CONVERTED_TO_LPO: "Converted to LPO",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const RFQ_STATUS_TONES: Record<RfqStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700",
  SENT: "bg-blue-50 text-blue-700",
  QUOTES_RECEIVED: "bg-indigo-50 text-indigo-700",
  EVALUATED: "bg-amber-50 text-amber-700",
  AWARDED: "bg-emerald-50 text-emerald-700",
  CONVERTED_TO_LPO: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  EXPIRED: "bg-red-50 text-red-700",
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const QUOTE_STATUS_TONES: Record<QuoteStatus, string> = {
  PENDING: "bg-gray-50 text-gray-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-amber-50 text-amber-700",
};

// ── State-machine helpers (mirrors backend RfqService.validate*) ──

export function canSendRfq(status: RfqStatus): boolean {
  return status === "DRAFT";
}

export function canSubmitQuote(status: RfqStatus): boolean {
  return status === "SENT" || status === "QUOTES_RECEIVED";
}

export function canEvaluateRfq(status: RfqStatus): boolean {
  return status === "QUOTES_RECEIVED";
}

export function canAwardRfq(status: RfqStatus): boolean {
  return status === "EVALUATED";
}

export function canConvertRfq(status: RfqStatus): boolean {
  return status === "AWARDED";
}

export function canCancelRfq(status: RfqStatus): boolean {
  return (
    status !== "AWARDED" &&
    status !== "CONVERTED_TO_LPO" &&
    status !== "CANCELLED" &&
    status !== "EXPIRED"
  );
}

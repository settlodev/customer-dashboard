import { ApiResponse } from "@/types/types";

// ── Enums ───────────────────────────────────────────────────────────

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED";

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type InvoiceLineItemType =
  | "PLAN"
  | "ADDON"
  | "PRORATION"
  | "DISCOUNT"
  | "TAX"
  | "DEVICE"
  | "CREDIT_PACK";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DiscountStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "EXHAUSTED";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type DiscountScope = "SUBSCRIPTION" | "ITEM" | "INVOICE";

export type DiscountSource =
  | "ADMIN_GRANTED"
  | "SUPPORT_GRANTED"
  | "PROMOTION"
  | "REFERRAL";

export type PaymentMethod =
  | "MOBILE_MONEY"
  | "BANK_TRANSFER"
  | "CASH"
  | "CHECK"
  | "OTHER";

// ── Subscription ────────────────────────────────────────────────────

export interface SubscriptionItemResponse {
  id: string;
  packageId: string;
  packageName: string | null;
  status: string;
  unitPrice: number | null;
  quantity: number | null;
}

export interface SubscriptionDiscountResponse {
  id: string;
  subscriptionId: string;
  discountId: string;
  discountName: string;
  discountType: DiscountType;
  discountValue: number;
  isFreeSubscription: boolean;
  status: DiscountStatus;
  appliedAt: string;
  appliedBy: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string | null;
  reason: string | null;
  createdAt: string;
}

export interface SubscriptionResponse {
  id: string;
  businessId: string;
  whitelabelId: string | null;
  status: SubscriptionStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
  paidThrough: string | null;
  nextBillingDate: string | null;
  autoRenew: boolean;
  hasActiveDiscount: boolean;
  isFreeSubscription: boolean;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  items: SubscriptionItemResponse[];
  activeDiscounts: SubscriptionDiscountResponse[];
}

// ── Invoice ─────────────────────────────────────────────────────────

export interface InvoiceLineItemResponse {
  id: string;
  type: InvoiceLineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  subscriptionId: string | null;
  userId: string | null;
  locationId: string | null;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  discountDescription: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  lineItems: InvoiceLineItemResponse[];
}

export type InvoicePage = ApiResponse<InvoiceResponse>;

export interface GenerateInvoiceRequest {
  months: number;
}

// ── Manual payment ──────────────────────────────────────────────────

export interface ManualPaymentResponse {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  subscriptionId: string | null;
  recordedBy: string | null;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  amount: number;
  proofUrl: string | null;
  proofStoragePath: string | null;
  notes: string | null;
  recordedAt: string;
}

// ── Refunds ─────────────────────────────────────────────────────────

export interface RefundRequestDto {
  invoiceId: string;
  amount: number;
  reason: string;
}

export interface RefundResponse {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Discounts ───────────────────────────────────────────────────────

export interface DiscountResponse {
  id: string;
  name: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  scope: DiscountScope;
  source: DiscountSource;
  durationMonths: number | null;
  stackable: boolean;
  maxApplications: number | null;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
}

export interface ApplyDiscountRequest {
  businessId: string;
  discountId: string;
  reason?: string;
}

export interface RevokeDiscountRequest {
  subscriptionDiscountId: string;
  reason?: string;
}

export interface GrantFreeSubscriptionRequest {
  businessId: string;
  durationMonths?: number;
  reason: string;
}

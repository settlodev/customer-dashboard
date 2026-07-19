import type { SubscriptionStatus } from "@/types/types";

// ── Packages / Plans ────────────────────────────────────────────────

export type BillingInterval = "MONTHLY" | "YEARLY";
export type EntityType = "LOCATION" | "WAREHOUSE" | "STORE";
export type FeatureType = "CORE" | "ADVANCED" | "PREMIUM" | "LIMIT";

export interface Package {
  features: any[];
  id: string;
  code?: string;
  name: string;
  description: string | null;
  basePrice: number;
  billingInterval: BillingInterval;
  entityType: EntityType;
  includedWarehouseCount: number;
  includedStoreCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackageFeature {
  id: string;
  featureKey: string;
  name: string;
  description: string | null;
  featureType: FeatureType;
  featureValue: string | null;
  isIncluded: boolean;
}

export interface PackageBreakdown extends Package {
  features: PackageFeature[];
  addons: Addon[];
}

// ── Addons ──────────────────────────────────────────────────────────

export interface Addon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Subscriptions ───────────────────────────────────────────────────

export type SubscriptionItemStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "REMOVED";

export interface SubscriptionItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  /** Snapshot of the Package at the time this item was added. May be null
   *  for legacy/edge-case rows; trial items should still carry a plan. */
  packageInfo: Package | null;
  packageVersion: number;
  isBundled: boolean;
  bundledByItemId: string | null;
  status: SubscriptionItemStatus;
  trialEndDate: string | null;
  /** When this entity is paid through; null while trialing / never-paid. Drives the
   *  paid-vs-unpaid plan-change regime. */
  paidThrough: string | null;
  addedAt: string;
  removedAt: string | null;
  /** Each addon mirrors the AddonResponse DTO: id, name, description, price. */
  addons: Addon[];
}

export interface SubscriptionDiscount {
  id: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  validFrom: string;
  validUntil: string | null;
}

/** Committed billing cycle length. Mirrors the service's BillingTerm enum. */
export type BillingTerm = "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";

export interface Subscription {
  id: string;
  businessId: string;
  whitelabelId: string | null;
  status: SubscriptionStatus;
  /** The cycle the business is committed to. Optional for responses that predate the field. */
  term?: BillingTerm;
  trialStartDate: string | null;
  trialEndDate: string | null;
  billingCycleStart: string;
  billingCycleEnd: string;
  paidThrough: string;
  nextBillingDate: string | null;
  autoRenew: boolean;
  hasActiveDiscount: boolean;
  isFreeSubscription: boolean;
  cancelledAt: string | null;
  items: SubscriptionItem[];
  /** Every non-cancelled item (ACTIVE + degraded), for the "change plan" surface so an
   *  owner can re-pick a package on a lapsed entity before paying. `items` stays
   *  ACTIVE-only. Optional for responses that predate the field. */
  manageableItems?: SubscriptionItem[];
  activeDiscounts: SubscriptionDiscount[];
  createdAt: string;
  updatedAt: string;
  /** Not returned by the Billing Service today — kept for the payment-initiation
   *  call which still needs a currency code. Always falls back to TZS at the
   *  call site. */
  currency?: string;
}

// ── Plan change preview ─────────────────────────────────────────────

export interface PlanChangeLimitViolation {
  limitKey: string;
  limit: number;
  current: number;
}

export interface PlanChangePreview {
  currentPlan: string;
  targetPlan: string;
  /** Prorated charge (+) / credit (−) for the remaining PAID cycle. 0 in reprice mode. */
  proratedDelta: number;
  /** True for the unpaid/expired regime: the outstanding invoice is re-priced, not prorated. */
  repriceMode: boolean;
  /** Pre-discount amount the re-issued invoice will carry at the new plan (reprice mode only). */
  outstandingAfterChange: number | null;
  /** True when the change is allowed (no cap violations). */
  grandfathered: boolean;
  violations: PlanChangeLimitViolation[];
}

// ── Invoices ────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";
export type InvoiceType = "SUBSCRIPTION" | "SALES" | "PROFORMA";
export type LineItemType =
  | "PLAN"
  | "ADDON"
  | "PRORATION"
  | "DISCOUNT"
  | "TAX"
  | "DEVICE"
  | "CREDIT_PACK";

export interface InvoiceLineItem {
  id: string;
  itemType: LineItemType;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  periodStart: string | null;
  periodEnd: string | null;
  isProration: boolean;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  subscriptionId: string | null;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  discountAmount: number;
  discountDescription: string | null;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  paidAt: string | null;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceViewDto {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  discountDescription: string | null;
  taxAmount: number;
  totalAmount: number;
  paidAt: string | null;
  notes: string | null;
  periodStart: string;
  periodEnd: string;
}

// ── Coupons ─────────────────────────────────────────────────────────

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
}

// ── Credits ─────────────────────────────────────────────────────────

export type CreditTransactionType =
  | "PACKAGE_RENEWAL"
  | "PACK_PURCHASE"
  | "USAGE"
  | "MANUAL_ADJUSTMENT"
  | "EXPIRY"
  | "REFUND";

export interface CreditType {
  id: string;
  name: string;
  code: string;
  description: string | null;
  unitPrice: number;
}

export interface CreditPack {
  id: string;
  name: string;
  description: string | null;
  creditTypeId: string;
  creditTypeName: string;
  creditAmount: number;
  price: number;
}

export interface CreditBalance {
  creditTypeId: string;
  creditTypeName: string;
  creditTypeCode: string;
  balance: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  creditTypeName: string;
  creditTypeCode: string;
  transactionType: CreditTransactionType;
  amount: number;
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

/** Spring Pageable response shape used by the credit transactions endpoint. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ── Features ────────────────────────────────────────────────────────

export interface Feature {
  id: string;
  name: string;
  description: string | null;
  featureKey: string;
  featureType: FeatureType;
  isActive: boolean;
}

// ── Payments ────────────────────────────────────────────────────────

export type PaymentStatus = "ACCEPTED" | "PROCESSING" | "SUCCESS" | "FAILED";

export interface PaymentResponse {
  transactionId: string;
  referenceId: string;
  externalReferenceId: string;
  paymentStatus: PaymentStatus;
  processedAmount: number;
  requestedAmount: number;
  currency: string;
  paymentMethodId: string | null;
  paymentMethodName: string | null;
  customerPhoneNumber: string;
  customerEmail: string;
  description: string | null;
  channel?: "MOBILE_MONEY" | "CARD" | null;
  paymentGatewayUrl?: string | null;
  paymentToken?: string | null;
  qr?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  paidAt?: string | null;
}

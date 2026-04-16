import type { SubscriptionStatus } from "@/types/types";

// ── Packages / Plans ────────────────────────────────────────────────

export type BillingInterval = "MONTHLY" | "YEARLY";
export type EntityType = "LOCATION" | "WAREHOUSE" | "STORE";
export type FeatureType = "CORE" | "ADVANCED" | "PREMIUM" | "LIMIT";

export interface Package {
  id: string;
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

export type SubscriptionItemStatus = "ACTIVE" | "REMOVED";

export interface SubscriptionItemAddon {
  id: string;
  addonId: string;
  addonName: string;
  addonVersion: number;
  addedAt: string;
}

export interface SubscriptionItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  packageId: string;
  packageName: string;
  packageVersion: number;
  isBundled: boolean;
  bundledByItemId: string | null;
  status: SubscriptionItemStatus;
  addedAt: string;
  addons: SubscriptionItemAddon[];
}

export interface Subscription {
  id: string;
  businessId: string;
  whitelabelId: string | null;
  status: SubscriptionStatus;
  trialStartDate: string | null;
  trialEndDate: string | null;
  billingCycleStart: string;
  billingCycleEnd: string;
  paidThrough: string;
  nextBillingDate: string | null;
  autoRenew: boolean;
  currency: string;
  cancelledAt: string | null;
  items: SubscriptionItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Invoices ────────────────────────────────────────────────────────

export type InvoiceStatus = "DRAFT" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type InvoiceType = "SUBSCRIPTION" | "SALES" | "PROFORMA";
export type LineItemType = "PLAN" | "ADDON" | "PRORATION" | "DISCOUNT" | "TAX" | "DEVICE" | "CREDIT_PACK";

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

// ── Prepayments ─────────────────────────────────────────────────────

export interface PrepaymentResponse {
  id: string;
  subscriptionId: string;
  monthsPaid: number;
  amount: number;
  extendsThrough: string;
  invoiceId: string;
  paidAt: string | null;
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
}

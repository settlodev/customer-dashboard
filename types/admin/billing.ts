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

/**
 * Backend stores refund status as a free-form String column. The set
 * the service actually writes is PENDING (initial), PROCESSED (after
 * approval flips the invoice to REFUNDED), and REJECTED. The older
 * "APPROVED" alias is kept as a safety net for any historical records
 * that pre-date the rename.
 */
export type RefundStatus = "PENDING" | "PROCESSED" | "APPROVED" | "REJECTED";

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

export type SubscriptionItemStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED"
  | "REMOVED";

/**
 * A subscription item = one billable unit (location / warehouse / store) on
 * its own plan. `packageInfo` carries the plan name + base price; the
 * subscription's own status (TRIAL/ACTIVE/…) governs the billing state.
 */
export interface SubscriptionItemResponse {
  id: string;
  entityType: SubscribableEntityType;
  entityId: string;
  packageInfo: PackageResponse | null;
  packageVersion: number | null;
  isBundled: boolean | null;
  bundledByItemId: string | null;
  status: SubscriptionItemStatus;
  trialEndDate: string | null;
  paidThrough: string | null;
  addedAt: string | null;
  removedAt: string | null;
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
  /** Owning business of the refunded invoice. Null for prospect invoices. */
  businessId: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedBy: string | null;
  approvedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RefundPage = ApiResponse<RefundResponse>;

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
  currentApplications?: number | null;
  validFrom: string;
  validUntil: string | null;
  /** Some endpoints return `active`, some `isActive` — accept both. */
  active?: boolean | null;
  isActive?: boolean | null;
  isFreeSubscription?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  metadata?: Record<string, unknown> | null;
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

// ── Catalog: packages, addons, features ─────────────────────────────

export type SubscribableEntityType = "LOCATION" | "WAREHOUSE" | "STORE";

export type BillingInterval = "MONTHLY" | "YEARLY";

export interface PackageFeatureSummary {
  featureKey: string;
  featureName: string | null;
  featureValue: string | null;
  isIncluded: boolean;
}

export interface PackageResponse {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  billingInterval: BillingInterval | null;
  entityType: SubscribableEntityType;
  includedWarehouseCount: number | null;
  includedStoreCount: number | null;
  isActive: boolean;
  version: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  features: PackageFeatureSummary[] | null;
}

export interface CreatePackageRequest {
  name: string;
  description?: string;
  basePrice: number;
  entityType: SubscribableEntityType;
  includedWarehouseCount?: number;
  includedStoreCount?: number;
}

export interface AddonResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  entityType: SubscribableEntityType;
  isActive: boolean;
  version: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateAddonRequest {
  name: string;
  description?: string;
  price: number;
  entityType: SubscribableEntityType;
}

// ── Subscription mutations (support staff) ──────────────────────────

export interface SupportUpgradeRequest {
  businessId: string;
  subscriptionItemId: string;
  newPackageId: string;
}

export interface SupportAddonRequest {
  businessId: string;
  subscriptionItemId: string;
  addonId: string;
}

// ── Prospect invoice attachment ─────────────────────────────────────

export interface AttachInvoiceParams {
  invoiceId: string;
  businessId: string;
  locationId?: string;
  subscriptionId?: string;
}

// ── Catalog: features ───────────────────────────────────────────────

export type FeatureType = "CORE" | "ADVANCED" | "PREMIUM" | "LIMIT";

export interface FeatureResponse {
  id: string;
  name: string;
  description: string | null;
  featureKey: string;
  featureType: FeatureType;
  isActive: boolean | null;
}

export interface CreateFeatureRequest {
  name: string;
  featureKey: string;
  featureType: FeatureType;
  description?: string;
}

export interface PackageFeatureMappingResponse {
  feature: FeatureResponse;
  featureValue: string | null;
  isIncluded: boolean | null;
}

export interface SetPackageFeatureRequest {
  featureId: string;
  featureValue?: string;
  isIncluded?: boolean;
}

// ── Catalog: discount definitions ───────────────────────────────────

export interface CreateDiscountRequest {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  scope: DiscountScope;
  source: DiscountSource;
  durationMonths?: number;
  stackable?: boolean;
  maxApplications?: number;
  validFrom: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

// ── Catalog: coupons ────────────────────────────────────────────────

export interface CouponResponse {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  maxUses: number | null;
  currentUses: number | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean | null;
  createdAt: string | null;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxUses?: number;
  validFrom: string;
  validUntil: string;
}

// ── Ops: subscription event republish ───────────────────────────────

export interface RepublishSubscriptionsResult {
  considered: number;
  published: number;
  failed: number;
  businessId?: string;
}

// ── Whitelabel pricing ──────────────────────────────────────────────

export interface WhitelabelSummary {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface WhitelabelPackagePriceOverride {
  id: string;
  whitelabelId: string;
  packageId: string;
  packageName: string | null;
  basePrice: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WhitelabelAddonPriceOverride {
  id: string;
  whitelabelId: string;
  addonId: string;
  addonName: string | null;
  price: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SetWhitelabelPackagePriceRequest {
  packageId: string;
  price: number;
}

export interface SetWhitelabelAddonPriceRequest {
  addonId: string;
  price: number;
}

// ── Credit packs + per-package included credits ─────────────────────

export interface CreditTypeResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  unitPrice: number | null;
}

export interface CreditPackResponse {
  id: string;
  name: string;
  description: string | null;
  creditTypeId: string;
  creditTypeName: string | null;
  creditAmount: number;
  price: number;
}

export interface CreateCreditPackRequest {
  creditTypeId: string;
  name: string;
  description?: string;
  creditAmount: number;
  price: number;
}

export interface PackageIncludedCreditResponse {
  id: string;
  packageId: string;
  creditTypeId: string;
  creditTypeCode: string | null;
  creditTypeName: string | null;
  monthlyAmount: number;
}

export interface SetPackageIncludedCreditRequest {
  creditTypeId: string;
  monthlyAmount: number;
}

// ── Package analytics + forecasting ─────────────────────────────────

/**
 * Time-series point shared by the trend and forecast charts.
 * `date` is a yyyy-MM-dd UTC day; `value` is the metric for that day.
 */
export interface PackageTimeSeriesPoint {
  date: string;
  value: number;
}

export interface PackageDateRange {
  /** Inclusive lower bound, yyyy-MM-dd UTC. */
  from: string;
  /** Inclusive upper bound, yyyy-MM-dd UTC. */
  to: string;
}

/**
 * What to compare the primary range against:
 *  - `previous_period`: an equal-length window immediately before `from`.
 *  - `previous_year`: the same date range shifted back 12 months.
 *  - `none`: no comparison block returned.
 */
export type PackageComparisonMode =
  | "previous_period"
  | "previous_year"
  | "none";

/** Snapshot of how many subscribers sit in each lifecycle bucket. */
export interface PackageStatusBreakdown {
  status: string;
  count: number;
}

/** Per-whitelabel breakdown of subscribers and revenue. */
export interface PackageWhitelabelBreakdownRow {
  whitelabelId: string;
  whitelabelName: string;
  subscribers: number;
  revenue: number;
}

/**
 * Trimmed metric block used for the comparison overlay. Mirrors the
 * primary analytics shape so deltas can be computed field-by-field
 * without bespoke mapping at the UI layer.
 */
export interface PackageAnalyticsComparison {
  range: PackageDateRange;
  activeSubscribers: number | null;
  newSubscribers: number | null;
  churnedSubscribers: number | null;
  churnRate: number | null;
  conversionRate: number | null;
  mrrContribution: number | null;
  periodRevenue: number | null;
  arpu: number | null;
  subscribersTimeline: PackageTimeSeriesPoint[];
  revenueTimeline: PackageTimeSeriesPoint[];
}

export interface PackageAnalytics {
  packageId: string;
  /** The window the snapshot covers. */
  range: PackageDateRange;
  /** When set, the response includes a parallel block for this window. */
  comparison: PackageAnalyticsComparison | null;

  // ── Snapshot (counts at `range.to`) ──
  activeSubscribers: number | null;
  trialSubscribers: number | null;
  pastDueSubscribers: number | null;
  cancelledSubscribers: number | null;

  // ── Period-scoped metrics ──
  newSubscribers: number | null;
  churnedSubscribers: number | null;
  /** Churn rate over `range`, expressed 0–1. */
  churnRate: number | null;
  /** Trial → paid conversion rate over `range`, 0–1. */
  conversionRate: number | null;

  // ── Money ──
  /** Current monthly recurring revenue contributed by this package. */
  mrrContribution: number | null;
  /** Revenue invoiced under this package within `range`. */
  periodRevenue: number | null;
  /** Lifetime revenue across all time for this package. */
  lifetimeRevenue: number | null;
  /** Period revenue ÷ active subscribers in `range`. */
  arpu: number | null;

  // ── Time series for `range` ──
  /** Daily active-subscriber count across `range`. */
  subscribersTimeline: PackageTimeSeriesPoint[];
  /** Daily revenue across `range`. */
  revenueTimeline: PackageTimeSeriesPoint[];

  // ── Breakdowns at `range.to` ──
  byStatus: PackageStatusBreakdown[];
  byWhitelabel: PackageWhitelabelBreakdownRow[];

  /**
   * When false, the platform analytics pipeline hasn't landed yet and
   * the response is a placeholder — let the UI show a "Live data
   * pending" badge so we don't promise more than we ship.
   */
  isLive: boolean;
  /** ISO timestamp the figures were computed at, when known. */
  computedAt: string | null;
}

export type PackageForecastModel = "linear" | "arima" | "prophet";

export interface PackageForecast {
  packageId: string;
  model: PackageForecastModel;
  horizonDays: number;
  /** Forecast points one per day for `horizonDays`. */
  points: PackageTimeSeriesPoint[];
  /** Upper bound of the 95% confidence interval per point. */
  upper: PackageTimeSeriesPoint[];
  /** Lower bound of the 95% confidence interval per point. */
  lower: PackageTimeSeriesPoint[];
  /** Free-text caveat shown beneath the chart. */
  note: string | null;
  isLive: boolean;
}

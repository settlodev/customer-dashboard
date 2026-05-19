"use server";

import ApiClient from "@/lib/settlo-api-client";
import type {
  Package,
  PackageBreakdown,
  PackageFeature,
  Addon,
  Subscription,
  SubscriptionItem,
  BillingInvoice,
  InvoiceViewDto,
  Coupon,
  PrepaymentResponse,
  Feature,
  CreditType,
  CreditPack,
  CreditBalance,
  CreditTransaction,
  Page,
} from "@/types/billing/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

function billingUrl(path: string): string {
  return `${BILLING_SERVICE_URL}${path}`;
}

// ── Packages ────────────────────────────────────────────────────────
// Package catalog reads are public (used on the landing page Pricing
// section by anonymous visitors). isPlain skips auth headers so a stale
// session cookie can't trigger a 401 on what should be a public call.

export async function getPackages(entityType?: string): Promise<Package[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  apiClient.isPlain = true;
  const params = entityType ? `?entityType=${entityType}` : "";
  return apiClient.get<Package[]>(billingUrl(`/api/v1/packages${params}`));
}

export async function getPackageBreakdown(packageId: string): Promise<PackageBreakdown | null> {
  if (!BILLING_SERVICE_URL) return null;
  const apiClient = new ApiClient();
  apiClient.isPlain = true;
  return apiClient.get<PackageBreakdown>(billingUrl(`/api/v1/packages/${packageId}/breakdown`));
}

// ── Addons ──────────────────────────────────────────────────────────

export async function getAddons(): Promise<Addon[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  return apiClient.get<Addon[]>(billingUrl("/api/v1/addons"));
}

// ── Subscriptions ───────────────────────────────────────────────────

export async function getCurrentSubscription(): Promise<Subscription | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const apiClient = new ApiClient();
    return await apiClient.get<Subscription>(billingUrl("/api/v1/subscriptions/current"));
  } catch {
    return null;
  }
}

export async function getBusinessSubscription(businessId: string): Promise<Subscription | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const apiClient = new ApiClient();
    return await apiClient.get<Subscription>(billingUrl(`/api/v1/subscriptions/business/${businessId}`));
  } catch {
    return null;
  }
}

/**
 * Cancel an active subscription. The Billing Service reads the actor from
 * the X-User-Id header (already attached by ApiClient) so no body is needed.
 * Note: cancellation publishes SUBSCRIPTION_CANCELLED on the event bus.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete<void>(billingUrl(`/api/v1/subscriptions/${subscriptionId}`));
}

// ── Subscription item management ────────────────────────────────────

export async function changeItemPlan(
  subscriptionId: string,
  itemId: string,
  packageId: string,
): Promise<SubscriptionItem> {
  const apiClient = new ApiClient();
  return apiClient.put<SubscriptionItem, undefined>(
    billingUrl(`/api/v1/subscriptions/${subscriptionId}/items/${itemId}/plan/${packageId}`),
    undefined,
  );
}

export async function addItemAddon(
  subscriptionId: string,
  itemId: string,
  addonId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post<void, undefined>(
    billingUrl(`/api/v1/subscriptions/${subscriptionId}/items/${itemId}/addons/${addonId}`),
    undefined,
  );
}

export async function removeItemAddon(
  subscriptionId: string,
  itemId: string,
  addonId: string,
): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.delete<void>(
    billingUrl(`/api/v1/subscriptions/${subscriptionId}/items/${itemId}/addons/${addonId}`),
  );
}

// ── Prepayments ─────────────────────────────────────────────────────

/**
 * Create a prepayment for a subscription.
 *
 * This is the primary billing action: it auto-cancels any existing PENDING
 * invoice and generates a fresh one for the requested months.
 * Annual discount is applied server-side for 12+ months.
 */
export async function prepaySubscription(
  subscriptionId: string,
  monthsToPrepay: number,
): Promise<PrepaymentResponse> {
  const apiClient = new ApiClient();
  return apiClient.post<PrepaymentResponse, { subscriptionId: string; monthsToPrepay: number }>(
    billingUrl("/api/v1/prepayments"),
    { subscriptionId, monthsToPrepay },
  );
}

// ── Invoices ────────────────────────────────────────────────────────

/**
 * Get the most recent PENDING invoice for a subscription, if any.
 * Used by the renew page to show the current outstanding invoice.
 */
export async function getPendingInvoice(subscriptionId: string): Promise<BillingInvoice | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const invoices = await getSubscriptionInvoices(subscriptionId);
    return invoices.find((inv) => inv.status === "PENDING") ?? null;
  } catch {
    return null;
  }
}

export async function getSubscriptionInvoices(subscriptionId: string): Promise<BillingInvoice[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  return apiClient.get<BillingInvoice[]>(
    billingUrl(`/api/v1/invoices/subscription/${subscriptionId}`),
  );
}

export async function getInvoiceView(invoiceId: string): Promise<InvoiceViewDto | null> {
  if (!BILLING_SERVICE_URL) return null;
  const apiClient = new ApiClient();
  return apiClient.get<InvoiceViewDto>(billingUrl(`/api/v1/invoices/${invoiceId}/view`));
}

// ── Coupons ─────────────────────────────────────────────────────────

export async function validateCoupon(code: string): Promise<Coupon | null> {
  if (!BILLING_SERVICE_URL || !code.trim()) return null;
  try {
    const apiClient = new ApiClient();
    return await apiClient.get<Coupon>(billingUrl(`/api/v1/coupons/${encodeURIComponent(code)}`));
  } catch {
    return null;
  }
}

// ── Features ────────────────────────────────────────────────────────

/** Lists every feature key the catalog knows about (used for plan comparison). */
export async function getFeatures(): Promise<Feature[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  apiClient.isPlain = true;
  return apiClient.get<Feature[]>(billingUrl("/api/v1/features"));
}

export async function getIncludedPackageFeatures(packageId: string): Promise<PackageFeature[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  apiClient.isPlain = true;
  return apiClient.get<PackageFeature[]>(
    billingUrl(`/api/v1/features/package/${packageId}/included`),
  );
}

// ── Credits ─────────────────────────────────────────────────────────

export async function getCreditTypes(): Promise<CreditType[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  return apiClient.get<CreditType[]>(billingUrl("/api/v1/credits/types"));
}

export async function getCreditPacks(creditTypeId?: string): Promise<CreditPack[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  const params = creditTypeId ? `?creditTypeId=${creditTypeId}` : "";
  return apiClient.get<CreditPack[]>(billingUrl(`/api/v1/credits/packs${params}`));
}

export async function getCreditBalances(businessId: string): Promise<CreditBalance[]> {
  if (!BILLING_SERVICE_URL || !businessId) return [];
  try {
    const apiClient = new ApiClient();
    return await apiClient.get<CreditBalance[]>(
      billingUrl(`/api/v1/credits/balances/${businessId}`),
    );
  } catch {
    return [];
  }
}

export async function getCreditTransactions(
  businessId: string,
  page = 0,
  size = 10,
  creditTypeId?: string,
): Promise<Page<CreditTransaction> | null> {
  if (!BILLING_SERVICE_URL || !businessId) return null;
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (creditTypeId) params.set("creditTypeId", creditTypeId);
    return await apiClient.get<Page<CreditTransaction>>(
      billingUrl(`/api/v1/credits/transactions/${businessId}?${params.toString()}`),
    );
  } catch {
    return null;
  }
}

export async function purchaseCreditPack(
  businessId: string,
  creditPackId: string,
): Promise<CreditBalance> {
  const apiClient = new ApiClient();
  return apiClient.post<CreditBalance, { businessId: string; creditPackId: string }>(
    billingUrl("/api/v1/credits/packs/purchase"),
    { businessId, creditPackId },
  );
}

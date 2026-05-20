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
import type { Business } from "@/types/business/type";
import type { Location } from "@/types/location/type";

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
 *
 * The server returns invoices sorted by invoiceDate DESC, so a pending
 * invoice (which is always the most recent) will be on the first page.
 */
export async function getPendingInvoice(subscriptionId: string): Promise<BillingInvoice | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const page = await getSubscriptionInvoices(subscriptionId, 0, 20);
    return page?.content.find((inv) => inv.status === "PENDING") ?? null;
  } catch {
    return null;
  }
}

export async function getSubscriptionInvoices(
  subscriptionId: string,
  page = 0,
  size = 100,
): Promise<Page<BillingInvoice> | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const apiClient = new ApiClient();
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return await apiClient.get<Page<BillingInvoice>>(
      billingUrl(`/api/v1/invoices/subscription/${subscriptionId}?${params.toString()}`),
    );
  } catch {
    return null;
  }
}

export async function getInvoiceView(invoiceId: string): Promise<InvoiceViewDto | null> {
  if (!BILLING_SERVICE_URL) return null;
  const apiClient = new ApiClient();
  return apiClient.get<InvoiceViewDto>(billingUrl(`/api/v1/invoices/${invoiceId}/view`));
}

/**
 * Resolve the entity owning a subscription invoice so the "Bill to" block can
 * be filled with location-preferred / business-fallback details. We hit the
 * Accounts service (not Billing) because that's where business + location
 * records live. Either field can be null when its lookup 404s — the dialog
 * falls back to whatever side returns successfully.
 */
export async function getInvoiceBillingParties(
  businessId: string | null | undefined,
  locationId: string | null | undefined,
): Promise<{ business: Business | null; location: Location | null }> {
  const apiClient = new ApiClient();
  const [business, location] = await Promise.all([
    businessId
      ? apiClient.get<Business>(`/api/v1/businesses/${businessId}`).catch(() => null)
      : Promise.resolve(null),
    locationId
      ? apiClient.get<Location>(`/api/v1/locations/${locationId}`).catch(() => null)
      : Promise.resolve(null),
  ]);
  return { business, location };
}

/**
 * Cancel a pending invoice. The Billing Service reads the actor from
 * X-User-Id, no body needed. Only valid while status is PENDING; paid or
 * already-cancelled invoices will 409. This is a state transition (not a
 * delete) — the row stays in the audit trail with status=CANCELLED.
 */
export async function cancelInvoice(invoiceId: string): Promise<void> {
  const apiClient = new ApiClient();
  await apiClient.post<void, undefined>(
    billingUrl(`/api/v1/invoices/${invoiceId}/cancel`),
    undefined,
  );
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

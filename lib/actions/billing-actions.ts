"use server";

import ApiClient from "@/lib/settlo-api-client";
import type {
  Package,
  PackageBreakdown,
  Addon,
  Subscription,
  SubscriptionItem,
  BillingInvoice,
  InvoiceViewDto,
  Coupon,
  PrepaymentResponse,
} from "@/types/billing/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

function billingUrl(path: string): string {
  return `${BILLING_SERVICE_URL}${path}`;
}

// ── Packages ────────────────────────────────────────────────────────

export async function getPackages(entityType?: string): Promise<Package[]> {
  if (!BILLING_SERVICE_URL) return [];
  const apiClient = new ApiClient();
  const params = entityType ? `?entityType=${entityType}` : "";
  return apiClient.get<Package[]>(billingUrl(`/api/v1/packages${params}`));
}

export async function getPackageBreakdown(packageId: string): Promise<PackageBreakdown | null> {
  if (!BILLING_SERVICE_URL) return null;
  const apiClient = new ApiClient();
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

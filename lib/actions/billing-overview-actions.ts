"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { EntitlementResponse } from "@/lib/actions/entitlement-actions";
import type {
  Addon,
  BillingInvoice,
  CreditBalance,
  CreditPack,
  CreditTransaction,
  Package,
  Subscription,
} from "@/types/billing/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

/** Mirrors the billing service's BillingOverviewResponse. */
export interface BillingOverview {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  invoices: BillingInvoice[];
  invoicesTotal: number;
  creditBalances: CreditBalance[];
  creditPacks: CreditPack[];
  creditTransactions: CreditTransaction[];
  creditTransactionsTotal: number;
  entitlements: EntitlementResponse | null;
}

/**
 * The whole billing page in one request.
 *
 * Replaces eight separate calls (subscription, packages, addons, invoices, credit balances,
 * credit packs, credit transactions, entitlements), each of which consumed a rate-limit token —
 * which is what let a single open tab exhaust an entire account's budget.
 *
 * Returns null when the business has no subscription: the endpoint answers 404 in that case,
 * exactly as `/api/v1/subscriptions/current` already does, and `getCurrentSubscription` already
 * absorbs that the same way. The billing page renders its "choose a plan" empty state on null.
 */
export async function getBillingOverview(): Promise<BillingOverview | null> {
  if (!BILLING_SERVICE_URL) return null;
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<BillingOverview>(
      `${BILLING_SERVICE_URL}/api/v1/billing/overview`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

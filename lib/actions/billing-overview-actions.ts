"use server";

import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
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
 * A 404 ("this business genuinely has no subscription") and every other failure
 * ("we could not get a trustworthy answer from billing") are different situations that
 * call for different UI — the former offers a plan picker, the latter must never look
 * like a billing/payment problem. Collapsing them into one `null` (as the previous
 * version of this function did) meant a billing outage rendered the "no subscription,
 * pick a plan" empty state for a fully paid-up customer. See the billing page's own
 * three-way branch on this result.
 */
export type BillingOverviewResult =
  | { status: "ok"; data: BillingOverview }
  | { status: "no-subscription" }
  | { status: "unreachable" };

/**
 * The whole billing page in one request.
 *
 * Replaces eight separate calls (subscription, packages, addons, invoices, credit balances,
 * credit packs, credit transactions, entitlements), each of which consumed a rate-limit token —
 * which is what let a single open tab exhaust an entire account's budget.
 */
export async function getBillingOverview(): Promise<BillingOverviewResult> {
  if (!BILLING_SERVICE_URL) return { status: "unreachable" };
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<BillingOverview>(
      `${BILLING_SERVICE_URL}/api/v1/billing/overview`,
    );
    return { status: "ok", data: parseStringify(data) };
  } catch (error) {
    // ApiClient.get always rejects with a SettloApiError (see lib/settlo-api-client.ts),
    // which carries the real HTTP status straight off the axios response — 404 means the
    // endpoint genuinely answered "no subscription for this business", exactly as
    // `/api/v1/subscriptions/current` does. Everything else (429, 5xx, timeout, DNS/network
    // failure, or a thrown value that somehow isn't a SettloApiError at all) is treated as
    // "could not confirm" rather than guessed at — that's the safe direction, since it never
    // accuses a paying customer of not having paid.
    if (error instanceof SettloApiError && error.status === 404) {
      return { status: "no-subscription" };
    }
    return { status: "unreachable" };
  }
}

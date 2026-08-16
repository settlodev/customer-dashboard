"use server";

import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { parseStringify } from "@/lib/utils";
import { getCurrentSubscription } from "@/lib/actions/billing-actions";
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
      // A 404 here is ambiguous: it's what the overview endpoint returns for "this
      // business genuinely has no subscription", but it's ALSO what Spring returns for
      // any unmapped path — and GET /api/v1/billing/overview exists only on billing's
      // `alpha` branch, not on `beta`/`main`. A dashboard deployed ahead of billing would
      // otherwise misread "endpoint doesn't exist yet" as "no subscription" for every
      // paying customer. This follow-up call fires ONLY on that 404 path (never on the
      // happy path, so it costs nothing normally) and exists purely to make deploy order
      // advisory rather than load-bearing: it hits /api/v1/subscriptions/current, which
      // has existed on every billing version, to disambiguate.
      //
      // getCurrentSubscription() returns null on ANY failure (including a genuine 404 for
      // "no subscription" AND a billing outage) — so null alone cannot distinguish those
      // two cases from each other. That's fine here: both are safe to route to
      // "unreachable", which never accuses a paying customer of not having paid. Only a
      // NON-NULL result is proof — it means the subscription endpoint answered
      // successfully, which means billing is up and reachable, which means the overview
      // 404 must have been "path not found" rather than "no subscription".
      const fallbackSubscription = await getCurrentSubscription();
      if (fallbackSubscription) {
        return { status: "unreachable" };
      }
      return { status: "no-subscription" };
    }
    return { status: "unreachable" };
  }
}

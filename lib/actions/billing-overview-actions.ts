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
      // Deliberately NOT routed through getCurrentSubscription() (lib/actions/billing-actions.ts):
      // that helper swallows every failure — a genuine 404, a 5xx, a timeout, a network blip —
      // into the same `null`, which would make "no subscription" and "billing had a blip during
      // this exact rolling-deploy window" indistinguishable again, just one level down. Calling
      // ApiClient directly here (same construction, same URL helper, same endpoint it uses) lets
      // us see the actual failure mode instead of a laundered null.
      try {
        const apiClient = new ApiClient();
        await apiClient.get<Subscription>(
          `${BILLING_SERVICE_URL}/api/v1/subscriptions/current`,
        );
        // The call succeeded — billing answered without error — so the overview's own 404
        // must have been "path not found", not "no subscription". Even a success with an
        // empty/null body counts as proof of reachability only, not of "no subscription";
        // only the explicit 404 below is allowed to assert that.
        return { status: "unreachable" };
      } catch (fallbackError) {
        if (fallbackError instanceof SettloApiError && fallbackError.status === 404) {
          // The disambiguation call ALSO 404s — this business genuinely has no subscription.
          // Billing's getSubscriptionByBusinessId throws ResourceNotFoundException, which its
          // GlobalExceptionHandler maps to 404, so this is a trustworthy signal.
          return { status: "no-subscription" };
        }
        // Any other status, any non-SettloApiError throw — we still don't have a trustworthy
        // answer. `unreachable` is the deliberate default: we must never assert non-payment
        // (no subscription) that we cannot confirm.
        return { status: "unreachable" };
      }
    }
    return { status: "unreachable" };
  }
}

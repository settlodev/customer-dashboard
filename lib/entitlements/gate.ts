import type { EntitlementResponse } from "@/lib/actions/entitlement-actions";

/**
 * The three states an entitlement read can be in. Callers must handle all three —
 * the discriminated union is what makes that a compile error rather than a bug.
 *
 * `live`        billing answered just now.
 * `cached`      billing is unreachable; this is the last answer we got, `ageMs` ago.
 * `unavailable` billing is unreachable and we have no previous answer at all.
 */
export type EntitlementSnapshot =
  | { status: "live"; data: EntitlementResponse }
  | { status: "cached"; data: EntitlementResponse; ageMs: number }
  | { status: "unavailable" };

/**
 * Why a destination was locked. Only `lapsed` means "this entity's own subscription
 * ran out" — the billing page renders the accusatory "your subscription has lapsed"
 * copy for that value alone and neutral copy for everything else, so a reason that
 * does NOT mean the customer failed to pay must never be called `lapsed`.
 *
 * `no-subscription`   the business has no subscription at all (nothing to be entitled by).
 * `business-mismatch` billing answered about a different business than the one in scope.
 * `no-entitlement-data` billing is unreachable and no snapshot is trustworthy.
 */
export type GateDecision =
  | { outcome: "allow" }
  | {
      outcome: "lock";
      reason:
        | "lapsed"
        | "no-subscription"
        | "business-mismatch"
        | "no-entitlement-data";
    };

/** How long a snapshot stays trustworthy once billing goes quiet. */
export const GRACE_MS = 15 * 60 * 1000;

/**
 * Compare two server-issued ids. Both sides are Postgres/Java UUIDs and therefore
 * already lowercase, so this only ever matters if some future producer serialises
 * them differently — but the cost of a false negative here is a total lockout of a
 * paying customer, which is worth three lines to rule out.
 */
function sameId(a: string | undefined | null, b: string | undefined | null): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

/**
 * Decide whether the active destination may be used.
 *
 * Deliberately pure: no fetch, no cookies, no Next imports. The gate is the one piece of
 * this feature where a mistake grants access to an expired account, and this repo has no
 * test runner — so the correctness argument has to be readable in one screen, and the
 * exhaustive switch has to be checked by the compiler.
 *
 * Rules, in order:
 *  - No destination in scope → nothing to gate.
 *  - The answer must be ABOUT the business we are standing in — see `judge`.
 *  - Billing-exempt accounts are never locked. They are internal and deliberately unpaid;
 *    `paidThrough` keeps a real, often long-past date, so any date-based check would lock them.
 *  - A destination whose own item says `active: false` is locked, whether the answer is live
 *    or a snapshot within grace.
 *  - No trustworthy answer (stale beyond grace, or none at all) → lock. This is the reversal
 *    of the old behaviour, which let a billing blip unlock every expired entity.
 *
 * `activeBusinessId` is the business the destination belongs to (the `currentBusiness`
 * cookie). It is optional only so the parameter stays additive; callers that gate access
 * must pass it, or the cross-business check below silently does nothing.
 */
export function decideDestinationAccess(
  snapshot: EntitlementSnapshot,
  activeDestinationId: string | undefined,
  activeBusinessId?: string,
  graceMs: number = GRACE_MS,
): GateDecision {
  if (!activeDestinationId) return { outcome: "allow" };

  switch (snapshot.status) {
    case "live":
      return judge(snapshot.data, activeDestinationId, activeBusinessId);
    case "cached":
      return snapshot.ageMs <= graceMs
        ? judge(snapshot.data, activeDestinationId, activeBusinessId)
        : { outcome: "lock", reason: "no-entitlement-data" };
    case "unavailable":
      return { outcome: "lock", reason: "no-entitlement-data" };
    default: {
      // Exhaustiveness: adding a snapshot state without handling it here is a compile error.
      const _exhaustive: never = snapshot;
      return _exhaustive;
    }
  }
}

function judge(
  data: EntitlementResponse,
  activeDestinationId: string,
  activeBusinessId: string | undefined,
): GateDecision {
  // The answer has to be about the business the destination lives in, and this is checked
  // FIRST — before `billingExempt`, before `items` — because every other field is only
  // meaningful once that holds. `GET /api/v1/entitlements` resolves the business from the
  // JWT `business_id` claim in preference to the `X-Business-Id` header, and that claim is
  // NOT the business the user selected: Auth stamps the account's first active business at
  // login and re-stamps the same one on refresh, so for a multi-business account it points
  // at business #1 forever. Judging business #1's `items` against a business #2 destination
  // finds no match and reads as "lapsed" — which is how fully paid-up locations came to be
  // told their subscription had run out. Auth now derives the claim from the destination
  // being switched to; this check is what keeps a regression there loud (a distinct reason,
  // neutral copy) instead of silently unlocking a destination we have no answer for.
  if (activeBusinessId && data.businessId && !sameId(data.businessId, activeBusinessId)) {
    return { outcome: "lock", reason: "business-mismatch" };
  }

  if (data.billingExempt === true) return { outcome: "allow" };

  const item = data.items.find((i) => sameId(i.entityId, activeDestinationId));
  if (item) {
    // Known entity: its own lifecycle decides. `items` carries ACTIVE + PAST_DUE (entitled),
    // plus EXPIRED/SUSPENDED/CANCELLED appended for identity with `active: false`, plus a
    // bundled entity under a lapsed parent (also `active: false`).
    return item.active
      ? { outcome: "allow" }
      : { outcome: "lock", reason: "lapsed" };
  }

  // UNKNOWN entity — no SubscriptionItem for it in any status. This is NOT a lapse, and
  // calling it one is what told owners of never-provisioned destinations that they hadn't
  // paid. A destination can be absent because its LOCATION_CREATED / STORE_CREATED /
  // WAREHOUSE_CREATED event was dropped, because it was created before the business had a
  // subscription (the Billing Service logs and skips those), or because it predates billing.
  // Mirror the Billing Service's own `unprovisionedEntityAllowed`, which is deliberate:
  // a business with no subscription at all is blocked, but an unknown entity under a real
  // subscription fails OPEN rather than blocking a paying customer over a provisioning gap.
  // The same default already applies in `EntitlementProvider.isEntityAccessible` and in
  // `lib/feature-guard.ts`; this gate was the sole holdout.
  return data.subscriptionId
    ? { outcome: "allow" }
    : { outcome: "lock", reason: "no-subscription" };
}

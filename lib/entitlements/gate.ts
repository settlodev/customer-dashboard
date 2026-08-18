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

export type GateDecision =
  | { outcome: "allow" }
  | { outcome: "lock"; reason: "lapsed" | "no-entitlement-data" };

/** How long a snapshot stays trustworthy once billing goes quiet. */
export const GRACE_MS = 15 * 60 * 1000;

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
 *  - Billing-exempt accounts are never locked. They are internal and deliberately unpaid;
 *    `paidThrough` keeps a real, often long-past date, so any date-based check would lock them.
 *  - A lapsed entity stays locked whether the answer is live or a snapshot within grace.
 *    `items` carries ACTIVE and PAST_DUE entities only, so a lapsed one is ABSENT rather than
 *    present-with-active-false — except a bundled entity under a lapsed parent, which IS
 *    present with `active: false`. `some(entityId matches && active)` covers both shapes.
 *  - No trustworthy answer (stale beyond grace, or none at all) → lock. This is the reversal
 *    of the old behaviour, which let a billing blip unlock every expired entity.
 */
export function decideDestinationAccess(
  snapshot: EntitlementSnapshot,
  activeDestinationId: string | undefined,
  graceMs: number = GRACE_MS,
): GateDecision {
  if (!activeDestinationId) return { outcome: "allow" };

  switch (snapshot.status) {
    case "live":
      return judge(snapshot.data, activeDestinationId);
    case "cached":
      return snapshot.ageMs <= graceMs
        ? judge(snapshot.data, activeDestinationId)
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
): GateDecision {
  if (data.billingExempt === true) return { outcome: "allow" };

  const entitled = data.items.some(
    (item) => item.entityId === activeDestinationId && item.active,
  );
  return entitled ? { outcome: "allow" } : { outcome: "lock", reason: "lapsed" };
}

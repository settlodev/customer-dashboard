# Dashboard Request Cuts and Entitlement-Gate Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the dashboard from re-rendering the billing page every 5 seconds at 8 billing requests a render, and replace the entitlement gate's fail-open behaviour with a last-known-good snapshot plus a 15-minute grace window.

**Architecture:** A new `lib/entitlements/` module owns two things with one responsibility each: `gate.ts` is a pure, dependency-free decision function over a discriminated union, and `snapshot.ts` owns fetching plus the last-known-good store. The layout, `feature-guard`, and `entitlement-actions` all become thin consumers of those two. Separately, the billing page collapses its eight server calls onto the single `/api/v1/billing/overview` endpoint the billing service now exposes, and the realtime listener stops refreshing that page at all.

**Tech Stack:** Next.js 15 (App Router, server components, server actions), TypeScript, React `cache()`, `unstable_cache`.

**Spec:** `Settlo Billing Service/docs/superpowers/specs/2026-08-12-billing-cache-and-gate-hardening-design.md`, sections D and E. Sections A–C are already implemented and committed in the billing service.

## Global Constraints

- **This repo has no test runner** — no `test` script, no vitest/jest, zero test files. Verification for every task is `npx tsc --noEmit`, `npm run lint`, and the explicit manual steps in that task. Where correctness matters, it is enforced by the type system (exhaustive discriminated unions) rather than by tests. Do not add a test framework; that was explicitly declined.
- **The billing service must deploy before this ships.** `GET /api/v1/billing/overview` does not exist in any deployed environment yet — it is committed on the billing service's `alpha` branch and unpushed. Task 6 onward will 404 against current staging/prod until that lands.
- No new environment variables. `BILLING_SERVICE_URL` already exists and is the only one used here.
- Commit with explicit `git add <paths>`. Never `git add -A` or `git add .` — this repo has substantial unrelated in-flight work in the tree.
- Every commit must leave `npx tsc --noEmit` clean.

## Deviation from the spec, and why

The spec specified the last-known-good store as Next's Data Cache via `unstable_cache`, keyed by `businessId`. **That mechanism cannot implement the requirement.** `unstable_cache` has no stale-on-error semantics: within its `revalidate` window it returns the cached value without calling the function, and once expired it re-invokes — and if that invocation throws, the error propagates and nothing is served. There is no way to say "the fetch failed, give me the last value you had". Setting `revalidate` to the 15-minute grace window would instead make entitlements up to 15 minutes stale even when billing is perfectly healthy, which is far worse for a gate than the 60 seconds the billing service itself caches at.

Task 2 therefore implements the store as a module-level `Map` in the Node process. The **requirement is unchanged** — last-known-good, 15-minute grace, fail closed when there is no snapshot. Only the mechanism differs. The trade-off, stated plainly: the snapshot is per-instance and is lost on restart or deploy, so immediately after a deploy a billing outage locks users out rather than serving a snapshot. That is the correct failure direction, and it needs no new infrastructure.

## A correction to the spec's premise

The spec asserts that `lib/feature-guard.ts` fails open alongside the layout. **It does not.** Reading the current code:

- `assertActiveSubscription` (`lib/feature-guard.ts`) *throws* `SubscriptionInactiveError` when entitlements are null, and `checkFeature`/`checkLimit` return `false`. Those already fail **closed**.
- The genuine fail-open paths are the layout gate (documented as such in `app/(protected)/layout.tsx`), plus `hasEntityFeature` and `isWithinEntityLimit` in `lib/actions/entitlement-actions.tsx`, both of which return `true` when there is no entitlement data.

So the two guards fail in **opposite** directions, and both are wrong. The layout is too loose: a 429 unlocks an expired entity. `feature-guard` is too strict: the same 429 blocks a fully paid-up customer from every mutation. A last-known-good snapshot is the single fix for both — which is why Task 5 exists and is not merely cosmetic.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/entitlements/gate.ts` (new) | Pure decision function and its types. No I/O, no imports from Next. |
| `lib/entitlements/snapshot.ts` (new) | Fetch entitlements, maintain the last-known-good store, return a discriminated snapshot. |
| `lib/actions/entitlement-actions.tsx` (modify) | Delegates to `snapshot.ts`; `hasEntityFeature`/`isWithinEntityLimit` stop failing open. |
| `app/(protected)/layout.tsx` (modify) | Consumes `gate.ts` instead of inlining the lapsed check. |
| `lib/feature-guard.ts` (modify) | Consumes the snapshot so a transient blip stops blocking paying customers. |
| `lib/actions/billing-overview-actions.ts` (new) | `getBillingOverview()` — the single call replacing eight. |
| `app/(protected)/billing/page.tsx` (modify) | Renders from the overview payload. |
| `components/realtime/settlo-realtime-listener.tsx` (modify) | Stops refreshing `/billing`. |
| `lib/actions/billing-actions.ts` (modify) | Catalog reads wrapped in `unstable_cache`. |

---

### Task 1: The pure gate decision function

**Files:**
- Create: `lib/entitlements/gate.ts`

**Interfaces:**
- Produces:
  - `type EntitlementSnapshot = { status: "live"; data: EntitlementResponse } | { status: "cached"; data: EntitlementResponse; ageMs: number } | { status: "unavailable" }`
  - `type GateDecision = { outcome: "allow" } | { outcome: "lock"; reason: "lapsed" | "no-entitlement-data" }`
  - `const GRACE_MS = 15 * 60 * 1000`
  - `function decideDestinationAccess(snapshot: EntitlementSnapshot, activeDestinationId: string | undefined, graceMs?: number): GateDecision`

- [ ] **Step 1: Create the module**

Create `lib/entitlements/gate.ts`:

```ts
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
```

- [ ] **Step 2: Verify the exhaustiveness check actually compiles**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Prove the compiler is enforcing the union**

Temporarily add a fourth member to `EntitlementSnapshot`:

```ts
  | { status: "degraded" };
```

Run: `npx tsc --noEmit`
Expected: **FAIL** — `Type '{ status: "degraded"; }' is not assignable to type 'never'` at the `_exhaustive` line. This is the substitute for a test: it proves that a future state cannot be silently ignored.

Then **remove the temporary member** and re-run `npx tsc --noEmit` to confirm it is clean again. Do not commit the temporary member.

- [ ] **Step 4: Commit**

```bash
git add lib/entitlements/gate.ts
git commit -m "Add pure entitlement gate decision function"
```

---

### Task 2: The last-known-good snapshot store

**Files:**
- Create: `lib/entitlements/snapshot.ts`

**Interfaces:**
- Consumes: `EntitlementSnapshot` from `lib/entitlements/gate.ts`.
- Produces: `async function getEntitlementSnapshot(): Promise<EntitlementSnapshot>`, and `function __resetSnapshotStoreForTesting(): void`.

- [ ] **Step 1: Create the module**

Create `lib/entitlements/snapshot.ts`:

```ts
import "server-only";
import { cache } from "react";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { EntitlementResponse } from "@/lib/actions/entitlement-actions";
import type { EntitlementSnapshot } from "@/lib/entitlements/gate";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

/**
 * Last-known-good entitlements, per business, in process memory.
 *
 * Why not `unstable_cache`: the Data Cache has no stale-on-error path. Inside its revalidate
 * window it returns the cached value without calling the function; once expired it re-invokes,
 * and if that invocation throws, the error propagates and nothing is served. There is no way to
 * ask it for "the last value you had". Widening `revalidate` to the grace window would instead
 * make entitlements 15 minutes stale even when billing is healthy — worse for a gate than the
 * 60 seconds billing itself caches at.
 *
 * The trade-off of doing it here: this Map is per-instance and is lost on restart or deploy, so
 * a billing outage in the first moments after a deploy locks users out instead of serving a
 * snapshot. That is the correct direction to fail, and it needs no new infrastructure.
 */
const lastKnownGood = new Map<string, { data: EntitlementResponse; at: number }>();

/** Test/dev seam. Not used in application code. */
export function __resetSnapshotStoreForTesting(): void {
  lastKnownGood.clear();
}

// Per-request dedup, so several guards in one render cause one HTTP call.
const fetchEntitlements = cache(
  async (): Promise<EntitlementResponse | null> => {
    const apiClient = new ApiClient();
    const data = await apiClient.get<EntitlementResponse | null>(
      `${BILLING_SERVICE_URL}/api/v1/entitlements`,
    );
    return parseStringify(data);
  },
);

/**
 * Read entitlements, degrading to the last good answer when billing is unreachable.
 *
 * A 429 from the rate limiter, a 5xx, or a timeout all land in the same place: we serve the
 * previous answer and say how old it is, and the caller decides whether it is old enough to
 * distrust. Callers must branch on `status` — see `decideDestinationAccess`.
 */
export async function getEntitlementSnapshot(): Promise<EntitlementSnapshot> {
  if (!BILLING_SERVICE_URL) {
    console.warn("[ENTITLEMENTS] BILLING_SERVICE_URL not configured");
    return { status: "unavailable" };
  }

  try {
    const data = await fetchEntitlements();
    if (!data) return degraded(undefined);

    lastKnownGood.set(data.businessId, { data, at: Date.now() });
    return { status: "live", data };
  } catch (error) {
    console.warn(
      "[ENTITLEMENTS] Live fetch failed, falling back to snapshot:",
      (error as Error)?.message,
    );
    return degraded(undefined);
  }
}

/**
 * Billing did not answer. We cannot know which business was being asked about without a
 * successful response, so when exactly one business has a snapshot we use it, and when several
 * do we cannot safely guess — returning `unavailable` locks, which is the safe direction.
 */
function degraded(_businessId: string | undefined): EntitlementSnapshot {
  if (lastKnownGood.size !== 1) return { status: "unavailable" };
  const [entry] = Array.from(lastKnownGood.values());
  return { status: "cached", data: entry.data, ageMs: Date.now() - entry.at };
}
```

- [ ] **Step 2: Fix the multi-tenant hole you just read**

The `degraded()` helper above is deliberately written the naive way so you can see the problem: on a server serving more than one business, it cannot tell whose snapshot to return, and `lastKnownGood.size !== 1` makes it useless in production while looking fine in dev.

The business id is available without billing — the same header `ApiClient` already sends. Read it from the auth token and key the lookup properly. Replace the import block addition and `degraded` with:

```ts
import { getAuthToken } from "@/lib/auth-utils";
```

```ts
async function currentBusinessId(): Promise<string | undefined> {
  try {
    const token = await getAuthToken();
    return token?.businessId ?? undefined;
  } catch {
    return undefined;
  }
}

function degraded(businessId: string | undefined): EntitlementSnapshot {
  if (!businessId) return { status: "unavailable" };
  const entry = lastKnownGood.get(businessId);
  if (!entry) return { status: "unavailable" };
  return { status: "cached", data: entry.data, ageMs: Date.now() - entry.at };
}
```

and update both call sites in `getEntitlementSnapshot` to `return degraded(await currentBusinessId());`.

**Before writing this, confirm the field name.** Open `lib/auth-utils.ts` and check what the token exposes — it may be `businessId`, `business_id`, or nested. Use the real one. If the token genuinely does not carry a business id, fall back to reading the `currentBusiness` cookie the way `lib/actions/business/get-current-business.tsx` does, and say in your report which you used.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/entitlements/snapshot.ts
git commit -m "Add last-known-good entitlement snapshot store"
```

---

### Task 3: Rewire `entitlement-actions` onto the snapshot

**Files:**
- Modify: `lib/actions/entitlement-actions.tsx`

**Interfaces:**
- Consumes: `getEntitlementSnapshot` from Task 2.
- Produces: `getEntitlements()` keeps its existing signature `Promise<EntitlementResponse | null>` so no caller breaks. `hasEntityFeature` and `isWithinEntityLimit` keep their signatures but stop failing open.

- [ ] **Step 1: Replace the fetch internals**

In `lib/actions/entitlement-actions.tsx`, delete the local `_fetchEntitlements` (the `cache(...)` block) and rewrite `getEntitlements` to delegate. Keep the `EntitlementItem` and `EntitlementResponse` interface exports exactly as they are — `gate.ts` and `snapshot.ts` both import `EntitlementResponse` from this file, so moving it would create a cycle.

```ts
import { getEntitlementSnapshot } from "@/lib/entitlements/snapshot";
import { GRACE_MS } from "@/lib/entitlements/gate";
```

```ts
/**
 * Fetch entitlements for the current business.
 *
 * Returns the live answer, or the last good one when billing is unreachable and that answer is
 * still inside the grace window. Returns null only when there is nothing trustworthy to return —
 * callers that gate access MUST treat null as "deny", not as "allow".
 */
export const getEntitlements = async (): Promise<EntitlementResponse | null> => {
  const snapshot = await getEntitlementSnapshot();
  if (snapshot.status === "live") return snapshot.data;
  if (snapshot.status === "cached" && snapshot.ageMs <= GRACE_MS) return snapshot.data;
  return null;
};
```

- [ ] **Step 2: Close the two fail-open helpers**

Still in the same file, `hasEntityFeature` and `isWithinEntityLimit` currently `return true` when there is no entitlement data. Both are reached from `lib/actions/sales-report-export-actions.ts`, `app/(protected)/report/sales/page.tsx`, and `app/(protected)/departments/[id]/page.tsx`. Change the no-data branches to deny:

```ts
export const hasEntityFeature = async (
  entityId: string,
  featureKey: string,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true; // unconfigured local dev, not a billing failure
  const item = await getEntityEntitlements(entityId);
  if (!item) return false; // no trustworthy entitlement data → deny
  return item.features[featureKey] === true;
};

export const isWithinEntityLimit = async (
  entityId: string,
  limitKey: string,
  currentCount: number,
): Promise<boolean> => {
  if (!BILLING_SERVICE_URL) return true; // unconfigured local dev, not a billing failure
  const item = await getEntityEntitlements(entityId);
  if (!item) return false; // no trustworthy entitlement data → deny
  const limit = item.limits[limitKey];
  if (limit === undefined || limit === -1) return true; // unlimited
  return currentCount < limit;
};
```

The `!BILLING_SERVICE_URL` branch stays permissive on purpose: an unconfigured local environment is a developer running without billing, not a billing outage.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 4: Check the three call sites still make sense**

Read each of `lib/actions/sales-report-export-actions.ts`, `app/(protected)/report/sales/page.tsx`, and `app/(protected)/departments/[id]/page.tsx` where they call these helpers. Confirm that a `false` return renders a "not available on your plan" state rather than crashing or rendering a blank page. If any of them treats `false` as an error condition, note it in your report — do not silently redesign those pages.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/entitlement-actions.tsx
git commit -m "Route entitlements through the snapshot; deny on missing data"
```

---

### Task 4: The layout gate stops failing open

**Files:**
- Modify: `app/(protected)/layout.tsx` (the gate block, around lines 110-146)

**Interfaces:**
- Consumes: `getEntitlementSnapshot` (Task 2), `decideDestinationAccess` (Task 1).

**Note:** this file has unrelated in-flight changes around lines 187-205 (an identity refactor). Do not touch that region, and stage only this file's gate hunk if the tooling allows — otherwise flag it in your report.

- [ ] **Step 1: Swap the entitlement read**

The layout currently calls `getEntitlements()` inside its `Promise.allSettled([...])` block and derives `destinationLocked` inline. Replace the `getEntitlements()` entry in that array with `getEntitlementSnapshot()`, and rename the destructured result from `entitlements` to `entitlementSnapshot`. Its `results[...]` index must not change — keep it in the same array position so every other index still lines up.

The rejection fallback becomes `{ status: "unavailable" } as const` rather than `null`:

```ts
  const entitlementSnapshot =
    results[5].status === "fulfilled"
      ? results[5].value
      : ({ status: "unavailable" } as const);
```

- [ ] **Step 2: Replace the inline lapsed check with the decision function**

Delete the `activeDestinationId` / `destinationLocked` block and replace it with:

```ts
  const activeDestinationId =
    currentStore?.id ?? currentWarehouse?.id ?? currentLocation?.id;
  const gate = decideDestinationAccess(entitlementSnapshot, activeDestinationId);
```

Keep the `isEscapeHatch` block exactly as it is, including the comment about an absent `x-pathname` header meaning "don't lock" — that guard is what stops the redirect looping, and `/billing` is already in the escape-hatch list.

Then replace the redirect block:

```ts
  if (gate.outcome === "lock" && !isEscapeHatch) {
    const lockedType = currentStore?.id
      ? "store"
      : currentWarehouse?.id
        ? "warehouse"
        : "location";
    // `reason` distinguishes "this entity's subscription lapsed" from "we could not reach
    // billing and have no trustworthy answer", so the billing page can explain which it is
    // rather than telling a paying customer their subscription expired.
    redirect(`/billing?expired=${lockedType}&reason=${gate.reason}`);
  }
```

- [ ] **Step 3: Anything downstream that used `entitlements`**

Grep the rest of the file for other uses of the old `entitlements` variable (for example an `EntitlementProvider` further down). Each one needs the underlying data, not the snapshot wrapper. Add, immediately after the `gate` line:

```ts
  const entitlements =
    entitlementSnapshot.status === "unavailable" ? null : entitlementSnapshot.data;
```

and leave those consumers untouched. Confirm with `rg -n 'entitlements' 'app/(protected)/layout.tsx'` that every remaining reference resolves.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 5: Manual verification — this is the substitute for the gate test matrix**

Run `npm run dev`. With `BILLING_SERVICE_URL` pointing at a running billing service:

1. **Entitled destination, billing up** → the app loads normally, no redirect.
2. **Lapsed destination, billing up** → redirected to `/billing?expired=<type>&reason=lapsed`.
3. **Billing down, snapshot fresh** → stop the billing service, then navigate between two protected pages. You should keep working (the snapshot is inside grace), and the server log should show `Live fetch failed, falling back to snapshot`.
4. **Billing down, no snapshot** → stop billing, restart `npm run dev` so the Map is empty, then load a protected page. You should be redirected to `/billing?expired=<type>&reason=no-entitlement-data` — **this is the case that used to grant full access**, and it is the single most important one to see with your own eyes.
5. **On `/billing` itself with billing down** → you stay on the page rather than looping, because `/billing` is an escape hatch.

Record the observed result for all five in your report. If any differs from the expected outcome, stop and report rather than adjusting the expectation.

- [ ] **Step 6: Commit**

```bash
git add "app/(protected)/layout.tsx"
git commit -m "Gate destinations on a trustworthy snapshot instead of failing open"
```

---

### Task 5: `feature-guard` stops locking out paying customers

**Files:**
- Modify: `lib/feature-guard.ts`

**Interfaces:**
- Consumes: `getEntitlements()` from Task 3, which now already returns the snapshot-backed answer.

- [ ] **Step 1: Delete the hand-rolled 5-second cache**

`getEntitlementsOnce()` in this file implements its own request cache keyed on `Math.floor(Date.now() / 5000)`. That is a time bucket, not a request scope: two different requests inside the same 5-second window share an entry, and one request straddling a bucket boundary gets two different answers. Now that `getEntitlements` is backed by React `cache()` (per-request) plus the snapshot store, this is redundant and strictly worse.

Delete `cachedEntitlements`, `cacheRequestId`, and `getEntitlementsOnce`, then replace every call to `getEntitlementsOnce()` in the file with `getEntitlements()`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. If it complains about an unused import, remove it.

- [ ] **Step 3: Verify the behaviour change is the intended one**

No code change is needed for this step — reason about it and record the answer in your report. Before this plan, a 429 from billing made `getEntitlements()` return null, so `assertActiveSubscription` threw `SubscriptionInactiveError` and a fully paid-up customer was blocked from every mutation. After Task 3, the same 429 returns the snapshot, so the customer keeps working. Confirm by reading `assertActiveSubscription` that this now holds, and that a genuinely inactive subscription (`entitlements.active === false`) still throws.

- [ ] **Step 4: Commit**

```bash
git add lib/feature-guard.ts
git commit -m "Drop feature-guard's time-bucket cache; inherit snapshot semantics"
```

---

### Task 6: `getBillingOverview()` server action

**Files:**
- Create: `lib/actions/billing-overview-actions.ts`

**Interfaces:**
- Produces: `type BillingOverview` and `async function getBillingOverview(): Promise<BillingOverview | null>`.

The billing service returns `BillingOverviewResponse` with exactly these fields: `subscription`, `packages`, `addons`, `invoices`, `invoicesTotal`, `creditBalances`, `creditPacks`, `creditTransactions`, `creditTransactionsTotal`, `entitlements`.

- [ ] **Step 1: Create the action**

Create `lib/actions/billing-overview-actions.ts`:

```ts
"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { EntitlementResponse } from "@/lib/actions/entitlement-actions";
import type {
  Addon,
  Coupon,
  CreditBalance,
  CreditPack,
  CreditTransaction,
  Invoice,
  Package,
  Subscription,
} from "@/types/billing/types";

const BILLING_SERVICE_URL = process.env.BILLING_SERVICE_URL || "";

/** Mirrors the billing service's BillingOverviewResponse. */
export interface BillingOverview {
  subscription: Subscription;
  packages: Package[];
  addons: Addon[];
  invoices: Invoice[];
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
  } catch (error) {
    console.warn(
      "[BILLING] Overview fetch failed:",
      (error as Error)?.message,
    );
    return null;
  }
}
```

**Before writing the import block, verify the type names.** Open `types/billing/types.ts` and confirm `Subscription`, `Package`, `Addon`, `Invoice`, `CreditBalance`, `CreditPack`, `CreditTransaction` all exist with those exact names. Correct any that differ, and drop `Coupon` from the import if it is unused. Do not invent a type — if one is genuinely missing, define the minimal interface inline and say so in your report.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/billing-overview-actions.ts
git commit -m "Add getBillingOverview server action"
```

---

### Task 7: Billing page renders from the overview

**Files:**
- Modify: `app/(protected)/billing/page.tsx` (lines ~50-113)

**Interfaces:**
- Consumes: `getBillingOverview()` (Task 6).

- [ ] **Step 1: Replace the two fetch blocks with one call**

The page currently calls `getCurrentSubscription()` at line ~51, then a nine-entry `Promise.all` at lines ~96-108. Replace both with a single overview call, keeping the two entries that are **not** billing service calls — `fetchAllLocations()` and `getWarehouses(businessId)` go to the accounts service and must stay.

```ts
  const lockedEntity = (await searchParams)?.expired;
  const overview = await getBillingOverview();

  if (!overview?.subscription) {
    // ...unchanged "No subscription found" empty state...
  }

  const subscription = overview.subscription;
  const [business, authToken] = await Promise.all([getCurrentBusiness(), getAuthToken()]);
  const businessId = business?.id ?? subscription.businessId;
  const contactDefaults = {
    email: authToken?.email ?? "",
    phone: authToken?.phoneNumber ?? "",
  };

  const [locations, warehouses] = await Promise.all([
    fetchAllLocations().catch(() => null),
    getWarehouses(businessId).catch(() => []),
  ]);

  const packages = overview.packages;
  const addons = overview.addons;
  const creditBalances = overview.creditBalances;
  const creditPacks = overview.creditPacks;
  const entitlements = overview.entitlements;
```

- [ ] **Step 2: Reshape the two paged values**

The old code destructured `invoicesPage` and `creditTransactionsPage`, which were Spring `Page` objects. The overview returns flat arrays plus totals, so rebuild the shape the child components already expect:

```ts
  const invoicesPage = {
    content: overview.invoices,
    totalElements: overview.invoicesTotal,
  };
  const creditTransactionsPage = {
    content: overview.creditTransactions,
    totalElements: overview.creditTransactionsTotal,
  };
```

**Check what the consumers actually read.** Grep the child components for `invoicesPage` and `creditTransactionsPage` and see which fields they touch — if they read `totalPages`, `number`, or `size`, add those too, computing them from the totals and the page sizes the endpoint uses (20 for invoices, 10 for credit transactions). Report what you found.

- [ ] **Step 3: Surface the lock reason**

Task 4 now redirects with `&reason=lapsed` or `&reason=no-entitlement-data`. Read the param and, when it is `no-entitlement-data`, render a distinct message — telling a paying customer their subscription expired when billing was merely unreachable is the wrong message:

```ts
  const lockReason = (await searchParams)?.reason;
```

Where the page renders its `lockedEntity` banner, branch on `lockReason === "no-entitlement-data"` to show something like "We couldn't reach the billing service, so access is restricted until we can confirm your subscription. Please try again shortly." rather than the expiry copy. Match the existing banner's component and styling — do not introduce a new banner pattern.

You will also need to widen the `searchParams` type on the page's props:

```ts
  searchParams?: Promise<{ expired?: string; reason?: string }>;
```

- [ ] **Step 4: Remove the now-unused imports**

Delete imports for `getCurrentSubscription`, `getPackages`, `getAddons`, `getSubscriptionInvoices`, `getCreditBalances`, `getCreditPacks`, `getCreditTransactions`, and `getEntitlements` if nothing else in the file uses them. Lint will flag any you miss.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 6: Manual verification**

With the billing service running locally, load `/billing` and confirm every tab still renders: plan details, invoices, credits, prepay, addons. Then open the browser network tab, reload, and confirm the page issues **one** request to the billing service rather than eight. Record the observed count in your report.

- [ ] **Step 7: Commit**

```bash
git add "app/(protected)/billing/page.tsx"
git commit -m "Render billing page from the consolidated overview endpoint"
```

---

### Task 8: Stop the realtime listener refreshing `/billing`

This is the task that actually ends the 5-second loop. It is deliberately last among the request cuts so the page is already cheap when the refresh stops.

**Files:**
- Modify: `components/realtime/settlo-realtime-listener.tsx`

- [ ] **Step 1: Skip the refresh on the billing route**

The component subscribes to `location:{id}:inventory` and `business:{id}:customers` and calls `router.refresh()` on any event, throttled to one per `COOLDOWN_MS = 5_000`. An inventory movement or a customer edit cannot change a package price, an invoice, or a credit balance, so refreshing the billing page on those events is pure waste.

Add `usePathname` and an early return inside the handler:

```tsx
import { usePathname, useRouter } from "next/navigation";
```

```tsx
  const pathname = usePathname();
```

and as the first line of the `handler` callback, before the `eventTypes` check:

```tsx
      // Billing data is not affected by inventory or customer events. Refreshing here re-ran the
      // layout AND the billing page — eight billing requests per refresh, every 5s, which is what
      // exhausted the account's rate-limit budget. Billing mutations already call router.refresh()
      // from their own dialogs, and payment confirmation is handled by usePaymentPolling.
      if (pathname?.startsWith("/billing")) return;
```

Add `pathname` to the `useCallback` dependency array alongside `router` and `eventTypes`.

- [ ] **Step 2: Check the reconnect path too**

The same component calls `router.refresh()` from `useRealtimeReconnect`. Apply the same guard there — a reconnect on the billing page has the same cost and the same lack of benefit:

```tsx
  useRealtimeReconnect(() => {
    if (pathname?.startsWith("/billing")) return;
    lastRefreshAtRef.current = Date.now();
    router.refresh();
  });
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean.

- [ ] **Step 4: Manual verification — the whole point of this plan**

With the billing service running, open `/billing` and leave it open for at least 60 seconds while POS activity or any inventory/customer event is occurring (if you cannot generate real events, temporarily lower `COOLDOWN_MS` in a scratch edit to make the loop obvious, then restore it). Watch the browser network tab.

Expected: **no** periodic re-fetch of the page's server data while idle on `/billing`. Then navigate to a non-billing page and confirm the realtime refresh still works there — this guard must not disable the feature everywhere.

Record both observations in your report.

- [ ] **Step 5: Commit**

```bash
git add components/realtime/settlo-realtime-listener.tsx
git commit -m "Stop realtime events refreshing the billing page"
```

---

### Task 9: Cache the catalog reads

**Files:**
- Modify: `lib/actions/billing-actions.ts` (`getPackages` ~:40, `getAddons` ~:63, `getCreditPacks` ~:431)

- [ ] **Step 1: Wrap the three catalog reads**

These three are business-independent catalog data that changes only by admin action, and they are still called from pages other than `/billing`. Wrap each in `unstable_cache` with a tag so it can be invalidated.

`unstable_cache` forbids reading cookies or headers inside the cached function. These three take no auth-dependent input, but `ApiClient` may attach cookies internally — so **verify first**: read `lib/settlo-api-client.ts` and determine whether a call made inside `unstable_cache` would touch `cookies()`. If it would, do NOT wrap these; instead report that finding and stop at Task 9 Step 3, leaving the reads uncached. An unstable_cache violation throws at runtime on a page that currently works, which is worse than an uncached read.

If it is safe, the shape is:

```ts
import { unstable_cache } from "next/cache";

const _getPackagesCached = unstable_cache(
  async (entityType?: string): Promise<Package[]> => {
    // ...existing body of getPackages...
  },
  ["billing-packages"],
  { revalidate: 600, tags: ["billing-catalog"] },
);

export async function getPackages(entityType?: string): Promise<Package[]> {
  if (!BILLING_SERVICE_URL) return [];
  return _getPackagesCached(entityType);
}
```

Apply the same pattern to `getAddons` (key `["billing-addons"]`) and `getCreditPacks` (key `["billing-credit-packs"]`), all sharing the `billing-catalog` tag, all at `revalidate: 600` to match the billing service's own 10-minute `packages` TTL.

- [ ] **Step 2: Invalidate on admin mutation**

Find the admin server actions that create or edit packages, addons or credit packs — `rg -n 'admin' lib/actions/admin/billing.ts` and the sibling admin action files. Add `revalidateTag("billing-catalog")` after each successful mutation, importing it from `next/cache`. If no such admin actions exist in this repo (the admin UI may call the billing service directly), say so in your report and skip this step rather than inventing call sites.

- [ ] **Step 3: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean. The `build` matters here specifically — `unstable_cache` misuse commonly surfaces as a build-time or first-request error rather than a type error.

- [ ] **Step 4: Commit**

```bash
git add lib/actions/billing-actions.ts
git commit -m "Cache billing catalog reads in the Next data cache"
```

---

## Final verification

- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run lint` clean.
- [ ] `npm run build` succeeds.
- [ ] The five gate scenarios from Task 4 Step 5 were each observed and recorded, in particular scenario 4 (billing down, no snapshot → locked), which is the reversal of the old fail-open behaviour.
- [ ] `/billing` issues one billing request per render, not eight (Task 7 Step 6).
- [ ] `/billing` does not re-fetch on a 5-second cadence while idle, and realtime refresh still works on other pages (Task 8 Step 4).
- [ ] `git status` shows no unrelated in-flight work swept into any commit.

## Deployment note

The billing service must be deployed **before** this. `GET /api/v1/billing/overview` is committed on that service's `alpha` branch but unpushed, so until it ships, Task 6's action returns null and the billing page renders its "no subscription" empty state for every account. Nothing else in this plan depends on the new endpoint.

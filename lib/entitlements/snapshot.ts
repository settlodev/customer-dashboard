import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { EntitlementResponse } from "@/lib/actions/entitlement-actions";
import type { EntitlementSnapshot } from "@/lib/entitlements/gate";
import { getAuthToken } from "@/lib/auth-utils";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";

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
 *
 * `freshUntil` carries a SECOND, narrower window on top of that (see `freshWindowMs`): while it
 * is in the future the entry is served as `live` without calling billing at all. `at` still
 * dates the entry for the outage-grace path, so expiring the fresh window never costs us the
 * last-known-good answer — the two windows are independent on purpose.
 */
type Entry = { data: EntitlementResponse; at: number; freshUntil: number };
const lastKnownGood = new Map<string, Entry>();

/** Test/dev seam. Not used in application code. */
export function __resetSnapshotStoreForTesting(): void {
  lastKnownGood.clear();
}

// ── Fresh window ────────────────────────────────────────────────────
//
// `getEntitlementSnapshot()` runs in the (protected) layout, so before this it made one HTTP
// call to billing on EVERY protected page render — every navigation, every `router.refresh()`,
// on every page in the app. React `cache()` below only dedups within a single render, so none
// of that was absorbed. That volume is what exhausts the Billing Service's rate-limit bucket
// (RateLimitFilter: 100 requests/60s per business+user), and a 429 there degrades the gate.
//
// Entitlements do not drift on their own: between mutations they change only when a dated
// boundary passes (the subscription's paid-through date, a trial end). So the window is derived
// from the payload itself — cache until the next boundary, and no further.
//
// The ceiling exists because mutations are invisible from here: an admin console change, a
// payment made on another device, a location provisioned elsewhere. Our OWN mutations are
// handled precisely by `invalidateEntitlementSnapshot()`; the ceiling bounds everything else.
const FRESH_MAX_MS = 5 * 60 * 1000;
// Floor, so a boundary that is seconds away doesn't produce a pointless sub-second window.
// Overshooting a boundary by a few seconds is harmless; billing's own `entitlements` cache is
// 60s, so a live call inside that span would have returned the pre-boundary answer anyway.
const FRESH_MIN_MS = 5 * 1000;

/**
 * How long this payload can be trusted without asking billing again.
 *
 * Only dated boundaries count. A boundary already in the past is not a pending change — it has
 * already happened and is baked into the answer we are holding — so it is ignored rather than
 * treated as "expires immediately"; an account that lapsed last month would otherwise defeat the
 * cache entirely, which is exactly the population most likely to be reloading the billing page.
 */
function freshWindowMs(data: EntitlementResponse): number {
  const now = Date.now();
  let next = Number.POSITIVE_INFINITY;

  const consider = (iso: string | null | undefined) => {
    if (!iso) return;
    const t = Date.parse(iso);
    if (Number.isNaN(t) || t <= now) return;
    if (t < next) next = t;
  };

  consider(data.paidThrough);
  consider(data.trialEndDate);
  // Each entity's subscription expires SEPARATELY (see EntitlementItem), so a per-item trial
  // end can flip `item.active` — and therefore the destination gate — well before the business
  // level does.
  for (const item of data.items ?? []) consider(item.trialEndDate);

  // Nothing dated is pending: this answer can only change by a mutation, which the ceiling and
  // the explicit invalidation below already cover.
  if (next === Number.POSITIVE_INFINITY) return FRESH_MAX_MS;
  return Math.min(FRESH_MAX_MS, Math.max(FRESH_MIN_MS, next - now));
}

// ── Cross-instance invalidation ─────────────────────────────────────
//
// `lastKnownGood` is per-instance, so clearing it on the instance that handled a payment does
// nothing for the user's NEXT request if that lands on a different one — they would stay locked
// for up to the ceiling after paying. This cookie travels with the user instead: it stamps the
// moment their entitlements were known to change, and every instance discards any entry it
// cached before that stamp. Short-lived — once the stamp is older than the longest window it
// can possibly invalidate, it is inert.
const BUST_COOKIE = "entitlementsBustedAt";
const BUST_COOKIE_MAX_AGE_S = 15 * 60;

async function bustedAt(): Promise<number> {
  try {
    const raw = (await cookies()).get(BUST_COOKIE)?.value;
    if (!raw) return 0;
    const t = Number(raw);
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

/**
 * Drop the fresh window so the next read goes back to billing.
 *
 * Call after anything that can change entitlements — a payment, an activation, a plan change.
 * Deliberately does NOT delete the entry: the outage-grace path (`degraded`) still wants the
 * last good answer, and throwing it away would turn "we just took a payment" into "we have
 * nothing to fall back on if billing is down a second later".
 *
 * Must be called from a Server Action or Route Handler — it writes a cookie.
 */
export async function invalidateEntitlementSnapshot(): Promise<void> {
  try {
    const businessId = await currentBusinessId();
    if (businessId) {
      const entry = lastKnownGood.get(businessId);
      if (entry) entry.freshUntil = 0;
    }
  } catch {
    // Best-effort: the cookie below is what makes this correct across instances anyway.
  }
  try {
    const isProduction = process.env.NODE_ENV === "production";
    (await cookies()).set({
      name: BUST_COOKIE,
      value: String(Date.now()),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      path: "/",
      maxAge: BUST_COOKIE_MAX_AGE_S,
    });
  } catch {
    // Called outside a request that may set cookies. The in-process clear above still applies.
  }
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
 * The business id the live entitlements call resolves to, so a degraded lookup can key on the
 * same identity billing itself would have used for `data.businessId`.
 *
 * The Billing Service's `GET /api/v1/entitlements` resolves the business from the JWT
 * `business_id` claim first, and only falls back to the `X-Business-Id` header when that claim
 * is absent (EntitlementController). `AuthToken.businessId` (lib/auth-utils.ts) is extracted
 * from that exact claim via `extractBusinessId` (lib/jwt-utils.ts), so it is the correct primary
 * key here — NOT the `currentBusiness` cookie. That cookie only backs the header fallback, and
 * for a multi-business account it can disagree with the claim: switching business
 * (`refreshBusiness`) only rewrites the `currentBusiness`/`activeBusiness` cookies — it never
 * re-mints the access token — so the JWT claim keeps pointing at whatever business was "current"
 * at login. Using the cookie as the primary key would make the map key drift from
 * `data.businessId` the moment such an account switches business, which would silently turn
 * into "the grace window never works" for that account. Mirroring billing's own two-step
 * precedence (claim, then cookie) keeps the two in agreement.
 *
 * Also the read key for the fresh window. A disagreement between this and `data.businessId` can
 * only ever cause a MISS — we look under one key and stored under another — which costs a call
 * we would have made anyway. It can never serve one business's entitlements under another's.
 */
const currentBusinessId = cache(async (): Promise<string | undefined> => {
  try {
    const token = await getAuthToken();
    if (token?.businessId) return token.businessId;
  } catch {
    // Fall through to the cookie fallback below.
  }
  try {
    return (await getCurrentBusinessId()) ?? undefined;
  } catch {
    return undefined;
  }
});

/**
 * Billing did not answer. We cannot know which business was being asked about without a
 * successful response, so we resolve the caller's own business id the same way billing would
 * have, and use only that business's snapshot. Without an identifiable business — or without a
 * snapshot for it — we cannot safely guess; returning `unavailable` locks, which is the safe
 * direction.
 */
function degraded(businessId: string | undefined): EntitlementSnapshot {
  if (!businessId) return { status: "unavailable" };
  const entry = lastKnownGood.get(businessId);
  if (!entry) return { status: "unavailable" };
  return { status: "cached", data: entry.data, ageMs: Date.now() - entry.at };
}

/**
 * Read entitlements, degrading to the last good answer when billing is unreachable.
 *
 * A 429 from the rate limiter, a 5xx, or a timeout all land in the same place: we serve the
 * previous answer and say how old it is, and the caller decides whether it is old enough to
 * distrust. Callers must branch on `status` — see `decideDestinationAccess`.
 */
export async function getEntitlementSnapshot(): Promise<EntitlementSnapshot> {
  if (!BILLING_SERVICE_URL) {
    console.error(
      "[ENTITLEMENTS] BILLING_SERVICE_URL is not configured — entitlement gating is DISABLED. " +
        "This must never be true in a deployed environment.",
    );
    return { status: "unavailable" };
  }

  // Resolved up front because the fresh window is keyed on it. On a hit this replaces an HTTP
  // call with a cookie read; on a miss it is the same lookup the failure paths below already did.
  const businessId = await currentBusinessId();

  // Still inside the window this payload told us to trust it for, and not superseded by a
  // mutation of our own. Reported as `live` rather than `cached` on purpose: `cached` means
  // "billing is unreachable and this is old", and the gate widens its grace accordingly. This
  // answer is neither — it is the current answer, deliberately not re-fetched.
  if (businessId) {
    const entry = lastKnownGood.get(businessId);
    if (entry && entry.freshUntil > Date.now() && entry.at >= (await bustedAt())) {
      return { status: "live", data: entry.data };
    }
  }

  try {
    const data = await fetchEntitlements();
    if (!data) return degraded(businessId);

    const now = Date.now();
    lastKnownGood.set(data.businessId, {
      data,
      at: now,
      freshUntil: now + freshWindowMs(data),
    });
    return { status: "live", data };
  } catch (error) {
    console.warn(
      "[ENTITLEMENTS] Live fetch failed, falling back to snapshot:",
      (error as Error)?.message,
    );
    return degraded(businessId);
  }
}

/**
 * Whether entitlement gating can actually operate. `getEntitlementSnapshot` returns
 * `{status: "unavailable"}` both when billing is unreachable AND when `BILLING_SERVICE_URL`
 * is simply unset — those are not the same failure. An outage is real and must lock a lapsed
 * destination; a missing env var is a local-dev or deploy-config gap, and locking every user
 * out of the app over it would turn a configuration slip into a total outage. Callers that
 * gate access must check this first and skip locking when it is false, while still relying on
 * the loud `console.error` above to surface the misconfiguration.
 */
export function isEntitlementGatingConfigured(): boolean {
  return Boolean(BILLING_SERVICE_URL);
}

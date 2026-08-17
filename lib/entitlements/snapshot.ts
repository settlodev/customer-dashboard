import "server-only";
import { cache } from "react";
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
 */
async function currentBusinessId(): Promise<string | undefined> {
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
}

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

  try {
    const data = await fetchEntitlements();
    if (!data) return degraded(await currentBusinessId());

    lastKnownGood.set(data.businessId, { data, at: Date.now() });
    return { status: "live", data };
  } catch (error) {
    console.warn(
      "[ENTITLEMENTS] Live fetch failed, falling back to snapshot:",
      (error as Error)?.message,
    );
    return degraded(await currentBusinessId());
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

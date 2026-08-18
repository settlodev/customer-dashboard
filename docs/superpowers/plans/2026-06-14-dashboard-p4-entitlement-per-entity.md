# Dashboard Sub-project ④ — Entitlement per-entity enforcement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Make the server-side entitlement guards (`lib/feature-guard.ts`) per-entity-aware (use the active entity's `items[].features`/`limits` instead of the business aggregate), keeping them server-authoritative and back-compatible.

**Architecture:** `lib/feature-guard.ts` (server guards) + `lib/actions/entitlement-actions.tsx` (which ALREADY exposes per-entity helpers: `getEntityEntitlements`, `hasEntityFeature`, `isWithinEntityLimit`, and `EntitlementResponse.items[]` with per-entity `features`/`limits`). The active entity is the `currentLocation` cookie.

**Tech Stack:** TS strict, server actions, cookies. Verify with `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-14-dashboard-per-entity-billing-alignment-design.md` (§7).

---

## Execution Notes (read first)
- Branch `alpha`; **stage ONLY each task's files** (never `-A`); admin-locations/platform-metrics WIP untouched (④ touches `lib/feature-guard.ts` + maybe a cookie helper — disjoint).
- **Verify: `npx tsc --noEmit` (clean baseline) + `npm run lint` on touched files. No test runner.**
- **Scope reality (verified):** the per-entity entitlement helpers already exist; `feature-guard`'s 4 guards just read the aggregate. The guards currently have ~no real call sites (only `usage-counts.ts` docs), so this is correctness-prep, low blast radius. `EntitlementItem` has NO per-item `status` field, and `middleware.ts` reads a single business-level `subscriptionStatus` JWT claim — so **full per-entity *status* surfacing in the global banner/middleware needs a backend change** (per-item status in the entitlements response, or a worst-case JWT claim). That is documented as a backend follow-up here, NOT built. Per-item status is ALREADY visible to users on the billing page (②'s items-table).

---

## Task 1: Make `feature-guard.ts` guards per-entity-aware

**Files:** `lib/feature-guard.ts` (+ a small active-location resolver if one isn't already exported — check `lib/auth-utils.ts` / `lib/settlo-api-client.ts` `readCookieId("currentLocation")`).

**Context:** `assertFeature`/`assertLimit`/`checkFeature`/`checkLimit` read `entitlements.features[key]`/`entitlements.limits[key]` (the business-AGGREGATED maps). With mixed per-entity plans the aggregate masks a per-entity violation (e.g. one location's lower plan). Resolve the active entity and use ITS `items[]` entry; fall back to the aggregate when no entity context (back-compat, permissive).

- [ ] **Step 1 — active-entity resolver.** Find how to read the active location id server-side. `lib/settlo-api-client.ts` already reads `currentLocation` via a `readCookieId` helper (~line 308) for `X-Location-Id`. If there's an exported helper to get the current location id (check `lib/auth-utils.ts`), use it; otherwise add a tiny server helper in `feature-guard.ts` (or import the cookie + parse its `id`/`locationId`) — read the `currentLocation` cookie and return its entity id, or `null`. Keep it minimal.

- [ ] **Step 2 — per-entity resolution helper (in `feature-guard.ts`).** Add an internal helper that, given the loaded `EntitlementResponse` and an optional explicit `entityId`, returns the `EntitlementItem` to use:
```ts
async function resolveEntityItem(
  ent: EntitlementResponse,
  entityId?: string,
): Promise<EntitlementItem | null> {
  const id = entityId ?? (await getActiveLocationId()); // null if none
  if (!id) return null;
  return ent.items.find((i) => i.entityId === id) ?? null;
}
```
(Import `EntitlementItem` from `entitlement-actions`.)

- [ ] **Step 3 — thread an optional `entityId` through the 4 guards + use the per-entity item.**
  - `assertFeature(featureKey, entityId?)`: after `assertActiveSubscription()`, resolve the item; if an item is found, check `item.features[featureKey] === true`; **else** fall back to `entitlements.features[featureKey] === true` (current aggregate behavior). Throw `FeatureGateError` on miss.
  - `assertLimit(limitKey, currentCount, entityId?)`: resolve the item; use `item.limits[limitKey]` when an item is found, else the aggregate `entitlements.limits[limitKey]`; keep the `undefined || -1 ⇒ unlimited` rule; throw `LimitExceededError` when `currentCount >= limit`.
  - `checkFeature(featureKey, entityId?)` and `checkLimit(limitKey, currentCount, entityId?)`: same per-entity-with-aggregate-fallback, returning boolean (no throw).
  - Keep the `!BILLING_SERVICE_URL ⇒ permissive` and `!active ⇒ false/throw` behaviors unchanged. Keep the existing `getEntitlementsOnce()` cache.
  - Update the doc comments: "Checks the active entity's (or the passed `entityId`'s) features/limits, falling back to the business aggregate when no entity context is available."

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean (the new optional param is additive — existing call sites without `entityId` still compile and now use the active-location entity when present, aggregate otherwise). `git add lib/feature-guard.ts` (+ the helper file if separate); `git commit -m "feat(entitlements): per-entity feature/limit guards (active entity, aggregate fallback)"`. Confirm WIP untouched.

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` (no new errors on touched files).
- [ ] **Opus holistic** over the ④ diff: the 4 guards resolve the active entity (or passed `entityId`) and use its per-entity `items[]` features/limits, with a correct aggregate fallback (no regression for the no-entity-context case); `undefined/-1 ⇒ unlimited` preserved; permissive-when-no-BILLING_SERVICE_URL preserved; cache intact; only intended files committed (WIP preserved); no invented backend fields.
- [ ] **Report + document the backend follow-up:** ④ done (guards per-entity). **Backend follow-up (NOT dashboard-doable):** to surface a per-entity / worst-case subscription *status* in the global `SubscriptionBanner` + `middleware.ts`, the backend must expose per-item `status` on the entitlements response (`EntitlementItem.status`) and/or a worst-case status JWT claim — today the JWT carries one business-level `subscriptionStatus` and `EntitlementItem` has no status. Per-item status is already visible on the billing page (②). Note this for the backend roadmap.
- [ ] **This completes the dashboard rework (①–④).** Warehouse billing UI remains deferred (backend not ready).

## Self-review (author checklist)
- **Spec §7 coverage:** feature-guard per-entity (T1) ✓; per-entity/worst-case status surfacing — scoped as a backend follow-up (entitlements/JWT lack per-item status), with per-item status already user-visible on the billing page.
- **Back-compat:** `entityId` is an optional trailing param; no-entity-context → aggregate fallback (existing behavior). Low blast radius (guards barely wired today).
- **Server-authoritative:** the billing backend remains the source of truth; these guards are a dashboard-side pre-mutation gate, now correct per entity.
- **No invented endpoints/fields:** uses the existing `EntitlementResponse.items[]`; does not assume a per-item status that the backend doesn't send.

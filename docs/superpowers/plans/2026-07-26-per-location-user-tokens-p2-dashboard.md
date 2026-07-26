# Per-Location USER Tokens — Plan 2: Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Repo: **Customer-Dashboard** (Next.js, branch `alpha`). **No test runner exists** — verify each task with `npx tsc --noEmit` and `npm run lint` (and, once at the end, `next build` type-checks the whole tree). Steps use checkbox (`- [ ]`) syntax.

**Goal:** When a dashboard USER selects/switches a destination (location/store/warehouse), mint a token scoped to *that destination* by calling the new `POST /auth/switch-location` (Plan 1), instead of the destination-blind `/auth/token-refresh` the switch path uses today. This turns on per-location USER tokens end-to-end.

**Architecture:** Every switch entry point — the two switchers, the `/select-location` picker, and the single-business/single-location auto-skip — funnels through `switchToLocation`/`switchToStore`/`switchToWarehouse` in `lib/actions/destination.ts`, each of which calls `refreshTokenForDestination()` after setting the destination cookie. Rewiring that one helper to call `/auth/switch-location` with the just-selected destination lights up all of them. Ordinary (non-switch) refreshes are **untouched** — Plan 1 persists the destination on the `RefreshToken`, so the generic `/auth/token-refresh` already preserves scope server-side.

**Tech Stack:** Next.js server actions (`"use server"`), httpOnly chunked `authToken` cookie. Design doc: `Settlo Authentication Service/docs/superpowers/specs/2026-07-26-per-location-user-tokens-design.md` (§4.3).

## Global Constraints
- **No test runner** — verification is `npx tsc --noEmit` + `npm run lint` per task; treat a clean type-check + lint as the green bar. Do NOT add a test framework.
- **Best-effort, graceful degradation.** Mirror today's `refreshTokenForDestination` error posture: any failure (network, non-2xx, or the endpoint not deployed yet → 404) must be swallowed and leave the existing token in place — never throw out of the switch action, never wipe the session. This makes the dashboard safe to deploy even before the Plan 1 backend is live (it silently falls back to today's behavior).
- **Do not touch the ordinary refresh paths** — `middleware.ts` `refreshTokenAtEdge`, `lib/settlo-api-client.ts`'s reactive refresh, `lib/realtime/refresh-token.ts`, and `lib/actions/auth/location.tsx`'s inline refresh all keep calling `/auth/token-refresh` (which now preserves the destination server-side). Only the destination-**switch** path changes.
- **Pre-existing uncommitted changes** (if any) in this repo must not be staged/reverted. Stage only the file(s) each task names.
- No wire-protocol change for WS/clients; the `authToken` cookie stays the same chunked shape.

---

## Task 1: Mint a per-destination token on switch via `/auth/switch-location`

**Files:**
- Modify: `lib/actions/destination.ts`

**Interfaces:**
- Consumes: `getCurrentDestination()` from `lib/actions/context.ts` → `Promise<{ type: "LOCATION"|"STORE"|"WAREHOUSE"; id: string } | null>` (it reads the just-set destination cookie, resolving warehouse→store→location, and drops a destination whose business doesn't match `currentBusiness`). `getAuthToken()` + `updateAuthToken()` + `extractSubscriptionStatus()` (already imported/used by `refreshTokenForDestination`).
- Produces: the switch path now sends `{ destinationId, destinationType }` to `/auth/switch-location` and stores the returned per-destination token pair.

- [ ] **Step 1: Rewrite `refreshTokenForDestination` (lib/actions/destination.ts:46-75) to be destination-aware.** Replace its body so it: reads the active destination, calls `/auth/switch-location` with the Bearer access token when a destination is present, and stores the new pair; falls back to the generic `/auth/token-refresh` only when there is no resolvable destination (defensive — the switch callers always set one first). Rename it to `mintTokenForCurrentDestination` for clarity and update the three call sites in the same file.

```ts
// at top of file, add to the existing imports:
import { getCurrentDestination } from "@/lib/actions/context";

// replaces refreshTokenForDestination (lines 46-75)
async function mintTokenForCurrentDestination(): Promise<void> {
  try {
    const authToken = await getAuthToken();
    if (!authToken?.accessToken) return;

    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "";
    const clientId = process.env.NEXT_PUBLIC_WHITELABEL_CLIENT_ID;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clientId) headers["X-Client-Id"] = clientId;

    const destination = await getCurrentDestination();

    // No resolvable destination (shouldn't happen on the switch path, which sets one
    // first) → fall back to a plain refresh, which now preserves scope server-side.
    if (!destination) {
      if (!authToken.refreshToken) return;
      const res = await fetch(`${AUTH_SERVICE_URL}/auth/token-refresh`, {
        method: "POST",
        headers,
        body: JSON.stringify({ refreshToken: authToken.refreshToken }),
      });
      if (!res.ok) return;
      const data = await res.json();
      await updateAuthToken({
        ...authToken,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || authToken.refreshToken,
        subscriptionStatus: extractSubscriptionStatus(data.accessToken),
      });
      return;
    }

    headers["Authorization"] = `Bearer ${authToken.accessToken}`;
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/switch-location`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        destinationId: destination.id,
        destinationType: destination.type, // already "LOCATION"|"STORE"|"WAREHOUSE"
      }),
    });
    // Best-effort: a failure (incl. a not-yet-deployed 404, or an ACCESS_DENIED for a
    // destination the user can't reach) leaves the current token in place. The switcher
    // only offers destinations the user can access, so a denial is not expected here.
    if (!res.ok) return;

    const data = await res.json();
    await updateAuthToken({
      ...authToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || authToken.refreshToken,
      subscriptionStatus: extractSubscriptionStatus(data.accessToken),
    });
  } catch {
    // Non-critical — keep the existing token.
  }
}
```

- [ ] **Step 2: Update the three switch actions** (`switchToLocation` :93-101, `switchToStore`, `switchToWarehouse`) to call `mintTokenForCurrentDestination()` where they currently call `refreshTokenForDestination()`. (Only the call name changes; the cookie-set + `revalidatePath` lines stay.) Confirm via `grep -n "refreshTokenForDestination" lib/actions/destination.ts` that there are zero remaining references after the rename.

- [ ] **Step 3: Verify.**
  - Run `npx tsc --noEmit` → no errors. (Confirms the `getCurrentDestination` import resolves, `destination.type` matches the body field type, and no signature drift.)
  - Run `npm run lint` → clean.
  - Manually reason through the three entry points (switcher `handleConfirm`, `location-list.tsx` `handleSelect`, `business_list.tsx` auto-skip): each sets the destination cookie via `switchTo*` then this helper reads that same cookie via `getCurrentDestination()` and mints for it. Confirm the cookie is set BEFORE the helper runs in all three `switchTo*` bodies (it is — `cookieStore.set(...)` precedes the helper call).

- [ ] **Step 4: Commit** — stage only `lib/actions/destination.ts`.

```bash
git add lib/actions/destination.ts
git commit -m "feat(auth): mint a per-destination token via /auth/switch-location on location switch"
```
(Append the standard Co-Authored-By / Claude-Session trailers.)

---

## Task 2: Confirm no ordinary-refresh path was disturbed + build

**Files:** none (verification task).

- [ ] **Step 1:** `grep -rn "/auth/token-refresh" lib app middleware.ts` — confirm the remaining callers are exactly the ordinary/non-switch ones (`middleware.ts` edge refresh, `lib/settlo-api-client.ts` reactive refresh, `lib/realtime/refresh-token.ts`, `lib/actions/auth/location.tsx`), and that the destination-switch path no longer calls `/auth/token-refresh` except the defensive no-destination fallback. These ordinary paths are CORRECT to leave as `/auth/token-refresh` — Plan 1 preserves the destination server-side on refresh.
- [ ] **Step 2:** `next build` (or `npx tsc --noEmit` if a full build is too slow) — the app type-checks and builds clean.
- [ ] **Step 3:** No commit (verification only), unless the build surfaces a fix.

---

## Self-Review
- **Spec coverage (design §4.3):** the switcher/select-location/auto-skip now send the active destination to `/auth/switch-location` → per-destination token. ✓ The proactive/reactive refreshes are deliberately unchanged because Plan 1 persists the destination on the `RefreshToken` (a refinement over the original §4.3 which predated that decision). ✓
- **Placeholder scan:** none — the full rewritten function body is given.
- **Type consistency:** `getCurrentDestination()` returns `{ type: DestinationType; id }` with `DestinationType = "LOCATION"|"WAREHOUSE"|"STORE"` (`types/catalogue/enums.ts`), sent verbatim as `destinationType` — matches the auth endpoint's `AssignmentType` names. `updateAuthToken(AuthToken)` is the same call `refreshTokenForDestination` already used.
- **Graceful degradation:** every failure path returns without throwing or clearing the token, so shipping this before the Plan 1 backend is live degrades to today's behavior (a 404 from the missing endpoint is swallowed).

## Known residual (out of scope, noted for later)
- The **login → select-location window**: before a destination is picked, the token is still account-wide (a multi-location manager's account-wide `scopes` claim can be large). It's transient (select-location is the first screen; single-location users auto-skip immediately) and narrows to per-destination on selection. Fully eliminating it would require login to mint a thinner token — deferred; not needed for the size symptom, which is about the steady-state (post-selection) token.
- A **switch-location failure** leaves the destination cookie pointing at the new destination while the token still holds the old scope (a cookie/token mismatch). Benign until Plan 3 enforcement; Plan 3 should add a retry/error-UX for a failed switch (e.g. surface it and re-mint), and this is the natural place to handle the `ACCESS_DENIED` (currently HTTP 400) response.

## Execution note
Deploy the Plan 1 backend (Auth `/auth/switch-location` + Accounts per-destination) **before** this dashboard change for the feature to actually take effect — but the graceful-degradation posture means shipping this first only means "no per-destination scoping yet," not breakage.

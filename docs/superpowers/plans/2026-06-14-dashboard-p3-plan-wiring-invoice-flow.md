# Dashboard Sub-project ③ — Plan-selection wiring + invoice-generation flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Make plan selection actually flow to the backend (so the chosen `planCode` reaches `LOCATION_CREATED`/`STORE_CREATED` and the trial is provisioned on the right plan), and verify the invoice-generation → pay flow end to end (the user's #1 priority).

**Architecture:** The accounts API already accepts `planCode` on `CreateLocationInput` / `CreateLocationRequest` / `CreateStoreRequest` (verified in the accounts service). The gap is purely frontend: registration stashes `?package=` in `localStorage["subscription"]` but never sends it; the `/subscription` picker is an orphaned no-op; store creation picks `packages[0]`. Wire these through; then trace the invoice flow.

**Tech Stack:** Next.js App Router, server actions, TS strict. Verify with `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-14-dashboard-per-entity-billing-alignment-design.md` (§6).

---

## Execution Notes (read first)
- Branch `alpha`; **stage ONLY each task's files** (never `-A`); the user's admin-locations/platform-metrics WIP stays untouched (③ touches `app/(auth)`, `components/forms`, `components/subscription`, `lib/actions/auth`, `lib/actions/billing-actions.ts` — disjoint from the admin WIP).
- **Verify: `npx tsc --noEmit` (clean baseline) + `npm run lint` on touched files. No test runner.** Backend unpushed → live invoice/pay behavior is the user's staging check.
- **Follow existing patterns — no redesign.** Read each file first.
- **Backend contracts (verified, accounts service):** `CreateLocationInput.planCode` (the `/api/v1/businesses/with-locations` per-location input), `CreateLocationRequest.planCode`, `CreateStoreRequest.planCode`, `CreateWarehouseRequest.planCode` all exist. When `planCode` is omitted/unresolvable the billing backend falls back to the structural default package (`getTrialPackage`) — so omitting is safe; sending the chosen code is the improvement.
- **Flow facts:** `components/forms/register_form.tsx` step3 calls `createBusinessWithLocations` (L466) → on success `router.push("/dashboard")` (L497); it stashes `searchParams.get("package")` → `localStorage["subscription"]` (L258-267) but never reads it. `app/(auth)/subscription/page.tsx` `handleSelect` is a no-op (`router.push("/dashboard")`). Onboarding does NOT route through `/subscription`.

---

## Task 1: Wire `planCode` through business + location creation (the core)

**Files:** `lib/actions/auth/business.tsx`, `components/forms/register_form.tsx`.

- [ ] **Step 1 — action accepts + forwards planCode.** In `lib/actions/auth/business.tsx`:
  - Add `planCode?: string;` to the `BusinessWithLocationsPayload.locations[]` element type (≈ lines 35-61).
  - Add `planCode?: string;` to the `createBusinessWithLocations` `data` param type (≈ lines 214-229) — a single signup-chosen plan applied to all created locations.
  - In the payload `locations.map(...)` (≈ lines 258-290), add `planCode: data.planCode` to each returned location object (so every location created at signup carries the chosen code → `CreateLocationInput.planCode` → `LOCATION_CREATED`).
- [ ] **Step 2 — register_form reads the stash + passes it.** In `components/forms/register_form.tsx`, at the `createBusinessWithLocations({...})` call (≈ line 466): read the stashed plan code — `const planCode = (typeof window !== "undefined" && localStorage.getItem("subscription")) || undefined;` (it was stashed from `?package=` at L263) — and pass `planCode` into the `createBusinessWithLocations({ ..., planCode })` argument object. On success (≈ L497, before `router.push("/dashboard")`) clear it: `localStorage.removeItem("subscription")`.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean; `git add lib/actions/auth/business.tsx components/forms/register_form.tsx`; `git commit -m "feat(onboarding): carry chosen planCode into business/location creation (LOCATION_CREATED)"`. Confirm WIP untouched.

---

## Task 2: Make the `/subscription` picker functional

**Files:** `app/(auth)/subscription/page.tsx`.

**Context:** The picker shows LOCATION packages but `handleSelect` discards the choice. Make it carry the choice into the registration/creation flow via the same `localStorage["subscription"]` stash Task 1 consumes. (Whether the picker is shown before or after business creation, stashing the code is the correct, low-risk behavior — Task 1 consumes it at creation; if a business already exists it's harmless.)

- [ ] **Step 1 — capture the choice.** In `handleSelect(plan)`: the package the user picks has a code. The frontend `Package` type may not expose `code` — check `types/billing/types.ts` `Package`; the billing `PackageResponse` exposes `code` (the billing service added it). If `Package.code` is absent in the FE type, add `code?: string;` to `Package` (the billing API returns it) and use it; otherwise the picker can't carry a code and you should pass the package `id`/`name` per what `CreateLocationInput.planCode` expects — **confirm what `planCode` is (a package CODE string)** and stash that. Stash: `localStorage.setItem("subscription", <planCode>)`.
- [ ] **Step 2 — route into creation.** After stashing, route the user into the onboarding/business-registration step so the choice is consumed (e.g. `router.push("/business-registration")` — confirm the correct route for step3; the explorer noted `app/(auth)/business-registration/page.tsx` renders step3). If a business already exists (post-onboarding visitor), keep `/dashboard`. Keep it simple — prefer routing to business-registration when no business yet.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean; `git add app/(auth)/subscription/page.tsx` (+ `types/billing/types.ts` if you added `code`); `git commit -m "feat(onboarding): subscription picker carries chosen plan into signup"`.

---

## Task 3: Store-creation plan selection (→ `STORE_CREATED`)

**Files:** `components/subscription/EntitySubscriptionSetup.tsx`, `components/forms/store-upgrade-dialog.tsx`, `components/forms/store_form.tsx`, and the store-create action in `lib/actions/*` (find where `CreateStoreRequest` is built).

**Context:** `EntitySubscriptionSetup` grabs `packages[0]` when adding a STORE/WAREHOUSE item (no user choice). Store creation should let the user pick a STORE plan whose code flows to `STORE_CREATED` (`CreateStoreRequest.planCode`).

- [ ] **Step 1 — store create carries planCode.** Find the action that creates a store (grep `createStore` / `CreateStoreRequest` / `/stores`). Add an optional `planCode` to its input and include it in the POST body (the accounts `CreateStoreRequest.planCode` accepts it). 
- [ ] **Step 2 — plan picker in `EntitySubscriptionSetup`.** Read `components/subscription/EntitySubscriptionSetup.tsx` (~lines 88-91 picks `packages[0]`). Replace the silent `packages[0]` with a simple plan picker (reuse an existing select/radio/card pattern already in the file or a sibling) over the STORE packages (`getPackages("STORE")`), defaulting to the first but letting the user choose. Carry the chosen code into the add-item / store-create call.
- [ ] **Step 3 — store_form / upgrade dialog.** If `store_form.tsx` creates the store directly, let the chosen STORE plan code flow there. Keep the existing limit-409 → `store-upgrade-dialog` behavior intact (that path upgrades the LOCATION plan to raise store quota — leave it; it's a separate, working mechanism).
- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean; commit touched files: `git commit -m "feat(stores): carry chosen STORE planCode into store creation"`.
> **If** store creation has no clean place to pick a plan without UI redesign, do the MINIMAL correct thing: pass the chosen code where `EntitySubscriptionSetup` already adds the item, and leave a `// NOTE:` for the fuller picker. Don't redesign.

---

## Task 4: Verify the invoice-generation → pay flow end to end (PRIORITY)

**Files:** read-only trace across `lib/actions/billing-actions.ts`, `lib/actions/payment-actions.ts`, `components/billing/billing-client.tsx`, `components/billing/invoices-tab.tsx`, `components/billing/invoice-view-dialog.tsx`, `components/billing/payment-options-dialog.tsx`, `app/(protected)/billing/page.tsx`. Fix only what's broken.

**Context:** After an entity is created the billing backend generates a consolidated **activation invoice** (PENDING). The user must see it (Invoices tab) → open it → pay (Selcom) → poll → PAID. Confirm each hop works with the per-entity model (and the ② bill-to/`canPay` changes).

- [ ] **Step 1 — trace + assert.** Walk the chain and confirm: `billing/page.tsx` fetches the current subscription + its invoices; `invoices-tab.tsx` lists them (PENDING shows + is openable); `invoice-view-dialog.tsx` shows line items (one per entity) + `canPay` is true for a PENDING invoice with a businessId (✓ after ②'s fix); `payment-options-dialog` → `payment-actions.initiatePayment` posts to the right endpoint with businessId/invoice/customer details (NOT requiring locationId); polling (`usePaymentPolling` → `getPaymentStatus`) + timeout work; on success the invoice flips to PAID and the UI refreshes (`revalidateTag`/`revalidatePath`). Note exact file:line for any break.
- [ ] **Step 2 — fix breaks.** Fix any concrete break found (e.g. a field the per-entity invoice no longer provides, a stale status check, a missing refresh). Keep changes minimal + tsc-clean. If the chain is sound, record that (no code change) — this task can be verify-only.
- [ ] **Step 3 — verify + commit (if changed).** `npx tsc --noEmit` clean; commit any fixes: `git commit -m "fix(billing): <specific> in invoice-generation/pay flow"`. If no code change, report the trace result (no commit).

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` (no new errors on touched files).
- [ ] **Opus holistic** over the ③ diff: planCode flows end-to-end (FE stash → action payload → `CreateLocationInput.planCode`; store → `CreateStoreRequest.planCode`); the `/subscription` picker carries the choice; the invoice→pay chain is sound (esp. no residual `locationId` gate, consolidated line items render, status refresh works); only intended files committed (WIP preserved); patterns reused; `planCode` semantics correct (a package CODE string, not id/name — verify against what the backend expects).
- [ ] **Report:** ③ done; the invoice-generation/pay flow trace result; user validates live (signup with `?package=`, confirm trial provisioned on the chosen plan + activation invoice payable) in staging. Proceed to sub-project ④.

## Self-review (author checklist)
- **Spec §6 coverage:** registration planCode wiring (T1) ✓; picker functional (T2) ✓; store planCode (T3) ✓; invoice flow verified (T4) ✓.
- **Backend ready:** accounts `CreateLocationInput/CreateStoreRequest.planCode` confirmed present → frontend-only wiring.
- **planCode is a CODE string** — confirm the billing `Package`/`PackageResponse` exposes `code` and that's what the backend matches (the billing service resolves the trial package by planCode).
- **Safe fallback:** omitting planCode → backend default package; so partial wiring never breaks signup.
- **WIP preservation:** ③ files are disjoint from the admin WIP; precise staging regardless.
- **Invoice flow is the priority** — T4 is a deliberate end-to-end trace, fixing only real breaks.

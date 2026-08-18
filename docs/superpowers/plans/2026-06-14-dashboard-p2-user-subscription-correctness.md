# Dashboard Sub-project ② — User per-entity subscription correctness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Make the customer-facing billing UI correct for the per-entity model: full per-item status model + display, derive trial from a future `trialEndDate` (kill the dead `status === "TRIAL"` checks), and resolve multi-entity invoice "Bill to" + per-item removal.

**Architecture:** `components/billing/**` (RSC `app/(protected)/billing/page.tsx` → `BillingClient`) + `context/entitlementContext.tsx` + `components/subscription/SubscriptionBanner.tsx`, fed by `lib/actions/billing-actions.ts` + `types/billing/types.ts`. Vertical slices; `npx tsc --noEmit` stays green per task.

**Spec:** `docs/superpowers/specs/2026-06-14-dashboard-per-entity-billing-alignment-design.md` (§5).

---

## Execution Notes (read first)
- Branch `alpha`; **stage ONLY each task's files** (never `-A`); the user's admin-locations/platform-metrics WIP stays untouched (it's all under `app/(admin)`/`lib/admin`/`platform-metrics` — ② touches none of it).
- **Verify: `npx tsc --noEmit` (clean baseline, keep clean) + `npm run lint` on touched files. No test runner.** Backend unpushed → live behavior is the user's staging check.
- **Follow existing patterns — no redesign.** Read the component first; reuse `components/billing/shared.ts` status maps, existing badges, dialogs.
- **Backend facts:** item statuses ∈ {ACTIVE, PAST_DUE, EXPIRED, SUSPENDED, CANCELLED} (no TRIAL — a trial item is ACTIVE with a future `trialEndDate`). The billing API `SubscriptionItemResponse` returns `status` + `trialEndDate` (per item). `Subscription` has `status` (TRIAL/ACTIVE/…), `trialEndDate`, `paidThrough`. Item removal: the billing API supports removing an item (Phase 2b) — verify the endpoint/action before wiring T3.

---

## Task 1: Per-item status model + display

**Files:** `types/billing/types.ts`, `components/billing/shared.ts`, `components/billing/items-table.tsx`.

- [ ] **Step 1 — type.** In `types/billing/types.ts`: change `SubscriptionItemStatus` (line 52) to `"ACTIVE" | "PAST_DUE" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "REMOVED"`. Add to `interface SubscriptionItem` (after `status`): `trialEndDate: string | null;` (the billing `SubscriptionItemResponse` returns it; if it also returns `paidThrough`, add `paidThrough: string | null;` too — confirm by checking what the billing action maps / the API DTO).
- [ ] **Step 2 — status maps.** Read `components/billing/shared.ts` (the `SUBSCRIPTION_STATUS_*` maps, ~lines 32-48). Add a per-item status display map (or extend the existing one) covering the 5 item statuses with sensible color/label (reuse the subscription-status palette: ACTIVE=pos/green, PAST_DUE=warn, EXPIRED/SUSPENDED/CANCELLED=neg/muted). Export it for the items table.
- [ ] **Step 3 — items table.** Read `components/billing/items-table.tsx`. Change the row filter (≈ line 55) from `status === "ACTIVE"` to `status !== "REMOVED"` so PAST_DUE/EXPIRED/etc. items are visible. Add a status badge per row (reuse the Step-2 map + existing badge styling). For trialing items (status ACTIVE + future `trialEndDate`), optionally show a "Trial" hint/badge derived from the date. Keep the existing table layout — no redesign.
- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean; `git add types/billing/types.ts components/billing/shared.ts components/billing/items-table.tsx`; `git commit -m "feat(billing): per-item status model + display (PAST_DUE/EXPIRED/etc.)"`. Confirm WIP untouched.

---

## Task 2: Trial-from-`trialEndDate` (remove dead `status === "TRIAL"` logic)

**Files:** `components/billing/shared.ts` (or a small util), `components/billing/overview-tab.tsx`, `context/entitlementContext.tsx`, `components/subscription/SubscriptionBanner.tsx`.

**Context:** Several checks test `status === "TRIAL"`, which never fires now (the subscription may still carry a TRIAL header status from the backend, but item-level trial = ACTIVE + future `trialEndDate`). Derive "in trial" from a future `trialEndDate`.

- [ ] **Step 1 — helper.** Add a small pure helper (in `components/billing/shared.ts` or `lib/`), e.g. `isInTrial(trialEndDate: string | null): boolean` → `!!trialEndDate && new Date(trialEndDate) > new Date()`. (Use it for both subscription-level `subscription.trialEndDate` and per-item `item.trialEndDate`.)
- [ ] **Step 2 — cancellation eligibility.** Read `components/billing/overview-tab.tsx` (`isCancellable`, ~lines 39-43). Update for the new model: cancellable when `subscription.status ∈ {ACTIVE, PAST_DUE}` OR the subscription is in trial (`isInTrial(subscription.trialEndDate)` or `subscription.status === "TRIAL"` if the backend still sends it). Keep it robust to the header still being TRIAL.
- [ ] **Step 3 — entitlement context.** Read `context/entitlementContext.tsx` (~lines 89-90). Derive `isTrial` from `isInTrial(...)` against the entitlement's trial date (the `EntitlementResponse` has `paidThrough`/trial info — use the trial end if present; otherwise keep `status === "TRIAL"` as a fallback). Ensure `isActive` includes trialing-as-active.
- [ ] **Step 4 — banner.** Read `components/subscription/SubscriptionBanner.tsx` (trial banner ~lines 192-210; PAST_DUE ~166-173). Drive the trial banner off `isInTrial(...)` so it actually shows during a trial; keep PAST_DUE/EXPIRED messaging.
- [ ] **Step 5 — verify + commit.** `npx tsc --noEmit` clean; commit the touched files: `git commit -m "fix(billing): derive trial from trialEndDate (replace dead status==='TRIAL')"`.

---

## Task 3: Multi-entity invoice "Bill to" + per-item removal

**Files:** `components/billing/billing-client.tsx`, `components/billing/items-table.tsx` (+ a row action), `lib/actions/billing-actions.ts` (verify/add remove-item action), `components/billing/invoice-view-dialog.tsx` if the bill-to resolution lives there.

- [ ] **Step 1 — invoice bill-to.** Read `components/billing/billing-client.tsx` (the `primaryItem = first ACTIVE item` at ~line 47 and `locationId={primaryItem?.entityId}` at ~86 passed to the Invoices/Renew tabs). For consolidated multi-entity invoices, the "Bill to" should come from the invoice's business (and, if the invoice view shows per-line entities, from those) rather than always the first item. Minimal correct change: pass the `businessId` (and the full subscription) to the invoice dialog and resolve the billing party from the invoice/business there; keep prepay/renew at the subscription level. Confirm `getInvoiceBillingParties` / the dialog can resolve from businessId.
- [ ] **Step 2 — per-item removal.** Check `lib/actions/billing-actions.ts` for an existing remove-item / cancel-item action (the billing API supports item removal — Phase 2b). If present, add a per-row "Remove" action in `items-table.tsx` (confirm dialog, then call it + `revalidateTag`), shown for removable items. If NO such action/endpoint exists, SKIP this step and note it (whole-subscription cancel via the existing `cancel-subscription-dialog` remains) — do not invent an endpoint.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean + `npm run lint`; commit touched files: `git commit -m "feat(billing): multi-entity invoice bill-to + per-item removal"`.

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` (no new errors on touched files).
- [ ] **Opus holistic** over the ② diff: item statuses fully modeled + displayed (no item hidden by an ACTIVE-only filter); trial derived from `trialEndDate` everywhere (no dead `=== "TRIAL"` that silently never fires — unless a deliberate header fallback); invoice bill-to no longer hard-wired to the first item; per-item removal only wired if the backend endpoint exists; only intended files committed (WIP preserved); patterns reused.
- [ ] **Report:** ② done, typechecked; user validates live against the deployed backend. Proceed to sub-project ③.

## Self-review (author checklist)
- **Spec §5 coverage:** item status model+display (T1) ✓; trial-from-date (T2) ✓; invoice bill-to + per-item cancel (T3) ✓.
- **Vertical slices** keep tsc green per task.
- **Don't invent endpoints:** T3 per-item removal is gated on the billing API actually supporting it (verify first).
- **WIP preservation:** ② touches only `components/billing/**`, `context/`, `components/subscription/`, `types/billing/`, `lib/actions/billing-actions.ts` — disjoint from the admin WIP; precise staging regardless.

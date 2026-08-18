# Dashboard Sub-project ① — Admin dashboard / reports alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Make the admin dashboard correctly fetch + display the per-entity billing data from the updated Reports backend, following the existing UI patterns (no redesign).

**Architecture:** Next.js App Router; Server Actions in `lib/actions/admin/*` map the Reports `/api/v2/internal/metrics/**` JSON (via `reportsInternalClient`) into UI shapes consumed by `components/admin/**`. Each task is a vertical slice — backend-contract type + UI type + action mapping + component — so `npx tsc --noEmit` stays green after every task.

**Tech Stack:** TypeScript (strict), shadcn/ui, Recharts/Apex, `BarList`/`MetricCard`/`SectionCard` shared components.

**Spec:** `docs/superpowers/specs/2026-06-14-dashboard-per-entity-billing-alignment-design.md` (§4).

---

## Execution Notes (read first)
- **Branch:** work on `alpha` (the repo is on alpha; the user pushes). The dashboard `alpha` has the user's uncommitted admin-locations/platform-metrics WIP — **build on it; `git add` ONLY the specific files each task changes (never `-A`)**; the WIP file overlap is `app/(admin)/admin/dashboard/page.tsx` (touch only if a task needs it, and commit it as part of that task).
- **⚠ Verification = `npx tsc --noEmit` (must stay clean — baseline is currently clean) + `npm run lint` on touched files. NO test runner exists. The backend is unpushed/undeployed, so live behavior is the user's staging check; here we verify shape-correctness + compile.**
- **Follow existing patterns** — read the current component before editing; reuse `BarList`, `MetricCard`, `SectionCard`, badges, `components/admin/shared/format.ts` helpers, `plan-badge`. No visual redesign.
- **Backend field names** are snake_case in the raw `*Response` contracts (mirror ClickHouse), camelCase in mapped UI types — match the file's existing convention per field.
- Each task: read current file(s) → apply change → `npx tsc --noEmit` clean → commit the specific files.

---

## Task 1: Plan mix → per-entity-type (drop dead `trial_count`)

**Files:** `types/admin/dashboard.ts`, `lib/actions/admin/dashboard-overview.ts`, `components/admin/dashboard/admin-dashboard-view.tsx` (the `PlanMixCard`).

**Context:** Backend `planMix` rows changed: `trial_count` is GONE (item status has no TRIAL); rows are now grouped per `entity_type` and add `item_count`. The UI currently reads `trial_count` → silent "0 trial". Show `entity_type` as a badge and `item_count` instead.

- [ ] **Step 1 — backend-contract type.** In `types/admin/dashboard.ts`, change `DashboardOverviewResponse.planMix` (currently lines ~251-258):
```ts
  planMix: {
    plan_name: string | null;
    entity_type: string;
    tier: string | null;
    business_count: number;
    item_count: number;
    active_count: number;
    mrr: number;
  }[];
```
(removed `trial_count`, added `entity_type` + `item_count`.)

- [ ] **Step 2 — UI type.** In the same file, update `PlanMixItem` (lines ~68-82): remove `trialCount: number;`; add `entityType: string;` and `itemCount: number;`. Keep `tier, label, businesses, activeCount, mrrLabel, pct, color`.

- [ ] **Step 3 — mapping.** Read `lib/actions/admin/dashboard-overview.ts`; in the planMix mapping (≈ lines 380-401) stop reading `p.trial_count`; populate `entityType: p.entity_type`, `itemCount: num(p.item_count)`; drop the `trialCount`/`totalTrial` caption math and replace the caption with an item/active summary (e.g. total items or "N plans"). Keep `pct` based on `business_count` as before.

- [ ] **Step 4 — component.** Read the `PlanMixCard` in `components/admin/dashboard/admin-dashboard-view.tsx`; replace the inline `${p.trialCount} trial` label and the `${totalTrial} trial` caption with `entityType` (a small badge/label, reuse existing badge styling) + `itemCount`/`activeCount`. Follow the existing `BarList`/row layout — no redesign.

- [ ] **Step 5 — verify + commit.** `npx tsc --noEmit` (clean). `git add types/admin/dashboard.ts lib/actions/admin/dashboard-overview.ts "components/admin/dashboard/admin-dashboard-view.tsx"` (adjust the view path if different) and `git commit -m "fix(admin): plan mix per-entity-type, drop dead trial_count"`. Confirm no other files staged (preserve WIP).

---

## Task 2: Revenue MRR-by-entity-type

**Files:** `types/admin/dashboard.ts`, `lib/actions/admin/dashboard-overview.ts`, `components/admin/dashboard/admin-dashboard-view.tsx`.

**Context:** Backend `revenue` now includes `mrrByEntityType: { entity_type, mrr }[]`. Surface it as a small `BarList` in the revenue area, following existing patterns.

- [ ] **Step 1 — contract type.** In `types/admin/dashboard.ts`, add to `DashboardOverviewResponse.revenue` (after `payingCustomers`): `mrrByEntityType: { entity_type: string; mrr: number }[];`.

- [ ] **Step 2 — UI shape.** Add a small UI type and a field to the mapped `DashboardOverview` to carry the breakdown — e.g. add `mrrByEntityType: { name: string; value: number }[]` to `DashboardOverview` (place near `revenue`/`planMix`). (If the dashboard already has a generic `BarList` item shape, reuse it.)

- [ ] **Step 2b — guard the new contract field** so a not-yet-deployed backend (missing the field) doesn't crash the map: read it as `res.revenue.mrrByEntityType ?? []`.

- [ ] **Step 3 — mapping.** In `dashboard-overview.ts`, map `res.revenue.mrrByEntityType` → the UI breakdown (`{ name: entity_type, value: mrr }`), money-formatted via the existing currency helper for labels if the BarList shows labels.

- [ ] **Step 4 — component.** In `admin-dashboard-view.tsx`, render a `BarList` (or the existing list pattern) titled e.g. "MRR by entity type" within/near the revenue section. Reuse existing card + `BarList`.

- [ ] **Step 5 — verify + commit.** `npx tsc --noEmit`; commit the same 3 files: `git commit -m "feat(admin): MRR-by-entity-type breakdown on dashboard"`.

---

## Task 3: Churn predictions → per-item billing features

**Files:** `types/admin/analytics.ts`, `components/admin/analytics/churn-section.tsx`.

**Context:** Backend churn rows now include `billing_status`, `past_due_item_count`, `expired_item_count`, `suspended_item_count`. Surface them alongside the existing `subscription_status`/`is_past_due`.

- [ ] **Step 1 — type.** In `types/admin/analytics.ts`, add to `ChurnPrediction`: `billing_status: string | null;`, `past_due_item_count: number;`, `expired_item_count: number;`, `suspended_item_count: number;`.

- [ ] **Step 2 — display.** Read `components/admin/analytics/churn-section.tsx`; in the prediction row/table add a `billing_status` badge (reuse status badge styling) and the item counts (e.g. "2 past-due · 1 expired") where the row currently shows `subscription_status`/`is_past_due`. Guard for absent fields (`?? 0`, `?? null`). Follow the existing table/row layout.

- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit`; `git add types/admin/analytics.ts "components/admin/analytics/churn-section.tsx"`; `git commit -m "feat(admin): churn predictions show per-item billing status/counts"`.

---

## Task 4: Billing retention cohort view

**Files:** `types/admin/analytics.ts`, `lib/actions/admin/analytics.ts`, the retention component under `components/admin/analytics/` + the analytics page that renders it.

**Context:** New backend endpoint `GET /api/v2/internal/metrics/saas/retention/billing/cohorts` (PAID-invoice retention triangle). Add a parallel view to the existing order-based retention cohort section.

- [ ] **Step 1 — type.** In `types/admin/analytics.ts`, add:
```ts
export interface BillingRetentionCohortCell {
  cohort_month: string;
  months_since_signup: number;
  cohort_size: number;
  active_businesses: number;
  retention_rate: number;
  invoices_in_period: number;
  revenue_in_period: number;
  arpa_in_period: number;
}
```

- [ ] **Step 2 — action.** Read `lib/actions/admin/analytics.ts`; add `getBillingRetentionCohorts(months = 12)` mirroring the existing `getRetentionCohorts` but hitting `${PREFIX}/saas/retention/billing/cohorts?months=${months}` and returning `BillingRetentionCohortCell[]` (same `reportsInternalGet` + error pattern).

- [ ] **Step 3 — view.** Read the existing retention cohort component (the one consuming `getRetentionCohorts`/`RetentionCohortCell`); add a parallel "Billing retention" section/tab rendering `BillingRetentionCohortCell[]` with the SAME heatmap/table component (reuse it — `retention_rate` drives the cell; show `revenue_in_period`/`arpa_in_period` in the tooltip/row). Wire `getBillingRetentionCohorts()` in the analytics page (RSC await, alongside the existing retention fetch; use `Promise.allSettled` like the page does).

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit`; commit the touched files: `git commit -m "feat(admin): billing-retention cohort view"`.

---

## Task 5: Account insights → per-entity billing rollup

**Files:** `types/admin/account-insights.ts`, `lib/actions/admin/account-insights.ts`, the account-detail view under `app/(admin)/admin/accounts/[id]/` (+ any insights component).

**Context:** The Reports `/accounts/{id}/insights` now exposes per-business `billingStatus`/`billingChurned` (best-of rollup) and per-item `billing_mrr`. Today `AccountInsightsResponse` has a single `subscription.{plan,status,mrr}` (old one-plan-per-business). The action also fans out to Billing directly via `aggregateBilling()`. Reconcile to ONE per-entity source: prefer the billing rollup for plan/status/MRR.

- [ ] **Step 1 — types.** Read `types/admin/account-insights.ts`; add the new fields the backend returns: on the per-business/kpis/subscription shape add `billingStatus: string | null` and `billingChurned: boolean` (match the backend's casing — the Reports account-insights endpoint returns `billingStatus`/`billingChurned` on the business node + `billing_mrr` per item per [[billing-reports-analytics-alignment]] P4a). Add per-item `billing_mrr` where items are typed. Guard optional (`?`) so an undeployed backend doesn't break the map.

- [ ] **Step 2 — action reconcile.** Read `lib/actions/admin/account-insights.ts` (`aggregateBilling()`). Make the displayed plan/status/MRR derive from the per-entity rollup: MRR = sum of item `billing_mrr` (or the existing `item.packageInfo.basePrice` sum it already does — prefer the backend `billing_mrr` when present), status = `billingStatus` (best-of), drop reliance on a single business-level `subscription.plan/status`. Keep it ONE source of truth (avoid Reports vs Billing drift).

- [ ] **Step 3 — view.** In the account-detail view, surface `billingStatus` (badge) + per-entity MRR; ensure the subscription/KPI panels read the reconciled values. Follow existing layout.

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` + `npm run lint`; commit touched files: `git commit -m "feat(admin): account insights per-entity billing rollup (billingStatus + summed MRR)"`.

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` (clean) + `npm run lint` (no new errors on touched files) + `npm run build` if time permits (authoritative).
- [ ] **Opus holistic** over the ① diff (`git diff` of the committed ① files vs the pre-① state): every UI field read now exists in its `*Response` type and is populated by the mapping (no silent `undefined→0`); `trial_count` fully removed; new fields guarded for an undeployed backend (`?? []`/`?? 0`); only intended files committed (user's unrelated WIP preserved); patterns/components reused (no redesign).
- [ ] **Report:** ① done; data-flow shape-verified + typechecked; the user validates live numbers in staging once the Reports backend deploys. Then proceed to sub-project ②.

## Self-review (author checklist)
- **Spec §4 coverage:** plan mix (T1) ✓; MRR-by-entity-type (T2) ✓; churn billing fields (T3) ✓; billing-retention view (T4) ✓; account-insights rollup (T5) ✓.
- **Vertical slices** keep `tsc` green per task (type+mapping+component together) — no half-applied type break.
- **Undeployed-backend safety:** new contract fields read defensively (`?? []`/`?? 0`/optional) so the dashboard doesn't crash before the backend deploys.
- **WIP preservation:** specific-file staging only; overlap (`dashboard/page.tsx`) touched only if needed and committed within the relevant task.
- **No redesign:** reuse existing components/patterns per the user's constraint (data + flow correctness first).

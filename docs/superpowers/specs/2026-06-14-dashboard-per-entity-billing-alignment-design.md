# Customer-Dashboard ↔ Per-Entity Billing Alignment — Design

**Date:** 2026-06-14
**Status:** Approved (design) — pending spec review → writing-plans

## 1. Goal

Make the Customer-Dashboard (Next.js 15 / App Router) correctly reflect the new **per-entity billing model** end to end — on both the internal **admin dashboard** and the **user-facing** billing/subscription/entitlement flows. Priority (per the user): **data is fetched correctly and visible, and the flows are correct (especially invoice generation)**. UI/UX is NOT being redesigned — reuse the existing components and patterns; the user will refine visuals later. No legacy support required (users haven't fully started).

## 2. Context

**Backend (now on each service's `alpha`, unpushed):** billing moved from one-subscription-per-business (single plan, business-level invoices) to **per-entity**: one `Subscription` per business + N `SubscriptionItem`s (one per LOCATION / WAREHOUSE / STORE), each with its own plan, status, trial, `paidThrough`. Item statuses: `ACTIVE / PAST_DUE / EXPIRED / SUSPENDED / CANCELLED` (**no `TRIAL`** — a trialing item is `ACTIVE` with a future `trialEndDate`). Invoices are **consolidated**: one per business with a line item per entity. Entitlement limits are **per-entity**. Invoice statuses: `DRAFT/PENDING/PAID/FAILED/CANCELLED/REFUNDED` (no `OVERDUE`). The Reports/analytics admin endpoints changed shape (per-entity-type MRR, plan-mix grouping, churn billing features, billing-retention cohort, account billing status) — see §4.

**Current dashboard state:** already substantially per-entity on the customer side (`components/billing/items-table.tsx` renders one row per item; `plan-change-dialog` filters packages by `entityType`; invoices render per line item; invoice statuses already correct). So this is **targeted alignment, not a rewrite**. Architecture: App Router; data via **Server Actions** (`lib/actions/**`, `"use server"`); two API channels — `ApiClient` (axios, JWT, `lib/settlo-api-client.ts`) and `reportsInternalClient` (fetch + `X-Internal-Secret`, `lib/reports-internal-client.ts`); shadcn/ui + Tailwind; **no test runner**.

## 3. Architecture / approach (cross-cutting)

For each touched endpoint: **align the TS types** to the new response shape → **fix the server-action mapping** → **surface new fields in the existing components** (reuse `MetricCard`, `BarList`, `SectionCard`, tables, tabs; no redesign) → **verify every field the UI reads exists in the response** (eliminate silent `undefined → 0`). Follow existing data-fetching (server actions), caching (`revalidateTag`/`cache-tags.ts`), and error-isolation (`Promise.allSettled`) patterns.

**Verification (no automated tests exist):** `npm run build` (Next.js production build = full TypeScript typecheck) + `npm run lint` in the repo (it has `node_modules`), plus a per-endpoint data-flow trace. Final correctness is confirmed by the user against live backends in staging. Each sub-project is its own plan → build → review cycle, executed in the order ① → ② → ③ → ④.

## 4. Sub-project ① — Admin dashboard / reports alignment

Consumes the updated Reports endpoints (`/api/v2/internal/metrics/...`, via `reportsInternalClient`).

- **Plan mix.** `types/admin/dashboard.ts` `DashboardOverviewResponse.planMix` + `PlanMixItem`: remove `trial_count` (backend dropped it → currently renders silent "0 trial"); add `entity_type: string` and `item_count: number`. `lib/actions/admin/dashboard-overview.ts` (≈ lines 380–401) + `PlanMixCard` in `admin-dashboard-view.tsx`: stop reading `trial_count`; show `entity_type` as a badge/label on each existing bar-list row; use `item_count`/`active_count` for the count display.
- **MRR by entity type.** Add `revenue.mrrByEntityType: { entity_type: string; mrr: number }[]` to `DashboardOverviewResponse.revenue` + the mapped `DashboardOverview`. Render a small `BarList` breakdown in the revenue section of `admin-dashboard-view.tsx` (reuse the existing card/list pattern).
- **Churn.** `types/admin/analytics.ts` `ChurnPrediction`: add `billing_status: string | null`, `past_due_item_count: number`, `expired_item_count: number`, `suspended_item_count: number`. `components/admin/analytics/churn-section.tsx`: surface them (a `billing_status` badge + the item counts) alongside the existing `subscription_status`/`is_past_due` columns.
- **Billing retention.** Add `getBillingRetentionCohorts(months)` to `lib/actions/admin/analytics.ts` → `GET /api/v2/internal/metrics/saas/retention/billing/cohorts`; add a `BillingRetentionCohortCell` type (cohort_month, months_since_signup, cohort_size, active_businesses, retention_rate, invoices_in_period, revenue_in_period, arpa_in_period); render a cohort view mirroring the existing order-based retention section (a parallel section/tab).
- **Account insights.** `types/admin/account-insights.ts`: align with the new backend fields — per-business `billingStatus`/`billingChurned` and per-item `billing_mrr`. Reconcile `aggregateBilling()` (`lib/actions/admin/account-insights.ts`) and the account-detail view so the displayed plan/status/MRR reflect the per-entity rollup (sum MRR across items; show the best-of `billingStatus`), rather than a single business-level plan/status.

## 5. Sub-project ② — User per-entity subscription correctness

- **Item status model.** `types/billing/types.ts` `SubscriptionItemStatus`: extend `"ACTIVE" | "REMOVED"` → `"ACTIVE" | "PAST_DUE" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "REMOVED"`. `components/billing/items-table.tsx`: render all non-`REMOVED` items (today it filters to `ACTIVE` only, hiding e.g. a PAST_DUE location) with a per-item status badge (reuse `components/billing/shared.ts` status maps, extended for item statuses).
- **Trial derivation.** Replace dead `status === "TRIAL"` checks with trial derived from a future `trialEndDate`:
  - `components/billing/overview-tab.tsx` (`isCancellable`), `context/entitlementContext.tsx` (`isTrial`/`isActive`), `components/subscription/SubscriptionBanner.tsx` (trial banner). A subscription/item is "in trial" iff it's `ACTIVE` and `trialEndDate` is in the future.
- **Invoices / payment context.** `components/billing/billing-client.tsx` currently uses `primaryItem = first ACTIVE item` as the single payment/invoice context (`locationId={primaryItem?.entityId}`). For consolidated multi-entity invoices, resolve the "Bill to" party from the invoice (its business + line-item entities) rather than always the first item; keep prepay working at the subscription level.
- **Cancellation.** Confirm whole-subscription cancel still works; add per-item cancel/remove where the backend supports it (item removal endpoint). Update `isCancellable` for the new status set.

## 6. Sub-project ③ — Plan-selection wiring + invoice-generation flow

- **Registration → planCode.** `components/forms/register_form.tsx` stashes `?package=` in `localStorage` but never sends it; `app/(auth)/subscription/page.tsx` `handleSelect` is a no-op. Wire the chosen `planCode` into `lib/actions/auth/business.tsx` `createBusinessWithLocations()` so it reaches `LOCATION_CREATED` (the backend now provisions the trial on the chosen plan). Make the subscription picker functional (or fold plan choice into the business-registration step).
- **Store creation.** `components/forms/store_form.tsx` + `store-upgrade-dialog.tsx` + `EntitySubscriptionSetup.tsx`: let store creation carry a chosen STORE `planCode` to `STORE_CREATED`; give `EntitySubscriptionSetup` a plan picker (today it grabs `packages[0]`). Keep the existing limit-409 → upgrade flow.
- **Invoice-generation flow (priority).** Trace + verify end to end: create entity → backend generates the consolidated activation invoice → it appears in the Invoices tab → view → pay (Selcom) → status polling → paid. Fix any break in `billing-actions.ts` / `payment-actions.ts` / `invoice-view-dialog.tsx` along that path.

## 7. Sub-project ④ — Entitlement per-entity enforcement

- `lib/feature-guard.ts` `assertFeature`/`assertLimit`/`checkLimit`: use the per-entity `entitlements.items[].limits`/`features` for the active entity, not the business-aggregated `entitlements.features`/`limits`. Thread the active `entityId` (from `currentLocation`/active entity cookie).
- Surface a per-entity / worst-case subscription status so a single `PAST_DUE`/`EXPIRED` location is reflected in `SubscriptionBanner` and the `middleware.ts` gating (today both read a single business-level `subscriptionStatus`). Keep enforcement server-authoritative (the backend remains the source of truth; this is UX surfacing).

## 8. Deferred

**Warehouse** billing UI (creation plan picker, warehouse subscription tab) — backend not fully implemented. `EntitySubscriptionSetup` already accepts `WAREHOUSE`; leave it unwired. Note in each plan where warehouse would slot in.

## 9. Risks / decisions

- **No automated tests** → correctness rests on `npm run build` (typecheck) + `lint` + review + the user's staging validation against live backends. Flag this in every plan.
- **Backend is unpushed/undeployed** — the dashboard changes can't be exercised against the new endpoints until the services deploy. Build/typecheck verifies shape-correctness; live behavior is a staging check.
- **`docs/` committed to the dashboard repo** (existing plan docs live there) — commit specs/plans normally; user pushes.
- **Shared type files** (`types/admin/*`, `types/billing/types.ts`) are touched across sub-projects → execute in order ①→②→③→④ so later plans build on committed type changes (avoid stale merges).
- **Account-insights** has a dual data path (Reports `/insights` + a direct Billing `aggregateBilling()` fan-out). Reconcile to ONE source of truth for plan/status/MRR to avoid drift — prefer the per-entity billing rollup.

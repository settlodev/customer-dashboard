# Admin Account → Business → Entity Hierarchy Rework — Design

**Date:** 2026-06-15
**Status:** Design (pending spec review → writing-plans)
**Repo:** Customer-Dashboard (admin, `app/(admin)/admin/`) + a small comms/accounts backend bit (send-email).

## 1. Goal

Rework the admin screens so they reflect the real per-entity account structure, where each **LOCATION / WAREHOUSE / STORE** — not the business — is the billable unit:

```
Account  (owner identity, summary, actions: resend verification, send email, suspend, login-as)
  └─ Business  (subscriptions SUMMARY across its entities + business summary + login-as)
       ├─ Location   (subscription DETAILS + orders + stock/products)
       ├─ Warehouse  (same)
       └─ Store      (same)
```

## 2. Context (current state — verified by exploration)

The account + business screens are **already substantially per-entity-aware** (from the unpushed ① work + prior work): the account detail has an account→business→location tree, a per-unit billing rollup ("each unit billed on its own plan"), a "Billable units" KPI, and account actions (suspend/reactivate/resend-verification/login-as/email-as-`mailto`); the business detail treats the business as the consolidation level (a "Billable units" card lists each entity with its own plan). **The real gaps:**
1. **No entity detail pages** — no `/locations/[id]`, `/warehouses/[id]`, `/stores/[id]` (the locations list doesn't even link to one). `getAdminLocationDetail(locationId)` action + `AdminLocationDetail` type EXIST but are unused.
2. **Per-entity data is partial:** per-entity subscription exists (`getBusinessSubscription` → `subscription.items[]`); per-location orders exist (`getBusinessLocationBreakdown` rows); per-entity **stock/products** and **all warehouse/store** orders/stock have **no admin endpoints**.
3. The business **billing page** frames the subscription at business level; navigation doesn't drill account→business→entity.

## 3. Decisions (confirmed)

- **Frontend-first / defer data gaps:** build the screens now using data that EXISTS; clearly mark/stub missing per-entity data (stock/products, warehouse/store orders) — "pending endpoint", no fake data. New backend per-entity data endpoints = a separate **deferred phase**.
- **Locations first:** location detail page this pass; warehouse/store detail = fast-follow (Phase 4) reusing the same scaffold.
- **Rework the account screen too:** (a) drill-down nav — tree includes warehouses+stores and deep-links every node to its detail page; (b) real send-email; (c) IA redesign.
- **Tabs** on the entity + account detail screens (replace single-scroll).
- **Send-email:** reuse an existing admin "send email to account" endpoint if present (comms/accounts service); else add a minimal one in the account-rework phase.
- **Build order = inside-out** (leaf pages first so drill-down targets exist): P1 location → P2 business → P3 account → P4 warehouse/store.

## 4. Navigation spine
`/accounts/[id]` → (tree / "view businesses") → `/businesses/[id]` → (billable-units list) → `/locations/[id]` | `/warehouses/[id]` | `/stores/[id]`. Breadcrumbs at each level (Accounts → {account} → Businesses → {business} → {entity}). Reuse `PageShell`/`PageBreadcrumbs`/`PageHeader`/`PageBody`.

## 5. Phase 1 — Location detail (NEW) + locations list + reusable `EntityDetailView`

- **`components/admin/entity-detail/entity-detail-view.tsx`** — reusable, tabbed scaffold (shadcn `components/ui/tabs`), parameterized by `entityType` (LOCATION now; WAREHOUSE/STORE in P4):
  - **Subscription tab:** the entity's `subscription.items[]` row (match by `entityId`): plan (`packageInfo`), status badge, trial dates, paid-through; per-entity actions — **Extend trial** (`extendEntityTrial`), **Upgrade plan** (`upgradeSubscriptionPlan` by `subscriptionItemId`), **Manage addons** (`addSubscriptionAddon`). (These move/extend here from the business billing page.)
  - **Orders tab:** per-location metrics from `getBusinessLocationBreakdown(businessId, range)` filtered to this `location_id` (orders, net sales, gross profit, AOV, active staff, unique customers). Range selector (Today/7d/30d) reusing the business-detail pattern.
  - **Stock & Products tab:** **deferred** — `SectionCard` `stub` placeholder ("Per-location stock & products — pending data endpoint"). No fake data.
- **Route `app/(admin)/admin/locations/[id]/page.tsx`:** server component → `getAdminLocationDetail(locationId)` (→ business + location profile) → `getBusinessSubscription(businessId)` (find item by `entityId == locationId`) + `getBusinessLocationBreakdown(businessId, range)` (find row by `location_id`) → `EntityDetailView`. Header: location name, region, **parent business link**, per-location subscription status badge, breadcrumb.
- **Locations list (`app/(admin)/admin/locations/page.tsx` + `columns.tsx`):** fix the stale "subscription status shown at the business level" subtitle; link each row to `/admin/locations/{locationId}`; keep the per-location status/plan/trial columns.

## 6. Phase 2 — Business detail reframe + drill-down

- Reframe `business-detail-view.tsx` so the billing presence is a **subscriptions summary across entities** (unit count, summed MRR, plan mix, best-of billing status) — not a single business plan. (Largely present; tighten the framing/labels.)
- **Billable units** card: each location/warehouse/store row **links to its entity detail page** (`/locations/[id]` etc.).
- Keep the business-scoped analytics (revenue/orders/inventory/financials/health/segments). Consolidated **invoices** stay at the business billing page; per-entity subscription *actions* now live on the entity pages (the business billing page can keep a read-only per-item summary + the cross-entity invoice/discount tools).
- Business list: optional — surface unit count / billing status column (nice-to-have; keep minimal).

## 7. Phase 3 — Account detail rework (IA + drill-down + send-email)

- **IA → tabs** on `account-detail-view.tsx`: **Overview** (owner identity, summary KPIs, attention banner, sales/support staff, health) · **Structure** (the account→business→entity tree as the primary spine) · **Billing** (the billing rollup + per-unit breakdown) · **Activity** (timeline + profile/timestamps). Header + action bar persist above the tabs.
- **Tree (`businesses-locations-card.tsx`):** include **warehouses + stores** under each business (not just locations); every node deep-links to its detail page; show per-entity plan/status. Data: extend `getAccountInsights` (Reports `/accounts/{id}/insights`) to include warehouses/stores per business, OR join from `getBusinessSubscription` items per business — confirm which is cheaper (the Reports insights endpoint may need a warehouses/stores addition; if so that's a small Reports change, else join client-side from the per-business subscription items already fetched in `aggregateBilling`).
- **Real send-email:** replace the `mailto:` in `AccountDetailActions` with a compose dialog (subject/body) → a new `sendAccountEmail(accountId, subject, body)` action → **reuse an existing comms/accounts admin send-email endpoint if present; else add a minimal one** (comms service). Gate to appropriate staff roles.
- Keep the existing account actions (suspend/reactivate/resend-verification/internal/delete/login-as).

## 8. Phase 4 (fast-follow) — Warehouse + Store detail pages
- `app/(admin)/admin/warehouses/[id]/page.tsx` + `stores/[id]/page.tsx` reusing `EntityDetailView` (`entityType` WAREHOUSE/STORE). Subscription tab works (per-entity items exist); Orders + Stock/Products tabs = deferred stubs (no warehouse/store per-entity data endpoints yet). Wire the account/business drill-down links to them.

## 9. Deferred backend phase — per-entity data endpoints
Add admin endpoints for orders/stock/products scoped to a single location/warehouse/store (across inventory/order/Reports). The entity pages are built to slot these in (replace the stubs). Separate workstream; multi-service.

## 10. Data availability (surface now vs defer)
| Data | Status | Source |
|------|--------|--------|
| Per-entity subscription (plan/status/trial/paidThrough) | **Now** | `getBusinessSubscription` → `items[].entityId` |
| Per-entity actions (extend/upgrade/addon) | **Now** | existing support-billing actions |
| Per-location orders | **Now** | `getBusinessLocationBreakdown` (filter to location) |
| Location profile | **Now** | `getAdminLocationDetail` (exists, currently unused) |
| Per-location stock/products | **Defer** | needs new admin endpoint |
| Warehouse/store orders/stock/products | **Defer** | needs new admin endpoints |
| Account send-email | **Now (reuse/add)** | comms/accounts admin endpoint |

## 11. Verification
- Dashboard: `npx tsc --noEmit` (real compiler) + `npm run lint` on touched files; no test runner → review + staging. Build on `alpha`, **stage only touched files** (the user's other WIP — packages page, comparison-chart, invoice-view-dialog — stays untouched).
- Backend send-email (if added): the relevant service builds/tests where buildable.
- Staging-validate the full account→business→entity drill-down + per-entity subscription actions + send-email once deployed.

## 12. Out of scope
- Per-entity data endpoints (deferred phase).
- Per-entity impersonation (login-as stays account-level).
- Pixel-level visual polish (user refines later; this is IA/structure + data correctness).

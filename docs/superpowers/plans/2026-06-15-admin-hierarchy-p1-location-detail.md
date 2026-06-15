# Admin Hierarchy Rework — Phase 1: Location detail + reusable EntityDetailView + locations list — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox (`- [ ]`) steps.

**Goal:** Add a new admin **location detail page** (`/locations/[id]`) built on a reusable tabbed `EntityDetailView` (Subscription / Orders / Stock & Products) that warehouses/stores will reuse later; and make the locations list link to it. Surface data that exists (per-entity subscription + per-location orders); stub the rest.

**Architecture:** Next.js App Router admin (`app/(admin)/admin/`). Server-component route fetches → passes to a `"use client"` `EntityDetailView`. Reuse existing actions/components/dialogs. Verify `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-15-admin-account-business-entity-hierarchy-design.md` (Phase 1).

---

## Execution Notes
- Branch: work on `alpha`. **Stage ONLY each task's files** (never `-A`) — the user's WIP (`app/(admin)/admin/packages/[id]/page.tsx`, `components/admin/catalog/package-detail/comparison-chart.tsx`, `components/billing/invoice-view-dialog.tsx`) stays untouched.
- **Verify:** `npx tsc --noEmit` (clean baseline, keep clean) + `npm run lint` on touched files. No test runner. cd into the repo; nushell; cwd resets per command. Don't run `npm run dev`.
- **Follow existing patterns — no pixel redesign.** Reuse `PageShell`/`PageBreadcrumbs`/`PageHeader`/`PageBody` (`@/components/layouts/page-shell`), `AdminShell` (`@/components/layouts/admin-shell`), `SectionCard`/`MetricCell`/`MetricGrid`/`DefList`/`DefRow`/`Monogram`/`PlanBadge` (`@/components/admin/shared/*`), `Tabs/TabsList/TabsTrigger/TabsContent` (`@/components/ui/tabs`), `SubscriptionStatusBadge` (used in `components/admin/locations/columns.tsx`).
- **Links use bare paths** (middleware rewrites to `/admin/...`): the existing locations columns link to `/businesses/{id}`, so the location link is `/locations/{id}`.
- **Auth pattern (every admin page):** `const token = await getStaffAuthToken(); if (!token?.accessToken) redirect("/login");` then `READ_ROLES = ["SYSTEM_ADMIN","SUPER_ADMIN","SUPPORT_AGENT"]`, `canRead = role && READ_ROLES.includes(role)`, `canBilling = role === "SYSTEM_ADMIN" || role === "SUPPORT_AGENT"`.

---

## Task 1: Reusable `EntityDetailView` (tabbed)

**File:** create `components/admin/entity-detail/entity-detail-view.tsx` (`"use client"`).

**Props:**
```ts
import type { SubscriptionItemResponse } from "@/types/admin/billing";
import type { BusinessLocationBreakdownRow } from "@/types/admin/business-intel";

export interface EntityDetailViewProps {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  entityId: string;
  entityName: string;
  region: string | null;
  businessId: string;
  businessName: string | null;
  subscriptionId: string | null;          // subscription.id (business-level), for per-item actions
  item: SubscriptionItemResponse | null;   // the entity's subscription item (matched by entityId)
  ordersRow: BusinessLocationBreakdownRow | null;  // per-location orders (null for warehouse/store now)
  rangeLabel: string;
  canBilling: boolean;
}
```

- [ ] **Step 1 — scaffold the tabs.** `Tabs defaultValue="subscription"` with three `TabsTrigger`s: Subscription, Orders, "Stock & Products". Each `TabsContent` holds the section(s) below. Wrap content in `SectionCard`s.

- [ ] **Step 2 — Subscription tab.**
  - If `item == null`: a `SectionCard` empty state ("No subscription for this {entityType.toLowerCase()}.").
  - Else: a `DefList`/`MetricGrid` showing `item.packageInfo?.name` (plan) with a `PlanBadge`, status (`SubscriptionStatusBadge` or a status pill), `item.trialEndDate`, `item.paidThrough`, `item.addedAt`. Trial hint when `item.status === "ACTIVE" && item.trialEndDate && new Date(item.trialEndDate) > new Date()`.
  - **Actions** (only when `canBilling && subscriptionId`): reuse the billing-view patterns —
    - **Extend trial** inline button, shown only when `item.paidThrough == null && item.status !== "CANCELLED"`: `handleExtendTrial` → `confirm(...)` → `startTransition(async () => { const res = await extendEntityTrial(businessId, subscriptionId, item.id); ... toast new trial end ... router.refresh() })`. Mirror `billing-view.tsx`'s `handleExtendTrial` (lib `extendEntityTrial(businessId, subscriptionId, itemId)` returns `FormResponse<SubscriptionResponse>`).
    - **Upgrade plan** button → opens `UpgradePlanDialog` (`@/components/admin/billing/upgrade-plan-dialog`) with `businessId`, `items={item ? [item] : []}`, `open/onOpenChange` state, `onUpgraded={() => router.refresh()}`.
    - **Manage addons** button → opens `AddAddonDialog` (`@/components/admin/billing/add-addon-dialog`) with `businessId`, `items={item ? [item] : []}`, `onAdded={() => router.refresh()}`.
  - Import `extendEntityTrial` from `@/lib/actions/admin/billing`, `useToast`, `useRouter`, `useState`, `useTransition`.

- [ ] **Step 3 — Orders tab.**
  - If `ordersRow == null`: `SectionCard` empty/stub ("No order data for this {entityType.toLowerCase()} in {rangeLabel}." for LOCATION; for WAREHOUSE/STORE use the deferred-stub text).
  - Else: `MetricGrid` of `ordersRow` fields — Total orders (`total_orders`), Completed (`completed_orders`), Net sales (`net_sales`), Gross profit (`gross_profit`), Avg order value (`avg_order_value`), Active staff (`active_staff`), Unique customers (`unique_customers`). Use `compactNumber`/currency formatting from `@/components/admin/shared/format`. Subtitle = `rangeLabel`.

- [ ] **Step 4 — Stock & Products tab.** A `SectionCard` with `stub` prop and copy: "Per-{entityType.toLowerCase()} stock & products — pending a dedicated data endpoint." No fake data.

- [ ] **Step 5 — verify + commit.** `npx tsc --noEmit` clean. `git add components/admin/entity-detail/entity-detail-view.tsx` and `git commit -m "feat(admin): reusable tabbed EntityDetailView (subscription/orders/stock)"`.

---

## Task 2: Location detail route `/admin/locations/[id]`

**File:** create `app/(admin)/admin/locations/[id]/page.tsx` (server component).

- [ ] **Step 1 — implement** (mirror `app/(admin)/admin/businesses/[id]/page.tsx`'s auth + fetch shape):
  - Auth + role gate (see Execution Notes). If `!canRead`, render the no-permission `PageShell` (mirror business page).
  - `const location = await getAdminLocationDetail(id);` (`@/lib/actions/admin/businesses`) — throws on 404 → let it 404/error like the business page (or wrap and `notFound()`).
  - `const businessId = location.businessId;`
  - `const { startDate, endDate } = await getDefaultIntelRange(30);` (`@/lib/actions/admin/business-intel`).
  - `const results = await Promise.allSettled([ canBilling ? getBusinessSubscription(businessId) : Promise.resolve(null), getBusinessLocationBreakdown(businessId, startDate, endDate) ]);` with the `value()` helper.
  - `const subscription = value(results[0]);` `const breakdown = value(results[1]) ?? [];`
  - `const item = subscription?.items.find(i => i.entityId === id) ?? null;`
  - `const ordersRow = breakdown.find(r => r.location_id === id) ?? null;`
  - `const rangeLabel = \`${shortDay(startDate)} → ${shortDay(endDate)}\`;` (copy the `shortDay` helper from the business page).
  - Render:
    ```tsx
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs items={[
          { title: "Locations", href: "/locations" },
          { title: location.businessName ?? "Business", href: `/businesses/${businessId}` },
          { title: location.name },
        ]} />
        <PageHeader
          title={location.name}
          subtitle={[location.region, location.businessName].filter(Boolean).join(" · ")}
          titleAccessory={ /* per-entity SubscriptionStatusBadge from item?.status, if present */ }
        />
        <PageBody>
          <EntityDetailView
            entityType="LOCATION"
            entityId={id}
            entityName={location.name}
            region={location.region}
            businessId={businessId}
            businessName={location.businessName}
            subscriptionId={subscription?.id ?? null}
            item={item}
            ordersRow={ordersRow}
            rangeLabel={rangeLabel}
            canBilling={canBilling}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
    ```
  - `params` is a Promise in Next 15 — `const { id } = await params;` (match the business page's param handling).

- [ ] **Step 2 — verify + commit.** `npx tsc --noEmit` clean. `git add "app/(admin)/admin/locations/[id]/page.tsx"` and `git commit -m "feat(admin): location detail page (/locations/[id])"`.

---

## Task 3: Locations list — link rows + fix subtitle

**Files:** `app/(admin)/admin/locations/page.tsx`, `components/admin/locations/columns.tsx`.

- [ ] **Step 1 — link the location-name cell.** In `columns.tsx`, wrap the `locationName` cell content in `<Link href={\`/locations/${l.locationId}\`}>` (reuse `next/link`; keep the `Monogram` + name + region markup). Keep the Business cell's existing `/businesses/{businessId}` link.
- [ ] **Step 2 — fix the stale subtitle.** In `page.tsx`, change the subtitle from `"… · subscription status shown at the business level"` to per-entity wording, e.g. `\`${total} active location${s} · each location has its own subscription\``.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean. `git add app/(admin)/admin/locations/page.tsx components/admin/locations/columns.tsx` and `git commit -m "feat(admin): link locations list to location detail + per-entity subtitle"`.

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` (touched files).
- [ ] **Opus holistic** over the Phase-1 diff: `EntityDetailView` reuses the existing dialogs correctly (passing `items={[item]}`, `businessId`, refresh callbacks); the Extend-trial gate matches the backend (`paidThrough == null && status !== "CANCELLED"`); the route's auth/role gate + `Promise.allSettled` + `params await` match the business page; subscription item matched by `entityId`, orders row by `location_id`; deferred Stock&Products + (warehouse/store-only) empty states are clear stubs (no fake data); locations list links to `/locations/[id]`; only intended files committed (WIP preserved); `canBilling` correctly hides actions for non-billing roles.
- [ ] **Report:** Phase 1 done (location detail live, list links to it); the reusable `EntityDetailView` is ready for Phase 4 (warehouse/store); Stock&Products + warehouse/store order data are stubbed pending the deferred backend phase. Proceed to Phase 2 (business reframe + drill-down) on the user's go.

## Self-review (author checklist)
- **Spec Phase-1 coverage:** EntityDetailView scaffold (T1) ✓; location detail route (T2) ✓; locations list link + subtitle (T3) ✓.
- **Reuse, no new endpoints:** uses `getAdminLocationDetail`, `getBusinessSubscription`, `getBusinessLocationBreakdown`, `extendEntityTrial`, `UpgradePlanDialog`, `AddAddonDialog` — all existing.
- **Data principle:** per-entity subscription + per-location orders surfaced; stock/products stubbed.
- **Reusability:** `EntityDetailView` is `entityType`-parameterized so Phase 4 (warehouse/store) reuses it; orders/stock tabs already handle the null/stub case for non-location entities.
- **WIP preservation:** specific-file staging; the 3 WIP files are disjoint from Phase-1 files.

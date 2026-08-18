# Admin Hierarchy Rework — Phase 3A: Account tabs IA + entity tree (frontend) — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Rework the admin **account detail** screen into a tabbed IA (**Overview / Structure / Billing / Activity**) and turn the account→business→location card into a full account→business→**entity** tree that includes **warehouses + stores** (each node showing its plan + per-item status), with **location** nodes deep-linking to `/locations/[id]`. Frontend-only; reuses existing actions + the Phase-2 shared `SubscriptionItemStatusBadge`.

**Architecture:** Customer-Dashboard admin (`app/(admin)/admin/accounts/[id]/`). A new server action joins the accounts entity-lists + the billing subscription into an authoritative per-business entity tree; the account view is reorganized into shadcn `Tabs`. Verify with `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-15-admin-account-business-entity-hierarchy-design.md` (Phase 3, §7). **NOTE:** the **real send-email** (replacing the header `mailto:`) is Phase **3B** (separate plan — multi-repo Kafka feature). 3A leaves the `mailto:` button untouched.

---

## Execution Notes
- Branch `alpha`. **Stage ONLY each task's files** (never `-A`). Untouched user WIP: `app/(admin)/admin/packages/[id]/page.tsx`, `components/admin/catalog/package-detail/comparison-chart.tsx`, `components/billing/invoice-view-dialog.tsx`.
- **Verify:** `npx tsc --noEmit` (clean baseline; keep clean) + `npm run lint` on touched files. No test runner. nushell resets cwd per command → prefix with `cd "/Users/Peter/Settlo/Customer-Dashboard" &&`. Don't run `npm run dev`.
- **Follow existing patterns.** Reuse `SectionCard`, `PlanBadge`/`planTier`, `Monogram`, `DefList`/`DefRow`, `KpiStrip`, the Phase-2 shared `SubscriptionItemStatusBadge` (`@/components/admin/shared/subscription-item-status-badge`), and the `Tabs` idiom from `components/admin/entity-detail/entity-detail-view.tsx`.
- **Drill-down policy (consistent with Phase 2):** **LOCATION** nodes link to `/locations/[id]`; **warehouse/store** nodes are visible but **non-clickable** (their routes land in Phase 4, which wires their links). Linking them now would 404.
- **Data reality:** `getAccountInsights` is stub-fallback when Reports isn't live (`isLive:false`); the new structure action degrades to empty per-business lists on fetch failure (`.catch`). The business spine (id/name/status) keeps coming from insights; entity children come from the new authoritative action.

---

## Task 1: Account structure action + types

**Files:**
- Create: `types/admin/account-structure.ts`
- Create: `lib/actions/admin/account-structure.ts`

- [ ] **Step 1 — types.** Create `types/admin/account-structure.ts`:

```ts
import type { PlanTier } from "@/components/admin/shared/plan-badge";
import type { SubscriptionItemStatus } from "@/types/admin/billing";

export type AccountEntityType = "LOCATION" | "WAREHOUSE" | "STORE";

export interface AccountEntityNode {
  id: string;
  entityType: AccountEntityType;
  name: string;
  meta: string; // identifier / code · region, etc.
  planLabel: string | null;
  planTier: PlanTier | null;
  status: SubscriptionItemStatus | null;
  trialEndDate: string | null;
  href: string | null; // /locations/[id] for LOCATION; null for WAREHOUSE/STORE (Phase 4)
}

export interface AccountStructureBusiness {
  businessId: string;
  locations: AccountEntityNode[];
  warehouses: AccountEntityNode[];
  stores: AccountEntityNode[];
}

/** Keyed by businessId for O(1) merge into the insights business spine. */
export type AccountStructure = Record<string, AccountStructureBusiness>;
```

- [ ] **Step 2 — action.** Create `lib/actions/admin/account-structure.ts`:

```ts
"use server";

import {
  listAdminBusinessLocations,
  listAdminBusinessWarehouses,
  listAdminBusinessStores,
} from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import { planTier } from "@/components/admin/shared/plan-badge";
import type { SubscriptionItemResponse } from "@/types/admin/billing";
import type {
  AccountEntityNode,
  AccountEntityType,
  AccountStructure,
  AccountStructureBusiness,
} from "@/types/admin/account-structure";

function nodeFrom(
  entityType: AccountEntityType,
  raw: { id: string; name: string; identifier: string; code?: string | null; region?: string | null },
  item: SubscriptionItemResponse | null,
): AccountEntityNode {
  const planLabel = item?.packageInfo?.name ?? null;
  return {
    id: raw.id,
    entityType,
    name: raw.name,
    meta: [raw.code ?? raw.identifier, raw.region ?? null].filter(Boolean).join(" · "),
    planLabel,
    planTier: planLabel ? planTier(planLabel) : null,
    status: item?.status ?? null,
    trialEndDate: item?.trialEndDate ?? null,
    href: entityType === "LOCATION" ? `/locations/${raw.id}` : null,
  };
}

/**
 * Authoritative per-business entity tree: joins the accounts entity-lists
 * (names) with the billing subscription (plan/status by entityId). Each fetch
 * is resilient (failure → empty), so a partial outage doesn't blank the tree.
 * NOTE: re-fetches getBusinessSubscription per business (getAccountInsights
 * also fetches it for the rollup) — acceptable; consolidate later if needed.
 */
export async function getAccountStructure(
  businesses: { id: string }[],
): Promise<AccountStructure> {
  const entries = await Promise.all(
    businesses.map(async ({ id: businessId }) => {
      const [locs, whs, sts, sub] = await Promise.all([
        listAdminBusinessLocations(businessId).catch(() => []),
        listAdminBusinessWarehouses(businessId).catch(() => []),
        listAdminBusinessStores(businessId).catch(() => []),
        getBusinessSubscription(businessId).catch(() => null),
      ]);
      const byEntity = new Map<string, SubscriptionItemResponse>();
      for (const it of sub?.items ?? []) {
        if (it.status !== "REMOVED") byEntity.set(it.entityId, it);
      }
      const business: AccountStructureBusiness = {
        businessId,
        locations: locs.map((l) =>
          nodeFrom("LOCATION", { id: l.id, name: l.name, identifier: l.identifier, region: l.region }, byEntity.get(l.id) ?? null),
        ),
        warehouses: whs.map((w) =>
          nodeFrom("WAREHOUSE", { id: w.id, name: w.name, identifier: w.identifier, code: w.code }, byEntity.get(w.id) ?? null),
        ),
        stores: sts.map((s) =>
          nodeFrom("STORE", { id: s.id, name: s.name, identifier: s.identifier, code: s.code }, byEntity.get(s.id) ?? null),
        ),
      };
      return [businessId, business] as const;
    }),
  );
  return Object.fromEntries(entries);
}
```

> Verify the field names against `types/admin/business.ts`: `AdminLocationListItem` has `id,name,identifier,region`; `AdminWarehouseListItem` has `id,name,identifier,code`; `AdminStoreListItem` has `id,name,identifier,code`. Adjust `nodeFrom` calls if any field differs. `getBusinessSubscription` returns `SubscriptionResponse` with `items: SubscriptionItemResponse[]` (`entityId,status,trialEndDate,packageInfo.name`).

- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean.
  ```bash
  git add types/admin/account-structure.ts lib/actions/admin/account-structure.ts
  git commit -m "feat(admin): account structure action (per-business entity tree: loc/wh/store + plan/status)"
  ```

---

## Task 2: Rework the tree card to render the full entity tree

**File:** Modify `components/admin/account-detail/businesses-locations-card.tsx`.

**Context:** Today it renders business → locations only (from `AccountInsights["businesses"]`), no links. Rework it to render business → **locations / warehouses / stores** sublists, taking the new `AccountStructure` for entity children while keeping the insights business spine (name/status). Each entity node shows plan + per-item status; **location** rows link to `/locations/[id]`.

- [ ] **Step 1 — new props + imports.** Change the component signature to accept both the insights businesses (spine) and the structure (children):

```tsx
import Link from "next/link";
import { Boxes, ChevronRight, MapPin, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { Monogram } from "@/components/admin/shared/monogram";
import { PlanBadge } from "@/components/admin/shared/plan-badge";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import type { AccountBusinessNode, AccountInsights } from "@/types/admin/account-insights";
import type { AccountEntityNode, AccountStructure } from "@/types/admin/account-structure";

const STATUS_TONE: Record<AccountBusinessNode["statusTone"], string> = {
  pos: "bg-pos-tint text-pos",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
};

export function BusinessesLocationsCard({
  businesses,
  structure,
  href = "/businesses",
  stub,
}: {
  businesses: AccountInsights["businesses"];
  structure: AccountStructure;
  href?: string;
  stub?: boolean;
}) {
  // ... (subtitle + render below)
}
```

- [ ] **Step 2 — entity-row renderer.** Inside the component, add a helper that renders one entity node (mirrors the Phase-2 billable-units row: icon by type, name + meta, plan badge or "no plan", status badge, chevron + Link for `href`):

```tsx
  function EntityRow({ node }: { node: AccountEntityNode }) {
    const Icon = node.entityType === "WAREHOUSE" ? Boxes : node.entityType === "STORE" ? Store : MapPin;
    const inner = (
      <>
        <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-primary/12 text-[#C25E26]">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium text-ink">{node.name}</div>
          <div className="truncate font-mono text-[11px] text-muted-foreground">
            {[node.entityType.charAt(0) + node.entityType.slice(1).toLowerCase(), node.meta].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {node.planLabel && node.planTier ? (
            <PlanBadge tier={node.planTier} label={node.planLabel} />
          ) : (
            <span className="font-mono text-[10.5px] text-muted-2">no plan</span>
          )}
          <SubscriptionItemStatusBadge status={node.status} small />
          {node.href && <ChevronRight className="h-4 w-4 text-muted-2" />}
        </div>
      </>
    );
    return node.href ? (
      <Link
        href={node.href}
        className="flex items-center gap-3 border-t border-line py-3 pl-5 pr-4 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
      >
        {inner}
      </Link>
    ) : (
      <div className="flex items-center gap-3 border-t border-line py-3 pl-5 pr-4">{inner}</div>
    );
  }
```

- [ ] **Step 3 — render the tree.** Replace the body so each business renders its spine header (unchanged) then its locations, warehouses, and stores from `structure[biz.id]` (fallback to empty). Keep the existing `SectionCard` wrapper + subtitle. Concretely, replace the `biz.locations.map(...)` block with:

```tsx
            {(() => {
              const s = structure[biz.id];
              const nodes = s ? [...s.locations, ...s.warehouses, ...s.stores] : [];
              return nodes.length === 0 ? (
                <div className="border-t border-line py-3 pl-5 pr-4 text-[12.5px] text-muted-2">
                  No billable units.
                </div>
              ) : (
                nodes.map((node) => <EntityRow key={node.id} node={node} />)
              );
            })()}
```

  Keep the business header exactly as-is. Update the card subtitle to reflect units (optional): keep the existing `businesses.count` business count; the per-business location count line in the header can stay.

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean.
  ```bash
  git add components/admin/account-detail/businesses-locations-card.tsx
  git commit -m "feat(admin): account tree shows locations + warehouses + stores with plan/status; locations drill in"
  ```

---

## Task 3: Tabs IA on the account view + page wiring

**Files:** Modify `components/admin/account-detail/account-detail-view.tsx` and `app/(admin)/admin/accounts/[id]/page.tsx`.

**Context:** Reorganize the linear account view into 4 tabs; the header + action bar (incl. the existing `mailto:` Email button — untouched in 3A) stay ABOVE the tabs. Fetch the structure at the page and pass it through.

- [ ] **Step 1 — page: fetch structure + pass it.** In `app/(admin)/admin/accounts/[id]/page.tsx`, after `getAccountInsights(id)` resolves, fetch the structure from the insights business spine and pass it to `AccountDetailView`:
  - Import: `import { getAccountStructure } from "@/lib/actions/admin/account-structure";`
  - After insights: `const structure = await getAccountStructure(insights.businesses.items.map((b) => ({ id: b.id })));`
  - Add `structure={structure}` to the `<AccountDetailView ... />` props.
  (Read the page first to match its exact fetch/await shape; insights is already fetched there.)

- [ ] **Step 2 — view: accept `structure` + wrap in Tabs.** In `components/admin/account-detail/account-detail-view.tsx`:
  - Add `structure: AccountStructure;` to `AccountDetailViewProps` (import the type) and destructure it.
  - Add the tabs imports: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";`
  - Keep the **Header** block (lines ~78–130) exactly as-is (incl. the `mailto:` Email button — 3B replaces it).
  - After the header, replace the rest (attention banner + ownership row + KPI strip + the two-column grid) with a `Tabs` block following the `EntityDetailView` idiom (`<Tabs defaultValue="overview">` → `<TabsList>` with 4 `TabsTrigger`s → 4 `TabsContent`). Distribute the EXISTING JSX blocks (do not rewrite their internals) into:
    - **Overview** (`value="overview"`): attention banner → KPI strip → ownership row (the `md:grid-cols-3` of sales/support/lifecycle) → a 2-col grid (`lg:grid-cols-2`) of **Engagement & health** + **Support & success**.
    - **Structure** (`value="structure"`): `<BusinessesLocationsCard businesses={insights.businesses} structure={structure} stub={stub} />` (now passes `structure`).
    - **Billing** (`value="billing"`): `<BillingRollupCard billing={insights.billing} stub={stub} />`.
    - **Activity** (`value="activity"`): the **Activity** timeline `SectionCard` → **Profile & geography** `SectionCard` → **Timestamps** `SectionCard`.
  - Each `<TabsContent value="..." className="space-y-4">`. The helper components at the bottom of the file (`BillingRollupCard`, `KCell`, `Field`, badges, etc.) stay defined and reused — do not delete them.

- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean; `npm run lint` on the two files.
  ```bash
  git add components/admin/account-detail/account-detail-view.tsx "app/(admin)/admin/accounts/[id]/page.tsx"
  git commit -m "feat(admin): account detail tabs IA (Overview/Structure/Billing/Activity) + wire entity tree"
  ```

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` (touched files).
- [ ] **Opus holistic** over the 3A diff. Checkpoints: the structure action joins names (accounts lists) + plan/status (billing subscription, non-REMOVED) by `entityId`, resilient per-fetch; the tree renders loc/wh/store with plan+status badges (reusing the Phase-2 shared badge), location rows link to `/locations/[id]` and wh/store rows are intentionally non-clickable (P4); tabs distribute the existing sections per §7 (Overview/Structure/Billing/Activity) with header + action bar persisting above; the `mailto:` is untouched (3B handles send-email); existing helper components intact; `stub`/`isLive` fallback still works; only intended files committed (WIP preserved); no double-rendering or dropped sections.
- [ ] **Report:** Phase 3A done (account tabs IA + full entity tree with drill-down). Note: warehouse/store nodes are non-clickable until Phase 4; the structure action re-fetches subscriptions per business (acceptable, optimize later). Send-email (3B) is the next step — multi-repo Kafka feature, plan ready.

## Self-review (author checklist)
- **Spec §7 coverage:** tabs IA (T3) ✓; tree incl warehouses+stores + deep-links (T1+T2) ✓; send-email = **deferred to 3B** (documented) ✓.
- **Reuse:** existing `listAdminBusiness*` + `getBusinessSubscription` + `planTier` + Phase-2 `SubscriptionItemStatusBadge`; no new endpoints.
- **Type consistency:** `AccountEntityNode.status: SubscriptionItemStatus|null`; `planTier: PlanTier|null`; `AccountStructure` keyed by businessId.
- **WIP preservation:** specific-file staging; the 3 WIP files are disjoint.

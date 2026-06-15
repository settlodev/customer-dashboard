# Admin Hierarchy Rework — Phase 2: Business detail reframe + drill-down — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Reframe the admin **business detail** so its billing presence reads as a *subscriptions summary across the business's entities* (active-subscription count, summed MRR, plan mix, per-item **status rollup**) instead of a single business-level plan; and make the **Billable units** card's location rows **drill down** to `/locations/[id]` (the Phase 1 detail page). Each row now shows its real per-item plan, MRR, and subscription status.

**Architecture:** Pure Customer-Dashboard frontend (`app/(admin)/admin/**`, admin subdomain, bare-path links). All changes are in `components/admin/business-detail/business-detail-view.tsx` plus one small shared extraction. No new endpoints — data already arrives via `getBusinessSubscription` (`subscription.items[]`) which the route already fetches. Verify with `npx tsc --noEmit`.

**Spec:** `docs/superpowers/specs/2026-06-15-admin-account-business-entity-hierarchy-design.md` (Phase 2, §6).

---

## Execution Notes
- Branch: work on `alpha`. **Stage ONLY each task's files** (never `-A`). The user's WIP must stay untouched: `app/(admin)/admin/packages/[id]/page.tsx`, `components/admin/catalog/package-detail/comparison-chart.tsx`, `components/billing/invoice-view-dialog.tsx`.
- **Verify:** `npx tsc --noEmit` (clean baseline — keep clean). No test runner. `cd` into the repo; nushell resets cwd per command. Don't run `npm run dev`.
- **Follow existing patterns — no pixel redesign.** Reuse `PlanBadge`/`planTier`, `DefList`/`DefRow`, `SectionCard`/`CardLink`, the existing inline `amt()` (`compactNumber`) helper, and `next/link` (already imported in the file).
- **Scope decisions (deliberate, spec-aligned):**
  1. **Drill-down links are LOCATION-only this phase.** Warehouse/store rows render identically but are NOT clickable yet — their detail routes land in Phase 4, which (per spec §8) wires their drill-down links. Linking them now would 404.
  2. **The business billing page keeps its per-item actions for now.** Spec §6 floats moving per-entity actions off the billing page, but warehouse/store entities have no detail page yet (P4), so stripping the billing page's per-item Extend-trial would orphan them. That cleanup is deferred to P4. **No change to `billing-view.tsx` in this phase.**
  3. **Business-list billing column is deferred** (see "Deferred" section) — the list payload carries no per-business subscription data; adding it would force an N+1 fetch or a new backend aggregate.

---

## Task 1: Extract a shared `SubscriptionItemStatusBadge`

**Why:** Phase 1's `EntityDetailView` has an inline per-item status badge (the holistic flagged the inline re-impl as a nit). Task 2 needs the same badge in the Billable-units rows. Two call sites → extract one shared component now (DRY, clears the P1 nit). Pure refactor, no behavior change.

**Files:**
- Create: `components/admin/shared/subscription-item-status-badge.tsx`
- Modify: `components/admin/entity-detail/entity-detail-view.tsx` (remove its inline copy, import the shared one)

- [ ] **Step 1 — create the shared component.** Write `components/admin/shared/subscription-item-status-badge.tsx` (this is the inline impl lifted verbatim from `entity-detail-view.tsx` lines 24–70, plus an optional `small` size used by the Billable-units rows):

```tsx
import { cn } from "@/lib/utils";
import type { SubscriptionItemStatus } from "@/types/admin/billing";

type StatusTone = "pos" | "blue" | "warn" | "neg" | "muted";

const STATUS_TONE: Record<StatusTone, string> = {
  pos: "bg-pos-tint text-pos",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
};

const ITEM_STATUS_META: Record<
  SubscriptionItemStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Active", tone: "pos" },
  PAST_DUE: { label: "Past due", tone: "warn" },
  EXPIRED: { label: "Expired", tone: "neg" },
  SUSPENDED: { label: "Suspended", tone: "neg" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  REMOVED: { label: "Removed", tone: "muted" },
};

export function SubscriptionItemStatusBadge({
  status,
  small,
}: {
  status: SubscriptionItemStatus | null;
  small?: boolean;
}) {
  const meta = status
    ? (ITEM_STATUS_META[status] ?? { label: status, tone: "muted" as StatusTone })
    : { label: "No subscription", tone: "muted" as StatusTone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold",
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12.5px]",
        STATUS_TONE[meta.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
```

> If `SubscriptionItemStatus` is not exported from `@/types/admin/billing`, confirm its export there (the `SubscriptionItemResponse.status` field is typed with it, per `types/admin/billing.ts`). If for some reason it isn't exported, export it, OR fall back to `type SubscriptionItemStatus = SubscriptionItemResponse["status"]`.

- [ ] **Step 2 — rewire `entity-detail-view.tsx` to the shared component.** In `components/admin/entity-detail/entity-detail-view.tsx`:
  - **Delete** the inline block: the comment + `type StatusTone`, `const STATUS_TONE`, `const ITEM_STATUS_META`, and `function SubscriptionStatusBadge(...)` (lines 24–70).
  - **Add** the import (in the `@/components/admin/shared/*` import group): `import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";`
  - **Replace** the one usage `<SubscriptionStatusBadge status={item.status} />` (≈ line 195) with `<SubscriptionItemStatusBadge status={item.status} />`.
  - **Tidy the type import:** line 21 is `import type { SubscriptionItemResponse, SubscriptionStatus } from "@/types/admin/billing";`. `SubscriptionStatus` is no longer used after the inline badge is gone → change it to `import type { SubscriptionItemResponse } from "@/types/admin/billing";`. (Verify with tsc; if tsc complains `SubscriptionStatus` is still referenced somewhere, keep it.)

- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` → clean (no new errors vs. baseline). Confirm the entity detail page still renders the same status badge.
  ```bash
  git add "components/admin/shared/subscription-item-status-badge.tsx" "components/admin/entity-detail/entity-detail-view.tsx"
  git commit -m "refactor(admin): extract shared SubscriptionItemStatusBadge (DRY across entity-detail + business-detail)"
  ```

---

## Task 2: Billable-units card — per-item status/MRR + drill-down links

**File:** Modify `components/admin/business-detail/business-detail-view.tsx`.

**Context:** Today the Billable-units card (≈ lines 586–629) shows each entity's plan + the entity's *operational* active flag, and rows are not clickable. The `itemByEntity` join (≈ lines 160–161) is built from **ACTIVE-only** items, so a PAST_DUE / TRIAL / etc. unit wrongly shows "no plan". This task: (a) join on **non-REMOVED** items so each unit shows its true plan/MRR/status; (b) render the per-item **subscription** status (not the entity active flag) on this billing card; (c) link **location** rows to `/locations/[id]`.

- [ ] **Step 1 — add a non-REMOVED item set + retarget the join.** Replace the `itemByEntity` construction at ≈ lines 160–161:

  ```ts
  const itemByEntity = new Map<string, SubscriptionItemResponse>();
  for (const i of activeItems) itemByEntity.set(i.entityId, i);
  ```

  with (keep `activeItems` above it untouched — the summary still uses it):

  ```ts
  // Join the Billable-units rows to ALL non-REMOVED items (not just ACTIVE) so a
  // PAST_DUE / trial / suspended unit shows its real plan + status, not "no plan".
  const liveItems = (subscription?.items ?? []).filter(
    (i) => i.status !== "REMOVED",
  );
  const itemByEntity = new Map<string, SubscriptionItemResponse>();
  for (const i of liveItems) itemByEntity.set(i.entityId, i);
  ```

- [ ] **Step 2 — enrich `billableUnits` (carry the item + a drill-down href).** Replace the `billableUnits` array (≈ lines 162–187) with:

  ```ts
  const billableUnits = [
    ...locations.map((l) => ({
      id: l.id,
      type: "Location" as const,
      name: l.name,
      meta: l.identifier,
      item: itemByEntity.get(l.id) ?? null,
      href: `/locations/${l.id}`,
    })),
    ...warehouses.map((w) => ({
      id: w.id,
      type: "Warehouse" as const,
      name: w.name,
      meta: w.identifier,
      item: itemByEntity.get(w.id) ?? null,
      href: null as string | null, // warehouse detail page lands in Phase 4
    })),
    ...stores.map((s) => ({
      id: s.id,
      type: "Store" as const,
      name: s.name,
      meta: s.identifier,
      item: itemByEntity.get(s.id) ?? null,
      href: null as string | null, // store detail page lands in Phase 4
    })),
  ];
  ```

  (Drops the now-unused `active` and `plan` row fields — plan/MRR/status are read off `item` in render.)

- [ ] **Step 3 — add the two new imports.** In `business-detail-view.tsx`:
  - Add `ChevronRight` to the existing `lucide-react` import (the block at lines 3–15).
  - Add `import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";` near the other `@/components/admin/shared/*` imports (after the `PlanBadge` import line 23).

- [ ] **Step 4 — rewrite the card body render.** Replace the rows block (≈ lines 599–628, the `<div className="flex flex-col"> … </div>` inside the `billableUnits.length === 0 ? … :` ternary) with:

  ```tsx
  <div className="flex flex-col">
    {billableUnits.map((u) => {
      const plan = u.item?.packageInfo?.name ?? null;
      const mrr = u.item?.packageInfo?.basePrice ?? null;
      const inner = (
        <>
          <span className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-[9px] bg-primary/12 text-[#C25E26]">
            {u.type === "Warehouse" ? (
              <Boxes className="h-[17px] w-[17px]" strokeWidth={1.5} />
            ) : u.type === "Store" ? (
              <Store className="h-[17px] w-[17px]" strokeWidth={1.5} />
            ) : (
              <MapPin className="h-[17px] w-[17px]" strokeWidth={1.5} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold text-ink">{u.name}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {u.type} · {u.meta}
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {mrr != null && (
              <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                {currency} {amt(mrr)}
              </span>
            )}
            {plan ? (
              <PlanBadge tier={planTier(plan)} label={plan} />
            ) : (
              <span className="font-mono text-[10.5px] text-muted-2">no plan</span>
            )}
            <SubscriptionItemStatusBadge status={u.item?.status ?? null} small />
            {u.href && <ChevronRight className="h-4 w-4 text-muted-2" />}
          </div>
        </>
      );
      return u.href ? (
        <Link
          key={u.id}
          href={u.href}
          className="flex items-center gap-3 border-b border-line py-3 transition-colors last:border-b-0 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
        >
          {inner}
        </Link>
      ) : (
        <div
          key={u.id}
          className="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
        >
          {inner}
        </div>
      );
    })}
  </div>
  ```

  Notes: `currency` and `amt` are already in component scope. The entity *operational* active flag is intentionally dropped from this **billing** card — the per-item subscription status is the billing-relevant signal (operational active state lives on the locations list / location detail). An entity with no subscription line renders a muted "No subscription" badge.

- [ ] **Step 5 — verify + commit.** `npx tsc --noEmit` → clean. Confirm: location rows are clickable (hover affordance + chevron) and navigate to `/locations/[id]`; warehouse/store rows are not clickable; each row shows plan + MRR + per-item status.
  ```bash
  git add "components/admin/business-detail/business-detail-view.tsx"
  git commit -m "feat(admin): billable-units rows show per-item status/MRR + drill down to location detail"
  ```

---

## Task 3: Subscription summary card — reframe + per-item status rollup

**File:** Modify `components/admin/business-detail/business-detail-view.tsx` (the "Billing & subscriptions" card, ≈ lines 557–584, + the aggregation block, + remove the now-dead `SubPill`).

**Context:** The summary card's "Overall status" row shows `subscription.status` (the legacy *business-level* status) via `SubPill`. The reframe replaces it with a **per-item status rollup** across the business's units (the cross-entity "best-of" picture), and tightens labels. `subStatus`/`trialLeft` stay used elsewhere (header badge line 229, KPI strip line 416, credit banner line 309) — do **not** remove them. `SubPill` is used *only* in this row → remove it.

- [ ] **Step 1 — compute the status rollup.** Immediately after the `planMixParts` IIFE (≈ line 156, before the `// Billable units` comment), add (depends on `liveItems` from Task 2):

  ```ts
  // Per-item billing status rolled up across this business's units (trial =
  // ACTIVE + a future trialEndDate). This replaces the legacy business-level
  // "Overall status".
  const statusRollup = (() => {
    const order = ["Active", "Trial", "Past due", "Suspended", "Expired", "Cancelled"];
    const m = new Map<string, number>();
    for (const i of liveItems) {
      const isTrial =
        i.status === "ACTIVE" &&
        !!i.trialEndDate &&
        new Date(i.trialEndDate).getTime() > Date.now();
      const label = isTrial
        ? "Trial"
        : i.status === "ACTIVE"
          ? "Active"
          : i.status === "PAST_DUE"
            ? "Past due"
            : i.status === "SUSPENDED"
              ? "Suspended"
              : i.status === "EXPIRED"
                ? "Expired"
                : "Cancelled";
      m.set(label, (m.get(label) ?? 0) + 1);
    }
    return order
      .filter((k) => m.has(k))
      .map((k) => `${m.get(k)} ${k}`)
      .join(" · ");
  })();
  ```

- [ ] **Step 2 — reframe the summary card.** In the "Billing & subscriptions" `SectionCard` (≈ lines 558–582):
  - Change the `subtitle` (line 560) to: `subtitle="rolled up across this business's units · invoices issued here"`.
  - Relabel the first `DefRow` (line 564) from `label="Billable units"` to `label="Active subscriptions"` (value stays `String(unitCount)`).
  - **Replace** the "Overall status" `DefRow` (lines 573–577) with the rollup:

  ```tsx
  <DefRow
    label="Unit statuses"
    rawValue
    value={
      statusRollup ? (
        <span className="font-mono text-[12px] text-ink">{statusRollup}</span>
      ) : (
        <span className="text-[12.5px] text-muted-2">—</span>
      )
    }
  />
  ```

  - Leave the remaining rows (MRR, Plan mix, Trial window, Paid through, Next billing, Recent invoices) as-is — they describe the consolidated subscription/invoicing.

- [ ] **Step 3 — remove the dead `SubPill`.** Delete the `function SubPill({ status, trialLeft }: …) { … }` definition (≈ lines 688–702). Do NOT touch `SubBadge`, `StatusBadge`, `subStatus`, or `trialLeft` (still used elsewhere).

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` → clean (confirm no "SubPill is not defined" and no "declared but never read" surprises). Confirm the summary card shows "Active subscriptions", "Unit statuses: N Active · N Trial · …", and the rest unchanged.
  ```bash
  git add "components/admin/business-detail/business-detail-view.tsx"
  git commit -m "feat(admin): reframe business billing summary as per-entity status rollup"
  ```

---

## Deferred (documented, NOT built this phase)
- **Business-list billing column (spec §6 "optional / nice-to-have").** `components/tables/admin-businesses/column.tsx` rows are `AdminBusinessListItem`, which carries `locationCount`/`activeLocationCount` (already shown as the "Locations" column) but **no subscription/billing data**. A unit-count-across-types or billing-status column would require either an N+1 `getBusinessSubscription` per listed business or a new backend aggregate (e.g., `billableUnitCount` + `billingStatus` on `AdminBusinessListItem`). Out of scope for a frontend-first phase; revisit if/when the list endpoint exposes a billing rollup.
- **Stripping per-entity actions off the billing page** → deferred to Phase 4 (see Execution Note decision #2).

---

## Final review & finishing
- [ ] **Full verify:** `npx tsc --noEmit` clean + `npm run lint` on the three touched files (`components/admin/shared/subscription-item-status-badge.tsx`, `components/admin/entity-detail/entity-detail-view.tsx`, `components/admin/business-detail/business-detail-view.tsx`).
- [ ] **Opus holistic** over the Phase-2 diff. Checkpoints: the shared `SubscriptionItemStatusBadge` is behavior-identical to the extracted inline badge (entity detail page unchanged); the Billable-units join now uses **non-REMOVED** items (so PAST_DUE/trial units show plan+status, not "no plan"); location rows link to `/locations/[id]` and warehouse/store rows are intentionally non-clickable (P4); per-item MRR uses `packageInfo.basePrice`; the status rollup is trial-aware and replaces the business-level "Overall status"; `SubPill` removed with no dangling refs; `subStatus`/`trialLeft`/`SubBadge`/`StatusBadge` still used and intact; only the intended files committed (WIP preserved); `canBilling` gating on the summary card unchanged.
- [ ] **Report:** Phase 2 done (business detail reframed to a cross-entity subscriptions summary; Billable-units rows drill into location detail). Flag the two deferred items (billing-page action cleanup → P4; business-list billing column → needs backend aggregate). Proceed to Phase 3 (account rework: tabs IA + tree incl wh/store + real send-email) on the user's go.

## Self-review (author checklist)
- **Spec §6 coverage:** reframe billing presence as summary-across-entities (T3 status rollup + labels) ✓; Billable-units rows link to entity detail (T2, location-only by design) ✓; keep business analytics + invoices at billing page (untouched) ✓; per-entity actions stay on entity pages — billing page unchanged this phase (deferred decision #2, documented) ✓; business-list column (deferred, documented) ✓.
- **Reuse, no new endpoints:** uses already-fetched `subscription.items[]`; reuses `PlanBadge`/`planTier`/`DefList`/`amt`/`next/link`; one shared component extracted (DRY).
- **No dead code:** `SubPill` removed (its only caller replaced); `SubscriptionStatus` import dropped from entity-detail if unused; `liveItems` introduced in T2 and consumed by both T2 (rows) and T3 (rollup) — ordering correct.
- **Type consistency:** `SubscriptionItemStatusBadge` prop `status: SubscriptionItemStatus | null`; `billableUnits[].item: SubscriptionItemResponse | null`; `href: string | null`.
- **WIP preservation:** specific-file staging; the 3 WIP files are disjoint from Phase-2 files.

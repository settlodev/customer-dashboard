# Unified, Searchable Orders List — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the orders list searchable by order number, table name, docket number, assigned-to name, and closed-by name, with one shared search + rendering implementation used on `/orders`, `/staff/[id]` (Sales tab), and `/tables/[id]` (Sales tab).

**Architecture:** A new pure helper `lib/orders/order-list-view.ts` owns the filter → paginate → resolve-names pipeline (currently copy-pasted into three server-component pages). Search stays server-side over the already-in-memory month dataset; the fix for name search is resolving staff/table UUIDs into lookup maps *before* filtering instead of after pagination. The Orders page is refactored to render through the existing `OrdersPanel` (parameterized for location-wide vs entity-scoped use), eliminating its duplicated inline list UI.

**Tech Stack:** Next.js (App Router, server components), React, TypeScript (strict), `@tanstack/react-table` via the shared `DataTable`. No test runner — verification is `npx tsc --noEmit` per task and a final `npm run build` + manual run-through.

**Conventions for this plan:**
- **No tests:** the project has no test framework and we are not adding one. Each task's gate is `npx tsc --noEmit` (clean).
- **Commits:** this repo's policy is commit-on-request. Do **not** commit per task. Task 7 holds a single commit step to run only after the user gives the go-ahead.
- All paths are relative to the repo root `/Users/Peter/Settlo/Customer-Dashboard`.

---

## File Structure

- **Create** `lib/orders/order-list-view.ts` — pure pipeline: `orderMatchesSearch` (predicate) + `buildOrderListView` (filter/paginate/resolve). Server-safe, no `"use client"`.
- **Modify** `components/tables/data-table.tsx` — add optional `searchPlaceholder` prop.
- **Modify** `components/tables/orders/orders-data-table.tsx` — pass `searchPlaceholder`.
- **Modify** `components/orders/orders-panel.tsx` — add `tabParamKey` / `scope` / `statusParam` / `emptyState` props so the standalone Orders page can render through it.
- **Modify** `app/(protected)/staff/[id]/page.tsx` — use the helper; delete local `matchesSearch`.
- **Modify** `app/(protected)/tables/[id]/page.tsx` — use the helper; delete local `matchesSearch`.
- **Rewrite** `app/(protected)/orders/page.tsx` — use the helper; render `OrdersPanel`; delete local `matchesSearch` and the inline `OrdersTabContent` / `AbandonedTabContent`.

---

## Task 1: Shared orders-list pipeline helper

**Files:**
- Create: `lib/orders/order-list-view.ts`

- [ ] **Step 1: Create the helper file**

Create `lib/orders/order-list-view.ts` with exactly this content:

```ts
import type { Order } from "@/types/orders/type";

export interface OrderListSource {
  /** Status/entity-scoped orders, before search + pagination. */
  orders: Order[];
  /** Raw value of the `?search=` param (may be empty). */
  search: string;
  /** 1-based page number. */
  page: number;
  /** Page size. */
  limit: number;
  /** All location staff — used to resolve assigned-to / closed-by names. */
  staff: Array<{ id: string; fullName: string }>;
  /** All location tables — used to resolve the table name. */
  tables: Array<{ id: string; name: string }>;
}

export interface OrderListView {
  /** Rows for the requested page (already sliced). */
  pageData: Order[];
  /** Total rows after search, before pagination. */
  total: number;
  /** Number of pages at `limit` rows each (>= 1). */
  pageCount: number;
  /** id → name for staff referenced by `pageData` (small; for the client table). */
  staffNames: Record<string, string>;
  /** id → name for tables referenced by `pageData` (small; for the client table). */
  tableNames: Record<string, string>;
}

/**
 * Whether an order matches the free-text search. `needle` must already be
 * lower-cased and non-empty. Resolves staff/table UUIDs through the supplied
 * maps so a manager can search by table name, docket number, or the name of
 * the person who opened or closed the order — not just the raw order fields.
 */
export function orderMatchesSearch(
  order: Order,
  needle: string,
  staffById: Map<string, string>,
  tableById: Map<string, string>,
): boolean {
  const tableName = order.tableId ? tableById.get(order.tableId) ?? "" : "";
  const assignedToName = order.assignedTo
    ? staffById.get(order.assignedTo) ?? ""
    : "";
  const finishedByName = order.finishedBy
    ? staffById.get(order.finishedBy) ?? ""
    : "";
  const docket = order.docketNumber != null ? String(order.docketNumber) : "";

  return (
    (order.orderNumber ?? "").toLowerCase().includes(needle) ||
    tableName.toLowerCase().includes(needle) ||
    docket.includes(needle) ||
    assignedToName.toLowerCase().includes(needle) ||
    finishedByName.toLowerCase().includes(needle) ||
    (order.notes ?? "").toLowerCase().includes(needle) ||
    (order.externalOrderId ?? "").toLowerCase().includes(needle) ||
    (order.cancellationReason ?? "").toLowerCase().includes(needle)
  );
}

/**
 * Shared orders-list pipeline used by /orders, /staff/[id], and /tables/[id].
 * Filters the scoped set by the search string (matching order number, table
 * name, docket number, assigned-to and closed-by names, plus notes / external
 * id / cancellation reason), paginates, and resolves the staff/table names for
 * just the rows on the returned page (keeping the client props small).
 */
export function buildOrderListView({
  orders,
  search,
  page,
  limit,
  staff,
  tables,
}: OrderListSource): OrderListView {
  const staffById = new Map<string, string>();
  for (const s of staff) staffById.set(s.id, s.fullName);
  const tableById = new Map<string, string>();
  for (const t of tables) tableById.set(t.id, t.name);

  const needle = search.toLowerCase();
  const filtered = needle
    ? orders.filter((o) => orderMatchesSearch(o, needle, staffById, tableById))
    : orders;

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  for (const o of pageData) {
    if (o.assignedTo && staffById.has(o.assignedTo)) {
      staffNames[o.assignedTo] = staffById.get(o.assignedTo)!;
    }
    if (o.finishedBy && staffById.has(o.finishedBy)) {
      staffNames[o.finishedBy] = staffById.get(o.finishedBy)!;
    }
    if (o.tableId && tableById.has(o.tableId)) {
      tableNames[o.tableId] = tableById.get(o.tableId)!;
    }
  }

  return { pageData, total, pageCount, staffNames, tableNames };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (no errors). The file is self-contained; only `Order` is imported.

---

## Task 2: Informative search placeholder on `DataTable`

**Files:**
- Modify: `components/tables/data-table.tsx` (props interface ~126-183; destructuring ~185-201; placeholder ~584)
- Modify: `components/tables/orders/orders-data-table.tsx:53-65`

- [ ] **Step 1: Add `searchPlaceholder` to the props interface**

In `components/tables/data-table.tsx`, in `interface DataTableProps`, immediately after the `hideSearch?: boolean;` block (the one preceded by the "Hide the search input entirely" comment), add:

```ts
  /**
   * Placeholder text for the search input. Defaults to "Search...".
   */
  searchPlaceholder?: string;
```

- [ ] **Step 2: Destructure it with a default**

In the same file, in the `DataTable` function parameter destructuring, change:

```ts
  hideSearch = false,
}: DataTableProps<TData, TValue>) {
```

to:

```ts
  hideSearch = false,
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
```

- [ ] **Step 3: Use it on the input**

In the same file, change the search input's placeholder:

```tsx
            placeholder="Search..."
```

to:

```tsx
            placeholder={searchPlaceholder}
```

- [ ] **Step 4: Pass it from `OrdersDataTable`**

In `components/tables/orders/orders-data-table.tsx`, change the `<DataTable>` element:

```tsx
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      searchKey="orderNumber"
      total={total}
      filterKey="orderStatus"
      filterOptions={ORDERS_TAB_FILTER_OPTIONS}
      rowClickBasePath="/orders"
    />
```

to:

```tsx
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      searchKey="orderNumber"
      searchPlaceholder="Search order #, table, staff…"
      total={total}
      filterKey="orderStatus"
      filterOptions={ORDERS_TAB_FILTER_OPTIONS}
      rowClickBasePath="/orders"
    />
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. (Note: `AbandonedDataTable` does not pass `searchPlaceholder`; it falls back to the `"Search..."` default — acceptable, abandoned rows are searched the same way once Task 6 wires the helper.)

---

## Task 3: Parameterize `OrdersPanel` for location-wide use

`OrdersPanel` currently serves only the entity-scoped Sales tabs. Add props so the standalone Orders page can render through it without behavior changes. All new props are optional with defaults that preserve today's staff/table behavior.

**Files:**
- Modify: `components/orders/orders-panel.tsx`

- [ ] **Step 1: Import `ReactNode`**

At the top of `components/orders/orders-panel.tsx`, immediately under the `"use client";` line, add:

```ts
import type { ReactNode } from "react";
```

- [ ] **Step 2: Add the four new props to the `Props` interface**

In the `Props` interface, immediately after the `preservedParams: Record<string, string | undefined>;` line (the last member), add:

```ts
  /**
   * Query param that carries the active sub-tab. Defaults to `view` (the
   * entity Sales tabs); the standalone Orders page passes `tab`.
   */
  tabParamKey?: string;
  /**
   * `location` (the standalone Orders page) shows the extra "Tied to a
   * table" abandoned KPI; `entity` (a staff/table Sales tab) omits it.
   */
  scope?: "location" | "entity";
  /**
   * Active status filter — drives the Orders KPI delta text only. Set by the
   * standalone Orders page; omitted by the entity Sales tabs.
   */
  statusParam?: OrderStatus | "";
  /**
   * Rendered in place of the Orders/Abandoned view (the tab nav + date filter
   * still render above it). The standalone Orders page passes its empty-state
   * element here when the list is empty and unfiltered.
   */
  emptyState?: ReactNode;
```

- [ ] **Step 3: Destructure the new props in `OrdersPanel`**

Change the `OrdersPanel` destructuring:

```tsx
export function OrdersPanel({
  basePath,
  view,
  from,
  to,
  scoped,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
  currency,
  preservedParams,
}: Props) {
```

to:

```tsx
export function OrdersPanel({
  basePath,
  view,
  from,
  to,
  scoped,
  pageData,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
  currency,
  preservedParams,
  tabParamKey = "view",
  scope = "entity",
  statusParam,
  emptyState,
}: Props) {
```

- [ ] **Step 4: Wire `tabParamKey`, `emptyState`, `statusParam`, `scope` into the body**

Replace the entire `return (...)` body of `OrdersPanel` (from `<div className="space-y-6">` through its closing `</div>`):

```tsx
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrdersTabNav
          active={view}
          basePath={basePath}
          paramKey="view"
          preservedParams={preservedParams}
        />
        <OrdersDateFilter from={from} to={to} />
      </div>

      {view === "orders" ? (
        <OrdersView
          scoped={scoped}
          pageData={pageData}
          pageCount={pageCount}
          pageNo={pageNo}
          total={total}
          currency={currency}
          tableMode={tableMode}
          staffNames={staffNames}
          tableNames={tableNames}
        />
      ) : (
        <AbandonedView
          scoped={scoped}
          pageData={pageData}
          pageCount={pageCount}
          pageNo={pageNo}
          total={total}
          tableMode={tableMode}
          staffNames={staffNames}
          tableNames={tableNames}
        />
      )}
    </div>
  );
```

with:

```tsx
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrdersTabNav
          active={view}
          basePath={basePath}
          paramKey={tabParamKey}
          preservedParams={preservedParams}
        />
        <OrdersDateFilter from={from} to={to} />
      </div>

      {emptyState ??
        (view === "orders" ? (
          <OrdersView
            scoped={scoped}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            currency={currency}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
            statusParam={statusParam}
          />
        ) : (
          <AbandonedView
            scoped={scoped}
            pageData={pageData}
            pageCount={pageCount}
            pageNo={pageNo}
            total={total}
            tableMode={tableMode}
            staffNames={staffNames}
            tableNames={tableNames}
            scope={scope}
          />
        ))}
    </div>
  );
```

- [ ] **Step 5: Add `statusParam` to `OrdersView` and use it in the Orders KPI delta**

In `OrdersView`'s props type (the inline `}: { ... }` object), after `tableNames: Record<string, string>;`, add:

```ts
  statusParam?: OrderStatus | "";
```

Add `statusParam` to `OrdersView`'s destructured params (after `tableNames,`).

Then change the first KPI card's delta from:

```tsx
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={scoped.length.toLocaleString()}
          delta="Across all statuses"
          deltaTone="neutral"
        />
```

to:

```tsx
        <KpiCard
          icon={<ReceiptText className="h-3 w-3" />}
          label="Orders"
          value={scoped.length.toLocaleString()}
          delta={
            statusParam ? `Filtered: ${statusParam}` : "Across all statuses"
          }
          deltaTone="neutral"
        />
```

- [ ] **Step 6: Add `scope` to `AbandonedView` and the location-only KPI**

In `AbandonedView`'s props type, after `tableNames: Record<string, string>;`, add:

```ts
  scope: "location" | "entity";
```

Add `scope` to `AbandonedView`'s destructured params (after `tableNames,`).

After the `const manualAbandoned = totalAbandoned - autoAbandoned;` line, add:

```ts
  const withTable = scoped.filter((o) => !!o.tableId).length;
```

Change the abandoned KPI strip opener from:

```tsx
      <KpiStrip cols={3}>
```

to:

```tsx
      <KpiStrip cols={scope === "location" ? 4 : 3}>
```

Then, inside that `<KpiStrip>`, immediately after the "Manual" `<KpiCard ... />` (the one with `label="Manual"`), add:

```tsx
        {scope === "location" ? (
          <KpiCard
            icon={<Receipt className="h-3 w-3" />}
            label="Tied to a table"
            value={withTable > 0 ? withTable.toLocaleString() : "—"}
            delta="Likely claim auto-release"
            deltaTone="neutral"
          />
        ) : null}
```

(`Receipt` is already imported at the top of the file.)

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. The staff/table pages still compile unchanged because every new prop is optional. (They will be wired to the helper in Tasks 4–5; their `OrdersPanel` calls don't need to change.)

---

## Task 4: Wire `/staff/[id]` Sales tab to the helper

**Files:**
- Modify: `app/(protected)/staff/[id]/page.tsx`

- [ ] **Step 1: Import the helper**

In `app/(protected)/staff/[id]/page.tsx`, add this import alongside the other `@/lib` imports (e.g. after the `listOrders` import line):

```ts
import { buildOrderListView } from "@/lib/orders/order-list-view";
```

- [ ] **Step 2: Delete the local `matchesSearch`**

Remove this entire block (it sits just above `export default async function StaffPage`):

```ts
const matchesSearch = (order: Order, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    order.orderNumber?.toLowerCase().includes(needle) ||
    (order.notes ?? "").toLowerCase().includes(needle) ||
    (order.externalOrderId ?? "").toLowerCase().includes(needle) ||
    (order.cancellationReason ?? "").toLowerCase().includes(needle)
  );
};
```

- [ ] **Step 3: Replace the filter/paginate/resolve block with the helper call**

Replace this block (everything from `const filtered = ...` through the two name-resolution `for` loops):

```ts
  const filtered = scoped.filter((o) => matchesSearch(o, q));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (pageNo - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  // Resolve assigned/closed-by staff and table UUIDs to names, but only
  // for the rows on the visible page — keeps the client props small.
  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  const neededStaffIds = new Set<string>();
  const neededTableIds = new Set<string>();
  for (const o of pageData) {
    if (o.assignedTo) neededStaffIds.add(o.assignedTo);
    if (o.finishedBy) neededStaffIds.add(o.finishedBy);
    if (o.tableId) neededTableIds.add(o.tableId);
  }
  for (const s of staffList) {
    if (neededStaffIds.has(s.id)) staffNames[s.id] = s.fullName;
  }
  for (const t of tablesList) {
    if (neededTableIds.has(t.id)) tableNames[t.id] = t.name;
  }
```

with:

```ts
  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders: scoped,
      search: q,
      page: pageNo,
      limit,
      staff: staffList,
      tables: tablesList,
    });
```

(`scoped`, `q`, `pageNo`, `limit`, `staffList`, `tablesList` are all already defined above this block; the `OrdersPanel` element below still consumes `pageData` / `total` / `pageCount` / `staffNames` / `tableNames` unchanged.)

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. `Order` and `OrderStatus` remain used (the `allOrders` type and the `scoped` computation), so no imports become unused.

---

## Task 5: Wire `/tables/[id]` Sales tab to the helper

**Files:**
- Modify: `app/(protected)/tables/[id]/page.tsx`

- [ ] **Step 1: Import the helper**

In `app/(protected)/tables/[id]/page.tsx`, add alongside the other `@/lib` imports (e.g. after the `listOrders` import line):

```ts
import { buildOrderListView } from "@/lib/orders/order-list-view";
```

- [ ] **Step 2: Delete the local `matchesSearch`**

Remove this entire block (just above `export default async function TablePage`):

```ts
const matchesSearch = (order: Order, q: string): boolean => {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    order.orderNumber?.toLowerCase().includes(needle) ||
    (order.notes ?? "").toLowerCase().includes(needle) ||
    (order.externalOrderId ?? "").toLowerCase().includes(needle) ||
    (order.cancellationReason ?? "").toLowerCase().includes(needle)
  );
};
```

- [ ] **Step 3: Replace the filter/paginate/resolve block with the helper call**

Replace this block (from `const filtered = ...` through the two name-resolution `for` loops):

```ts
  const filtered = scoped.filter((o) => matchesSearch(o, q));
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const start = (pageNo - 1) * limit;
  const pageData = filtered.slice(start, start + limit);

  // Resolve assigned/closed-by staff and table UUIDs to names, but only
  // for the rows on the visible page — keeps the client props small.
  const staffNames: Record<string, string> = {};
  const tableNames: Record<string, string> = {};
  const neededStaffIds = new Set<string>();
  const neededTableIds = new Set<string>();
  for (const o of pageData) {
    if (o.assignedTo) neededStaffIds.add(o.assignedTo);
    if (o.finishedBy) neededStaffIds.add(o.finishedBy);
    if (o.tableId) neededTableIds.add(o.tableId);
  }
  for (const s of staffList) {
    if (neededStaffIds.has(s.id)) staffNames[s.id] = s.fullName;
  }
  for (const t of tablesList) {
    if (neededTableIds.has(t.id)) tableNames[t.id] = t.name;
  }
```

with:

```ts
  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders: scoped,
      search: q,
      page: pageNo,
      limit,
      staff: staffList,
      tables: tablesList,
    });
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

---

## Task 6: Refactor `/orders` to use the helper and `OrdersPanel`

This rewrites `app/(protected)/orders/page.tsx`: the inline `OrdersTabContent` / `AbandonedTabContent` and the local `matchesSearch` are deleted, and the page renders `OrdersPanel` with `scope="location"`, `tabParamKey="tab"`, `statusParam`, and the `<NoItems>` empty state. KPIs and the abandoned "Tied to a table" card now come from `OrdersPanel` itself.

**Files:**
- Rewrite: `app/(protected)/orders/page.tsx`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `app/(protected)/orders/page.tsx` with:

```tsx
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import NoItems from "@/components/layouts/no-items";
import { OrdersPanel, type SalesView } from "@/components/orders/orders-panel";
import { OrdersRealtimeBridge } from "@/components/realtime/orders-realtime-bridge";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { listOrders } from "@/lib/actions/order-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { Order, OrderStatus } from "@/types/orders/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    status?: string;
    from?: string;
    to?: string;
    tab?: string;
  }>;
};

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;
  const tab: SalesView = resolved.tab === "abandoned" ? "abandoned" : "orders";
  const statusParam = (resolved.status ?? "") as OrderStatus | "";

  // Default to current month when no explicit range is supplied — keeps
  // the initial load bounded instead of pulling every order ever made
  // at this location.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  // On the Abandoned tab the status is fixed — the user-supplied
  // `status` filter dropdown is hidden and we hard-code ABANDONED on
  // the request side so the OMS only returns the relevant rows.
  const effectiveStatus: OrderStatus | undefined =
    tab === "abandoned" ? OrderStatus.ABANDONED : statusParam || undefined;

  const [orders, currentLocation, locationSettings, staffList, tablesList] =
    await Promise.all([
      listOrders({
        fromDate: from,
        toDate: to,
        status: effectiveStatus,
      }).catch((): Order[] => []),
      getCurrentLocation(),
      getLocationSettings().catch(() => null),
      fetchAllStaff().catch(() => []),
      fetchAllTables().catch(() => []),
    ]);

  // Table-based ordering swaps the lead column to the table name; the
  // standard mode keeps the order number in front.
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";

  // Abandoned orders have their own tab. When the main list runs without
  // an explicit status filter the OMS hands back every status, so strip
  // ABANDONED here to stop it bleeding into the orders list.
  const scopedOrders =
    tab === "orders"
      ? orders.filter((o) => o.orderStatus !== OrderStatus.ABANDONED)
      : orders;

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders: scopedOrders,
      search: q,
      page,
      limit,
      staff: staffList,
      tables: tablesList,
    });

  const currency =
    scopedOrders.find((o) => o.settlementCurrency)?.settlementCurrency ?? "TZS";
  const totalOrders = scopedOrders.length;
  const hasAny = totalOrders > 0;
  // The default current-month range shouldn't count as a "user filter" —
  // we want first-time locations to land on the empty state, not on a
  // populated table-shell with no rows. A URL-supplied from/to does.
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters =
    q !== "" || (tab === "orders" && !!statusParam) || !isDefaultRange;

  const subtitle =
    from === to
      ? `Activity for ${format(new Date(from), "MMM d, yyyy")}`
      : `Activity ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell>
      <PageBreadcrumbs items={[{ title: "Orders" }]} />
      <PageHeader title="Orders" subtitle={subtitle} />
      {currentLocation?.id && (
        <OrdersRealtimeBridge locationId={currentLocation.id} />
      )}

      <PageBody>
        <OrdersPanel
          basePath="/orders"
          tabParamKey="tab"
          view={tab}
          from={from}
          to={to}
          scoped={scopedOrders}
          pageData={pageData}
          pageCount={pageCount}
          pageNo={page - 1}
          total={total}
          tableMode={tableMode}
          staffNames={staffNames}
          tableNames={tableNames}
          currency={currency}
          scope="location"
          statusParam={statusParam}
          emptyState={
            hasAny || hasFilters ? undefined : (
              <NoItems
                itemName={tab === "abandoned" ? "abandoned orders" : "orders"}
              />
            )
          }
          preservedParams={{
            search: resolved.search,
            from: resolved.from,
            to: resolved.to,
            limit: resolved.limit,
            status: resolved.status,
          }}
        />
      </PageBody>
    </PageShell>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. No unused imports remain (KPI icons, `KpiStrip`/`KpiCard`, `Card`/`CardContent`, `OrdersDataTable`, `AbandonedDataTable`, `OrdersTabNav`, `OrdersDateFilter`, `PaymentStatus` were all only used by the now-deleted inline content and are gone from the import list).

---

## Task 7: Full verification and commit

**Files:** none (verification only).

- [ ] **Step 1: Production build (type + lint)**

Run: `npm run build`
Expected: build completes with no TypeScript or ESLint errors. (This catches unused-import / lint issues that `tsc --noEmit` does not.)

- [ ] **Step 2: Manual run-through**

Start the dev server (`npm run dev`) and verify, on **each** of `/orders`, a staff detail page `→ Sales` tab (`/staff/<id>?tab=sales`), and a table detail page `→ Sales` tab (`/tables/<id>?tab=sales`):

- The search box placeholder reads `Search order #, table, staff…` on `/orders` and the Sales-tab Orders sub-tab.
- Searching by **order number** returns the matching order(s).
- Searching by **table name** (e.g. `T4`) returns orders on that table.
- Searching by **docket number** returns the matching order.
- Searching by **assigned-to** staff name returns that staff's orders.
- Searching by **closed-by** staff name returns orders that person closed.
- Clearing the search restores the full list; pagination, the status filter, KPI values, and the date filter all behave as before.
- On `/orders`, the Abandoned tab still shows the four KPIs (incl. "Tied to a table"); the staff/table Sales Abandoned sub-tabs still show three.
- A fresh location with no orders still shows the empty state on `/orders`.

Expected: all pass.

- [ ] **Step 3: Commit (only after the user gives the go-ahead)**

Confirm the user wants the change committed, then:

```bash
git add lib/orders/order-list-view.ts \
  components/tables/data-table.tsx \
  components/tables/orders/orders-data-table.tsx \
  components/orders/orders-panel.tsx \
  "app/(protected)/orders/page.tsx" \
  "app/(protected)/staff/[id]/page.tsx" \
  "app/(protected)/tables/[id]/page.tsx" \
  docs/superpowers/specs/2026-06-10-orders-list-search-design.md \
  docs/superpowers/plans/2026-06-10-orders-list-search.md
git commit -m "Orders list: shared search by order #, table, docket, assigned/closed-by"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** order # / table name / docket # / assigned-to / closed-by search → Task 1 predicate; shared implementation across the 3 pages → Tasks 4–6 + the Task 1 helper; same UI/columns everywhere → Task 6 (Orders page adopts `OrdersPanel`) + Task 3 (parameterization); informative search box → Task 2. All spec sections map to a task.
- **Placeholder scan:** none — every code step shows full content.
- **Type consistency:** `buildOrderListView` / `OrderListSource` / `OrderListView` / `orderMatchesSearch` names and shapes are identical across Tasks 1, 4, 5, 6. `OrdersPanel` new props (`tabParamKey`, `scope`, `statusParam`, `emptyState`) are defined in Task 3 and consumed with matching names/types in Task 6. `SalesView` is the shared sub-tab union used by both `OrdersPanel` and the rewritten Orders page.
```

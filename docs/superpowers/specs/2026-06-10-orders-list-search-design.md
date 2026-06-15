# Unified, searchable orders list — design

**Date:** 2026-06-10
**Status:** Approved (manual build + verification; no test framework added)

## Context

The orders list appears in three places, each a server component that fetches the
location's orders for a date range, scopes them, runs a search filter, paginates by
slicing, and finally resolves staff/table UUIDs to display names **for the visible
page only**:

- `app/(protected)/orders/page.tsx` — the standalone Orders page.
- `app/(protected)/staff/[id]/page.tsx` — the staff detail "Sales" tab.
- `app/(protected)/tables/[id]/page.tsx` — the table detail "Sales" tab.

The columns are already shared (`components/tables/orders/columns.tsx` →
`buildOrdersColumns`), and the staff/table pages already render through
`components/orders/orders-panel.tsx` (`OrdersPanel`). The Orders page has its own
near-identical inline `OrdersTabContent` / `AbandonedTabContent`.

Two problems:

1. **Search is duplicated and incomplete.** A `matchesSearch(order, q)` predicate is
   copy-pasted into all three pages. It matches only `orderNumber`, `notes`,
   `externalOrderId`, and `cancellationReason`. It cannot match table name, docket
   number, assigned-to name, or closed-by name — because at filter time only UUIDs
   exist; names are resolved *after* pagination (e.g. `orders/page.tsx:118-135`).
2. **Rendering is duplicated.** The Orders page reimplements the list UI that
   `OrdersPanel` already provides for the staff/table tabs.

## Goal

One orders-list implementation — same columns, same layout, same search — used
everywhere orders are viewed. Search matches:

- **Order number** (`order.orderNumber`)
- **Table** — table name (`tables[tableId].name`) **and** docket number
  (`order.docketNumber`)
- **Assigned-to name** (`staff[assignedTo].fullName`)
- **Closed-by name** (`staff[finishedBy].fullName`)

The existing matches (`notes`, `externalOrderId`, `cancellationReason`) are retained,
so the new predicate is a superset of the current one.

## Approach

Keep search **server-side**, operating on the already-in-memory month dataset — no
backend change. The only reason names aren't searchable today is timing: UUID→name
resolution happens after pagination, so the filter never sees a name. Fix: build
`id → name` lookup maps from the already-fetched `staff` / `tables` lists **before**
filtering, and have the predicate resolve names through them.

*Rejected alternative:* a backend `?q=` search endpoint. Unnecessary — the data is
already loaded client-side and bounded by date range.

## Design

### 1. Shared pipeline helper — `lib/orders/order-list-view.ts` (new)

Pure, server-safe module (no `"use client"`). Encapsulates the
filter → paginate → resolve sequence currently duplicated in the three pages.

```ts
export interface OrderListSource {
  orders: Order[];   // status/entity-scoped orders, pre-search
  search: string;    // raw ?search= string (may be empty)
  page: number;      // 1-based
  limit: number;
  staff: Array<{ id: string; fullName: string }>;   // from fetchAllStaff()
  tables: Array<{ id: string; name: string }>;       // from fetchAllTables()
}

export interface OrderListView {
  pageData: Order[];
  total: number;
  pageCount: number;
  staffNames: Record<string, string>;  // page-scoped id→name (small, for the client)
  tableNames: Record<string, string>;  // page-scoped id→name (small, for the client)
}

export function orderMatchesSearch(
  order: Order,
  needle: string,                  // already lower-cased, non-empty
  staffById: Map<string, string>,
  tableById: Map<string, string>,
): boolean;

export function buildOrderListView(src: OrderListSource): OrderListView;
```

`buildOrderListView` internally:

1. Builds full `staffById` / `tableById` maps from `staff` / `tables` (small lists).
2. Filters `orders` with `orderMatchesSearch` (empty search → keep all).
3. Computes `total` and `pageCount`, slices the requested page → `pageData`.
4. Builds **page-scoped** `staffNames` / `tableNames` from the ids present in
   `pageData` only (preserving today's "keep client props small" behavior).

`orderMatchesSearch` matches (case-insensitive `includes`): `orderNumber`, resolved
table name, `String(docketNumber)`, resolved assigned-to name, resolved closed-by
name, `notes`, `externalOrderId`, `cancellationReason`.

### 2. Wire the three pages to the helper

In each of `orders/page.tsx`, `staff/[id]/page.tsx`, `tables/[id]/page.tsx`: delete
the local `matchesSearch` and the inline filter/slice/resolve block (~30 lines), and
replace with a single call:

```ts
const { pageData, total, pageCount, staffNames, tableNames } = buildOrderListView({
  orders: scoped,
  search: q,
  page,        // the page's existing 1-based page number
  limit,
  staff: staffList,
  tables: tablesList,
});
```

Date-range fetch, status/entity scoping, and the `scoped` set (used for KPIs) are
unchanged.

### 3. Rendering unification — `OrdersPanel` as the single list component

Delete `OrdersTabContent` / `AbandonedTabContent` from `orders/page.tsx`; render
`OrdersPanel` there too. To preserve the Orders page's exact current behavior,
`OrdersPanel` gains four props:

- `tabParamKey?: string` (default `"view"`). Orders page passes `"tab"`.
- `statusParam?: OrderStatus | ""`. Drives the Orders-tab KPI delta
  (`"Filtered: <status>"` when set, else `"Across all statuses"`). Staff/table pages
  omit it → unchanged.
- `scope?: "location" | "entity"` (default `"entity"`). `"location"` renders the 4th
  "Tied to a table" abandoned KPI the Orders page shows today; `"entity"` keeps the
  3-KPI set.
- `emptyState?: ReactNode`. Orders page passes its `<NoItems>` element when the list
  is empty and unfiltered (today's gate); staff/table pages omit it. When present,
  `OrdersPanel` renders it in place of the Orders/Abandoned view, but still renders the
  tab nav + date filter above it (matching the Orders page today).

`OrdersTabNav` already accepts `basePath` / `paramKey`; `OrdersPanel` forwards
`basePath` and the new `tabParamKey`. Each page continues to pass its own
`preservedParams` (the Orders page preserves `status`; staff/table pages preserve the
detail-view `tab`).

### 4. Informative search box — `searchPlaceholder?` on `DataTable`

Add an optional `searchPlaceholder?: string` prop to `components/tables/data-table.tsx`
(default `"Search..."`, so all other tables are unaffected). The hardcoded placeholder
on `data-table.tsx:584` reads from it. `OrdersDataTable` passes
`"Search order #, table, staff…"`. This is the only visible signal that search now
covers more fields, and the only `DataTable` change.

## Out of scope / unchanged

`buildOrdersColumns` and column rendering, the date filter, tab nav structure, KPI
*values*, pagination mechanics, the abandoned table, and row-click behavior — all
untouched except the `OrdersPanel` parameterization above. Report pages
(`report/top-selling`, `report/sold-items`, `report/sales`) have their own unrelated
`matchesSearch` over different types and are not touched.

## File change list

- **New:** `lib/orders/order-list-view.ts`
- **Edit:** `components/orders/orders-panel.tsx` (new props; `scope`/`emptyState`/
  `statusParam`/`tabParamKey` handling; delete need for page-level duplication)
- **Edit:** `components/tables/data-table.tsx` (add `searchPlaceholder?` prop)
- **Edit:** `components/tables/orders/orders-data-table.tsx` (pass `searchPlaceholder`)
- **Edit:** `app/(protected)/orders/page.tsx` (use helper; render `OrdersPanel`; delete
  inline `matchesSearch` + `OrdersTabContent`/`AbandonedTabContent`)
- **Edit:** `app/(protected)/staff/[id]/page.tsx` (use helper; delete inline
  `matchesSearch`)
- **Edit:** `app/(protected)/tables/[id]/page.tsx` (use helper; delete inline
  `matchesSearch`)

## Verification

No test runner exists in the project; verification is manual:

1. `npx tsc --noEmit` (or `next build`) is clean.
2. Run the app; on each of `/orders`, `/staff/[id]` (Sales tab), `/tables/[id]`
   (Sales tab), confirm searching by order number, table name, docket number,
   assigned-to name, and closed-by name each returns the expected rows, and that
   pagination/KPIs/date-filter still behave as before.

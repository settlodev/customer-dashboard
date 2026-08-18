# Voids Report — Design Spec

- **Date:** 2026-06-18
- **Status:** Approved (design); pending spec review
- **Repos touched:** `Customer-Dashboard` (the report UI) and `Settlo Order Management Service` (a new read endpoint)

## 1. Goal

Add a **Voids report** to the Customer Dashboard that lists every order containing one or
more voided line items within a date range, shows the void amount per order, and lets the
user open an order to its existing detail screen. The list must look and behave like the
existing Orders table (same component, same row interactions) for UX consistency.

## 2. Confirmed decisions

| Decision | Choice | Rationale |
|---|---|---|
| Placement | New page under **Reports** at `/report/voids` | Standard home for reports; discoverable; keeps an audit view out of the live ops list |
| What counts as a "void" | **Orders with ≥1 voided line item** (`OrderItem.removed = true AND voidReason != null`) | Matches how the OMS models voids; refunds and whole-order cancellations are out of scope (refunds already have their own report) |
| Void amount | **Net** value of voided items (`Σ OrderItem.netAmount`) | Consistent with how order totals are computed |
| Status scope | **All order statuses** (OPEN / CLOSED / CANCELLED) | A void on an open order still counts; the Status column shows which |
| Data source | **Dedicated OMS endpoint** (not client-side filtering of the orders list) | Server-side filtering + authoritative aggregation; avoids over-fetching every order |
| Dashboard tests | **(b)** match the repo's no-test convention | Dashboard logic is now a trivial per-row sum; real logic + tests live in the OMS |
| Void amount column | Inserted **before the Status column** | Groups with the other money columns |

## 3. Architecture

Two-repo change:

```
Customer-Dashboard (/report/voids)
   page.tsx ──> getVoidsReport({fromDate,toDate})  [server action]
                       │  oms().get("/api/v1/orders/voids?…")
                       ▼
Settlo Order Management Service
   OrderController GET /api/v1/orders/voids
        └─ OrderService.voidsReport(locationId, from, to, status)
              ├─ OrderRepository.findVoidedOrders(...)      → rows
              ├─ OrderRepository.tallyVoidsByReason(...)    → summary.reasons / items / amount
              └─ OrderRepository.countOrders(...)           → summary.totalOrders
        returns OrderVoidsResponse { summary, orders: OrderResponseDto[] }
```

The endpoint returns **only voided orders** as the existing `OrderResponseDto` (so the
dashboard's `Order`-typed table/search reuse works unchanged) plus a **server-computed
summary** for the KPI strip.

---

## 4. Part 1 — OMS endpoint (`Settlo Order Management Service`)

### 4.1 Route
- `GET /api/v1/orders/voids`
- New method on `OrderController` (base mapping `/api/v1/orders`).
- `@PreAuthorize("hasAuthority('" + OrderPermission.ORDER_READ + "')")`.
- Uses the literal segment `/voids`; Spring resolves literal paths ahead of the existing
  `@GetMapping("/{orderId}")`, so there is no collision.
- Reads the location via the existing `locationId()` (`RequestContext.get().getLocationId()`).

### 4.2 Query params (mirror the existing `list` method)
- `fromDate` — `LocalDate`, ISO, optional (lower bound on `businessDate`, inclusive).
- `toDate` — `LocalDate`, ISO, optional (upper bound, inclusive).
- `status` — `OrderStatus`, optional. When omitted, all statuses are included.

### 4.3 Response DTOs (new)
```java
public record OrderVoidsResponse(
    VoidsSummary summary,
    List<OrderResponseDto> orders   // voided orders only, newest first
) {}

public record VoidsSummary(
    long totalOrders,        // all orders in range — denominator for the void-rate KPI
    long voidedOrders,       // orders with >= 1 voided item
    long voidedItems,        // count of voided line items
    BigDecimal voidAmount,   // Σ netAmount of voided items
    String currency,         // settlement currency (nullable)
    List<VoidReasonTally> reasons
) {}

public record VoidReasonTally(
    VoidReason reason,
    long count,
    BigDecimal amount
) {}
```
Rows reuse the **existing `OrderResponseDto`** and the **existing `OrderMapper.toDto`**;
`removedItems` (with `voidReason` + `netAmount`) is already populated by that mapper.

### 4.4 Service — `OrderService.voidsReport(locationId, from, to, status)`
1. Fetch voided orders → map with `OrderMapper.toDto` → `orders`.
2. Fetch the per-reason tally → derive `reasons`, `voidedItems` (Σ count), `voidAmount` (Σ amount).
3. Fetch `totalOrders` count over the range.
4. `voidedOrders` = `orders.size()`.
5. `currency` = first non-null `settlementCurrency` among the voided orders, else `null`.
6. Assemble `OrderVoidsResponse`.

Default the date range defensively if both bounds are null (e.g. current business day or
month) — match whatever the existing `list` path does so behaviour is consistent.

### 4.5 Repository (new queries on `OrderRepository`)
```java
// Rows: distinct orders that have at least one voided item.
@Query("""
    SELECT DISTINCT o FROM Order o
    JOIN o.items i
    WHERE o.locationId = :locationId
      AND o.businessDate BETWEEN :from AND :to
      AND o.deletedAt IS NULL
      AND i.removed = true
      AND i.deletedAt IS NULL
      AND i.voidReason IS NOT NULL
      AND (:status IS NULL OR o.orderStatus = :status)
    ORDER BY o.openedDate DESC
""")
List<Order> findVoidedOrders(UUID locationId, LocalDate from, LocalDate to, OrderStatus status);

// Summary tally grouped by reason.
@Query("""
    SELECT i.voidReason AS reason, COUNT(i) AS count, COALESCE(SUM(i.netAmount), 0) AS amount
    FROM OrderItem i
    JOIN i.order o
    WHERE o.locationId = :locationId
      AND o.businessDate BETWEEN :from AND :to
      AND o.deletedAt IS NULL
      AND i.removed = true
      AND i.deletedAt IS NULL
      AND i.voidReason IS NOT NULL
      AND (:status IS NULL OR o.orderStatus = :status)
    GROUP BY i.voidReason
""")
List<VoidReasonTallyProjection> tallyVoidsByReason(UUID locationId, LocalDate from, LocalDate to, OrderStatus status);
```
- `totalOrders` reuses (or adds, following the existing pattern) a count over
  `locationId + businessDate BETWEEN [+ status]`.
- The void predicate (`removed = true AND voidReason IS NOT NULL`) is **identical** in the
  row query and the tally, so the rows and the summary can never disagree.
- Confirm the JPA association names (`o.items`, `i.order`) and the `OrderItem.netAmount`
  field during implementation; adjust to the real mappings.

### 4.6 Edge cases
- No voided orders in range → `orders: []`, summary zeros, `currency: null`.
- `netAmount` null on a voided item → treated as 0 (via `COALESCE`).
- Removed item with `voidReason = null` (removed by a non-void path) → **excluded** by design.

### 4.7 Tests (OMS)
Follow existing OMS test conventions:
- Repository slice tests for `findVoidedOrders` and `tallyVoidsByReason` (orders with no
  voids excluded; mixed reasons tallied; null `netAmount` summed as 0; status filter honoured).
- Service test for `voidsReport` assembling the summary correctly (counts, sums, currency
  selection, empty range).

---

## 5. Part 2 — Dashboard (`Customer-Dashboard`)

### 5.1 New server action — `lib/actions/order-actions.tsx`
```ts
export interface VoidsReportParams { fromDate?: string; toDate?: string; status?: OrderStatus | ""; }

export const getVoidsReport = async (
  params?: VoidsReportParams,
): Promise<OrderVoidsResponse> => {
  const location = await getCurrentLocation();
  if (!location?.id) return EMPTY_VOIDS_REPORT;          // { summary: zeros, orders: [] }
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set("fromDate", params.fromDate);
  if (params?.toDate) qs.set("toDate", params.toDate);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();
  const data = await oms().get<OrderVoidsResponse>(`${ordersBase}/voids${query ? `?${query}` : ""}`);
  return parseStringify(data ?? EMPTY_VOIDS_REPORT);
};
```

### 5.2 New types — `types/orders/type.ts` (or `types/reports/voids.ts`)
```ts
export interface VoidReasonTally { reason: VoidReason; count: number; amount: number; }
export interface VoidsSummary {
  totalOrders: number; voidedOrders: number; voidedItems: number;
  voidAmount: number; currency: string | null; reasons: VoidReasonTally[];
}
export interface OrderVoidsResponse { summary: VoidsSummary; orders: Order[]; }
```
`orders` are the existing `Order` type — `OrderResponseDto` already maps to it (the orders
list consumes the same shape). No new row type needed.

Add `VOID_REASON_LABELS: Record<VoidReason, string>` next to the existing status-label maps
(`CUSTOMER_REQUEST → "Customer request"`, etc.) for the "Top reason" KPI.

### 5.3 Per-row helpers — `lib/orders/void-report.ts`
```ts
export const orderVoidedItems = (o: Order) => (o.removedItems ?? []).filter(i => i.voidReason != null);
export const orderVoidAmount  = (o: Order) => orderVoidedItems(o).reduce((s, i) => s + (i.netAmount ?? 0), 0);
export const voidedItemCount  = (o: Order) => orderVoidedItems(o).length;  // line items, matches server COUNT(i)
```

### 5.4 Table — `components/tables/orders/voids-data-table.tsx`
Sibling of `AbandonedDataTable`. Reuses `buildOrdersColumns({ tableMode, staffNames, tableNames })`
and splices in one **Void amount** column immediately before the Status column:
- Two-line cell (mirrors the Paid/Unpaid style): `orderVoidAmount(row.original)` in a "loss"
  tone (amber/rose, bold) on top, `"{voidedItemCount} item(s)"` underneath.
- Keeps `rowClickBasePath="/orders"` → clicking a row opens `/orders/{id}`.
- Same `searchKey="orderNumber"` and status-filter dropdown as the orders table.

### 5.5 Page — `app/(protected)/report/voids/page.tsx` (server component)
- `searchParams`: `search`, `page`, `limit`, `from`, `to` (default range = current month, like
  every other report). No `tab`, no `status` param sent to the endpoint (all statuses).
- Fetch:
  ```ts
  const [report, locationSettings, staffList, tablesList] = await Promise.all([
    getVoidsReport({ fromDate: from, toDate: to }).catch(() => EMPTY_VOIDS_REPORT),
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
  ]);
  ```
- `buildOrderListView({ orders: report.orders, search, page, limit, staff: staffList, tables: tablesList })`
  → `pageData / total / pageCount / staffNames / tableNames` (search + paginate + name-resolve, unchanged).
- `tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT"`.
- `currency = report.summary.currency ?? "TZS"`.
- KPI strip (4 cards) reads **`report.summary`**:
  1. **Voided orders** — `voidedOrders`, delta `"{rate}% of {totalOrders} orders"`.
  2. **Voided items** — `voidedItems`.
  3. **Void amount** — `voidAmount` + currency.
  4. **Top reason** — highest-`count` entry in `reasons`, humanized via `VOID_REASON_LABELS`, with its share.
- Renders `PageShell maxWidth="wide"` + `PageBreadcrumbs [{title:"Voids"}]` + `PageHeader` (title
  "Voids report", date-range subtitle) + `PageBody` containing the KPI strip, `OrdersDateFilter`,
  and the `VoidsDataTable` in a `Card`.
- Empty state: reuse `NoItems` when `report.orders` is empty and no filter is active.
- No realtime bridge (this is a report, not the live ops list).

### 5.6 Menu — `types/menu_items.ts`
Add to the Reports section (after "Refund report"):
```ts
{ title: "Voids report", link: "/report/voids", current: args?.isCurrentItem, icon: "cart" },
```

---

## 6. End-to-end data flow

1. User opens `/report/voids` (optionally with `?from&to&search&page&limit`).
2. Page calls `getVoidsReport` → OMS `GET /api/v1/orders/voids` (location from `RequestContext`).
3. OMS returns `{ summary, orders }` (voided orders only + authoritative totals).
4. Page resolves staff/table names, paginates/searches via `buildOrderListView`, derives the
   KPI strip from `summary`.
5. `VoidsDataTable` renders the page rows with the Void amount column.
6. Clicking a row → `/orders/{id}` → existing order detail screen (Items / Refunds / Timeline
   already surface the voided items and `ORDER_ITEM_VOIDED` events).

## 7. Reuse summary

- **Reused unchanged:** `OrderResponseDto` + `OrderMapper` (OMS); `Order`/`OrderItem`/`VoidReason`
  types, `oms()` client, `buildOrderListView`, `buildOrdersColumns`, `DataTable`, `OrdersDateFilter`,
  `KpiStrip`/`KpiCard`, `PageShell`/`PageHeader`/`PageBreadcrumbs`/`PageBody`, `NoItems`,
  `getLocationSettings`, `fetchAllStaff`, `fetchAllTables`, row-click → `/orders/{id}` (dashboard).
- **New:** OMS endpoint + service + repository queries + response DTOs (+ tests); dashboard action,
  types, `VOID_REASON_LABELS`, `void-report.ts`, `VoidsDataTable`, `/report/voids/page.tsx`, menu entry.

## 8. Trade-offs & risks

- **Full-row payload for voided orders.** Rows reuse `OrderResponseDto` (carries all items), but
  only voided orders are returned — a small subset — so payload is a non-issue and buys trivial
  table reuse.
- **`/voids` vs `/{orderId}` routing.** Mitigated by Spring's literal-over-variable precedence;
  verify with a quick request during implementation.
- **JPA mapping assumptions.** The exact association/field names in the JPQL must be confirmed
  against the real entities.
- **"Voided items" = line items, not units.** Server `COUNT(i)` and the per-row count both mean
  line items. If units (Σ quantity) are wanted instead, change `COUNT(i)` → `SUM(i.quantity)` and
  the helper accordingly.

## 9. Out of scope / future

- Whole-order cancellations and post-payment refunds (refunds already have a report).
- CSV export, per-reason/per-staff drill-down tabs, server-side pagination of the rows.
- A reason or staff filter on the report (the per-reason `reasons` tally is already returned and
  could drive this later).

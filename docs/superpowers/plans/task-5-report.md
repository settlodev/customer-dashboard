# Task 5 Report — Void helpers + VoidsDataTable

**Status:** COMPLETE

## Files created

1. `lib/orders/void-report.ts` — exports `orderVoidedItems`, `orderVoidAmount`, `voidedItemCount`. Predicate mirrors OMS: `removedItems` filtered to those where `voidReason != null`.
2. `components/tables/orders/voids-columns.tsx` — exports `buildVoidsColumns`. Calls `buildOrdersColumns` from `./columns`, then splices the "Void amount" column immediately before the `orderStatus` column (found by `accessorKey === "orderStatus"`; falls back to appending if not found).
3. `components/tables/orders/voids-data-table.tsx` — exports `VoidsDataTable`. Mirrors `AbandonedDataTable` structure exactly; passes `filterKey="orderStatus"` and `filterOptions={VOIDS_FILTER_OPTIONS}` (ABANDONED excluded); `rowClickBasePath="/orders"`.

## Typecheck

Command:
```
"/Users/Peter/Settlo/Customer-Dashboard/node_modules/.bin/tsc" -p "/Users/Peter/Settlo/Customer-Dashboard/tsconfig.json" --noEmit
```
Result: **0 errors** (no output).

## `ORDER_STATUS_FILTER_OPTIONS` export name confirmed

Found at line 608 of `types/orders/type.ts`:
```ts
export const ORDER_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Open", value: OrderStatus.OPEN },
  { label: "Closed", value: OrderStatus.CLOSED },
  { label: "Cancelled", value: OrderStatus.CANCELLED },
  { label: "Abandoned", value: OrderStatus.ABANDONED },
];
```
Export name matches exactly what the plan and `voids-data-table.tsx` import.

## Task 4 pre-existing state

Both `types/orders/type.ts` and `lib/actions/order-actions.tsx` were already updated (Task 4 complete). All types (`VoidReasonTally`, `VoidsSummary`, `OrderVoidsResponse`, `VOID_REASON_LABELS`) and `getVoidsReport` were confirmed in place before starting Task 5.

## Concerns

None. The three files typecheck cleanly and no pre-existing files were modified.

# Task 6 Report — Report page + nav entry

## Status

COMPLETE — typecheck passes with 0 errors.

## Files Created

- `app/(protected)/report/voids/page.tsx` — New server component. Fetches `getVoidsReport`, `getLocationSettings`, `fetchAllStaff`, `fetchAllTables` in parallel. Calls `buildOrderListView` to slice/filter client-side. Renders `PageShell`/`PageBreadcrumbs`/`PageHeader`/`PageBody`, a date filter row, a `KpiStrip` with 4 `KpiCard`s (voided orders, voided items, void amount, top reason), a `Card`-wrapped `VoidsDataTable`, and a `NoItems` empty state.

## Files Modified

- `types/menu_items.ts` — "Voids report" nav entry inserted in the Reports section.

### Exact insertion point in `menu_items.ts`

Inserted immediately after the "Refund report" object (which ends at `link: "/report/refunds"`), before the "Stock report" object. The surrounding context:

```
{ title: "Refund report", link: "/report/refunds", ... },
{ title: "Voids report",  link: "/report/voids",   current: args?.isCurrentItem, icon: "cart" },   ← inserted
{ title: "Stock report",  link: "/report/stock",    ... },
```

## Typecheck

Command:
```
"/Users/Peter/Settlo/Customer-Dashboard/node_modules/.bin/tsc" -p "/Users/Peter/Settlo/Customer-Dashboard/tsconfig.json" --noEmit
```

Result: **0 errors** (no output).

## Concerns

None. All prerequisite types (`VoidReasonTally`, `VOID_REASON_LABELS`, `OrderVoidsResponse`), the action (`getVoidsReport`), and the table component (`VoidsDataTable`) were already in place from Tasks 4–5. The page uses exact imports as specified in the plan and matches the pattern of the other report pages.

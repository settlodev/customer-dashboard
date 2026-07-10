# Dashboard Tax Details: Order Details, Sales Report, Tax Report

**Date:** 2026-07-09
**Status:** Approved design, pending implementation plan
**Repos touched:** Settlo Order Management Service (OMS), Reports Service, Customer-Dashboard

## Problem

An earlier cross-service project (`Settlo Order Management Service/docs/superpowers/specs/2026-07-06-order-item-tax-reporting-design.md`) made OMS compute and record per-line and per-order tax, and gave Reports Service a `GET /api/v2/analytics/orders/tax` endpoint. None of it is visible in the Customer-Dashboard yet, and two gaps block the most direct paths to showing it:

1. **Order Details is tax-blind by construction.** The dashboard's order detail view calls OMS's `GET /orders/{id}/detail`, which returns a separate, purpose-built `OrderDetailResponse`/`OrderItemDetail` pair — hand-cloned from `OrderResponseDto`/`OrderItemResponseDto` before the tax fields existed. The earlier project enriched the latter (used by REST list/create responses and Kafka events); `OrderDetailResponse` never got the mirror.
2. **The Sales report's per-product/category tables don't carry tax**, because they're powered by Reports Service's `item-sales` query family (`TopSellingQueryService`, `CatalogSalesService`), which is a different code path from the `orders/tax` endpoint the earlier project built. Both already scan `fact_order_items` — which already has the tax columns — so this is query-level enrichment, not new infrastructure.
3. **The `orders/tax` endpoint itself was never deployed.** It and its ClickHouse migration (V054) exist only on Reports Service's local `alpha` branch, unpushed.

## Decisions (made with product owner, 2026-07-09)

- **Scope:** all three surfaces — Order Details, Sales report, and a new dedicated Tax report — plus the OMS mirror and Reports Service enrichment/deploy work that unblock them. One project, not split into sub-specs (mirrors how the originating tax feature was scoped across four repos).
- **Order Details:** add the OMS backend mirror (Part A) rather than deferring it — the dashboard UI would otherwise have nothing real to render.
- **Sales report:** tax as a **column** on the existing by-product and by-category tables (not a new tab, not columns on staff/table/department). Staff and table sales aggregate across many products with mixed tax codes, so a single tax number there is less meaningful, and their backing queries don't carry item-level tax dimensions today.
- **Query approach:** enrich `TopSellingQueryService`/`CatalogSalesService` in place (add `sum(tax_amount)` to existing SELECTs) rather than standing up a separate endpoint — both already scan the right table at the right grain.
- **KPI card:** the by-product tab's KPI strip gains a "Tax collected" card alongside Revenue/Items sold/Gross profit/Unique products, since the summary query needs the same one-line addition as the row query.
- **Tax report page:** a single page at `/report/tax` (not tabbed) — KPI strip + a period-by-dimension table with a breakdown toggle (tax code / product), following the voids/sales report template.
- **Deploy:** pushing Reports Service's `alpha` branch is in scope for this project (its `alpha-deploy.yml` triggers automatically on push), since it's what makes the Tax report page and the Sales report tax columns actually work.

## Design

### Part A — Order Details

**OMS (`OrderDetailService.java`):**
- `OrderDetailResponse` gains `taxAmount` (`BigDecimal`), set from `order.getTotalTaxAmount()` alongside the existing financial fields.
- `OrderDetailResponse.OrderItemDetail` gains the same seven fields the earlier project added to `OrderItemResponseDto`: `taxTypeId`, `taxTypeCode`, `taxTypeName`, `taxRate`, `taxInclusive`, `taxableAmount`, `taxAmount` — set from the same `OrderItem` getters in the item-mapping method. No new computation; this is a second DTO catching up to values OMS already has.

**Dashboard:**
- `OrderDetail`/`OrderDetailItem` (`types/orders/type.ts`) gain the matching fields.
- Order-level: a `Tax` row in the Overview tab's Totals `DetailRow` grid (next to Discount) and a matching `KeyVal` in the Payments tab's Money summary, both reading `order.taxAmount`.
- Item-level: a `Tax` column in the items table, between Discount and Net — amount on top, code/rate/mode as a small subtext line (e.g. "180" / "18% · VAT-A · incl." vs "18% · VAT-A · excl.", using `taxInclusive` to pick the suffix). Exempt lines (zero/null `taxAmount`) render "—", consistent with how Discount already handles the no-tax case.

### Part B — Sales report tax columns

**Reports Service (`TopSellingQueryService`):**
- `queryItems`: SELECT gains `sum(tax_amount) AS tax_amount` (summed, like `net_amount`) and `any(tax_code) AS tax_code` (picked, like `item_name`) — same GROUP BY, `fact_order_items` is already at the right grain.
- `querySummary`: SELECT gains `sum(tax_amount) AS total_tax_amount` for the KPI card.
- `TopSellingItem` DTO gains `taxAmount`/`taxCode`; `TopSellingSummary` DTO gains `totalTaxAmount`.

**Reports Service (`CatalogSalesService.getCategoryRollup`):**
- SELECT gains `sum(foi.tax_amount) AS tax_amount`. This inherits the query's existing category fan-out behavior — a product belonging to two categories already double-counts revenue across both rows, and tax follows the same semantics as every other money column here (not a new correctness concern this project introduces).
- `CategorySalesRollupDto` gains `taxAmount`.

**Dashboard:**
- `TopSellingItem`/`TopSellingSummary`/`CategorySalesRollupDto` (dashboard-side types) gain the matching fields.
- `buildTopSellingColumns` and `buildSalesByCategoryColumns` (the TanStack column-def factories in `components/tables/reports/**/columns.tsx`) each gain a `Tax` column after Discount — right-aligned, currency-formatted, same convention as the existing money columns. Zero/null renders "—", matching Part A.
- `by-product-tab.tsx`'s `KpiStrip` gains a fifth card, "Tax collected", reading `summary.totalTaxAmount`.

### Part C — Dedicated Tax report + deploy

**Reports Service deploy:** push `alpha`. `alpha-deploy.yml` triggers on push and deploys automatically — this single push ships both this project's query enrichment (Part B) and the earlier project's `GET /api/v2/analytics/orders/tax` endpoint (built, never deployed).

**Dashboard — new page `/report/tax`** (`app/(protected)/report/tax/page.tsx`), following the voids/sales page template: `requireReportsReadAll()` gate, `OrdersDateFilter`, `PageShell`/`PageHeader`/`PageBreadcrumbs`/`PageBody`.

- **Data:** a new server action calls `ApiClient("reports").get('/api/v2/analytics/orders/tax', { locationId, startDate, endDate, period, breakdown })`. New TS types mirror `OrderTaxReportDto`: `totalTaxableAmount`/`totalTaxAmount` (nullable), `totalsByCurrency[]`, `byTaxCode[]`, `rows[]`.
- **KPI strip:** Total tax and Total taxable. When the range spans more than one currency, the backend returns null scalars by design (see the earlier spec) — the dashboard shows the per-currency split from `totalsByCurrency` instead of a blank dash, so multi-currency reads as "here's the breakdown," not "data missing."
- **Period toggle:** Day / Month, a small pill toggle matching the existing `VoidsTypeToggle` pattern.
- **Breakdown toggle:** "By tax code" (default) / "By product" — same table, columns adapt to the active dimension (Period + Tax code + amounts, or Period + Product + amounts).
- **Table:** a new column-def factory (`components/tables/reports/tax/columns.tsx`) — Period, dimension column, Taxable amount, Tax amount, plus a Currency column when the range spans more than one.

## Rollout order

1. OMS mirror (Part A backend) — independently deployable, no consumers yet, zero risk.
2. Reports Service query enrichment (Part B backend) + push (Part C deploy) — one push, both land live.
3. Dashboard surfaces — each shippable once its backend dependency is live: Order Details UI needs only the OMS deploy; Sales report columns and the Tax report page need only the Reports Service deploy. No cross-surface ordering constraint.

## Testing

- **OMS:** unit test for the `OrderDetailService` mirror, following the pattern of the earlier project's `OrderMapperTaxTest` — construct an `Order`/`OrderItem` with tax fields set, assert they land on `OrderDetailResponse`/`OrderItemDetail`.
- **Reports Service:** query tests for the two enriched queries (`TopSellingQueryService`, `CatalogSalesService`) asserting the new `tax_amount`/`tax_code` values, using the existing Testcontainers ClickHouse harness. The Tax report endpoint itself already has coverage from the earlier project.
- **Dashboard:** no test runner is configured in this repo (checked: no jest/vitest/playwright in `package.json`). Verification is manual — run the dev server, exercise Order Details, the Sales report's product/category tabs, and the new Tax report page against a location with taxed orders, matching this repo's existing convention for UI changes.

## Out of scope

- Tax columns on the Sales report's staff/table/department tabs (declined — those aggregate across mixed tax codes and their queries don't carry item-level tax dimensions today).
- A tax tab inside the Sales report hub (declined in favor of the dedicated Tax report page).
- Refund tax netting in the tax report (carried over from the earlier project's own out-of-scope list — the ledger-based `/ledger/tax` report remains the filing authority).
- Historical backfill into Reports Service tax columns (ingestion is forward-only, established by the earlier project).
- Receipts and public invoices — already correct since the earlier project's `ReceiptSnapshotService` fix; no dashboard change needed.

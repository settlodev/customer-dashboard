# Per-entity Stock & Products (admin entity detail) — Design

**Date:** 2026-06-15
**Status:** Design (approved; pending spec review → writing-plans)
**Repos:** Settlo Inventory Service (new admin endpoint) + Customer-Dashboard (consume + render). No Settlo Common change.
**Context:** The "deferred per-entity data backend phase" from the admin hierarchy rework (`2026-06-15-admin-account-business-entity-hierarchy-design.md` §9). Fills the `EntityDetailView` **Stock & Products** stub with real per-entity data for LOCATION / WAREHOUSE / STORE.

## 1. Goal
Give the admin entity detail pages (`/admin/locations|warehouses|stores/[id]`) a real **Stock & Products** tab — per-entity summary metrics **plus** top lists — scoped to the single location/warehouse/store. Drop the Orders tab for warehouses/stores (orders are location-grained only; see §6).

## 2. Context (verified by exploration)
**Inventory uses a generic per-entity model** — `DestinationType { LOCATION, STORE, WAREHOUSE }` + `locationId` on the core tables, so per-entity aggregation works for ALL three types natively:
- `Product` (`product/model/Product.java`): `(locationType, locationId)`.
- `InventoryBalance` (`inventory/model/InventoryBalance.java`): `(locationType, locationId, stockVariantId)` + `quantityOnHand`, `reserved`, `averageCost`, `lowStockThreshold`, `lastMovementAt`.
- `StockBatch` (`batch/model/StockBatch.java`): `(locationType, locationId, businessId)` + `status`, `quantityOnHand`, `unitCost`, `receivedDate`.

**Existing, reusable:**
- `GET /internal/usage/counts?locationType=&locationId=` → `{products, stockItems}` (X-Internal-Secret). Backed by `ProductRepository.countByLocationTypeAndLocationIdAndDeletedAtIsNull(...)` + `InventoryBalanceRepository.countDistinctActiveVariants(locationType, locationId)`.
- `GET /api/v1/admin/businesses/{businessId}/inventory-summary` (`@PreAuthorize hasAuthority('INTERNAL_internal:accounts:read')`) — business-wide aggregate (`AdminInventoryController` / `AdminInventoryService`). Same authority we'll reuse, but our endpoint is per-entity, not business-wide.
- `ReportingService.getDashboardSummary(locationId)` — rich (value/low/out/over-stock, GRNs, expiring) but LOCATION-only, header-driven (`X-Location-Id`), user-perm (`PERM_inventory_reports:read`), in-memory. Useful as a logic reference, not directly reused (it's not the generic entity model and not admin-auth).

**Inventory build:** Maven, Java 21, testcontainers(Postgres), `settlo-common 0.8.57-ALPHA`, `X-Internal-Secret` filter on `/internal/**`. **Buildable + testable locally.**

**Orders are location-grained only:** `fact_orders` (Reports) and `Order` (Order service) carry **only `location_id`** — no `store_id`/`warehouse_id` anywhere. Reports isn't locally buildable (JDK 25 + ClickHouse). → store orders need a big upstream change; warehouse orders are N/A. (See §6.)

## 3. Decisions (confirmed)
- **Scope = per-entity Stock & Products for all 3 entity types.** Summary metrics **+ top lists**.
- **Orders tab dropped for WAREHOUSE/STORE**; kept (unchanged) for LOCATION.
- **Endpoint = JWT admin on Inventory** (`INTERNAL_internal:accounts:read`) — consistent with the existing admin inventory-summary; the dashboard reaches it with the staff JWT (`ApiClient("inventory","staff")`), no internal-secret channel needed.
- **No Settlo Common change, no new config keys.**

## 4. Backend — Inventory admin per-entity stock endpoint
**Endpoint:** `GET /api/v1/admin/inventory/stock-summary?locationType={LOCATION|WAREHOUSE|STORE}&locationId={uuid}`
- `@PreAuthorize("hasAuthority('INTERNAL_internal:accounts:read')")`. New controller method (extend `AdminInventoryController` or a sibling `@RequestMapping("/api/v1/admin/inventory")` controller — plan decides; keep auth identical).
- Service: a new `AdminEntityStockService` (or extend `AdminInventoryService`) that aggregates over the generic `(locationType, locationId)` model.

**Response DTO `AdminEntityStockSummaryResponse`:**
```
locationType: DestinationType
locationId: UUID
totalStockValue: BigDecimal            // Σ(quantityOnHand × averageCost) over InventoryBalance
totalQuantityOnHand: BigDecimal
productCount: long                     // Product count for the entity
variantCount: long                     // distinct active variants (qty > 0)
lowStockCount: long                    // available (= qtyOnHand − reserved) ≤ lowStockThreshold AND > 0
outOfStockCount: long                  // available ≤ 0
activeBatchCount: long                 // StockBatch status=ACTIVE
lastMovementAt: OffsetDateTime | null  // MAX(InventoryBalance.lastMovementAt)
topProductsByValue: [ { productId: UUID, name: String, stockValue: BigDecimal, quantityOnHand: BigDecimal } ]   // top 5
lowStockItems: [ { variantId: UUID, productName: String, variantName: String, available: BigDecimal, lowStockThreshold: BigDecimal } ]   // top 5 (lowest available first)
```

**Queries:**
- **Reuse:** `ProductRepository.countByLocationTypeAndLocationIdAndDeletedAtIsNull` (productCount); `InventoryBalanceRepository.countDistinctActiveVariants` (variantCount).
- **New (InventoryBalanceRepository):** a single aggregate `@Query` over `(locationType, locationId, deletedAt null)` for `Σ(qtyOnHand×averageCost)`, `Σ qtyOnHand`, low-stock count, out-of-stock count, `MAX(lastMovementAt)`; a top-N-products-by-value `@Query` (group by product, `Pageable`/`LIMIT`); a low-stock-items `@Query` (available ≤ threshold AND > 0, order by available asc, `Pageable`/`LIMIT`).
- **New (StockBatchRepository):** `countByLocationTypeAndLocationIdAndStatusAndDeletedAtIsNull(...)` (activeBatchCount).
- Topmost lists capped at 5 (constant); each list query bounded.

**Currency:** the DTO carries **no currency field** and does **no conversion** — it returns raw `BigDecimal` values. The dashboard renders stock value via `compactNumber` (exactly how the Orders tab already shows `net_sales`/`gross_profit`), so no currency symbol/lookup is needed. (Out of scope; avoids any cross-service currency lookup.)

**Testing:** service-layer mapping with Mockito (mock the repos → assert DTO assembly); the new `@Query`s validated via `@DataJpaTest` + testcontainers (run in CI; the suite already uses testcontainers). Build/test locally with `./mvnw test -Dtest=...`.

## 5. Frontend — Dashboard
- **`components/admin/entity-detail/entity-detail-view.tsx`:**
  - Render the **Orders `TabsTrigger` + `TabsContent` only when `entityType === "LOCATION"`** (warehouses/stores get Subscription + Stock & Products only). `defaultValue="subscription"` stays valid for all.
  - Make the **Stock & Products tab real for all three types**, consuming a new prop `stock: EntityStockSummary | null`: a `MetricGrid` of the summary metrics + two compact tables (`Top products by value`, `Low-stock items`). Graceful empty state when `stock == null` or all-zero (e.g. "No stock recorded for this {entity}."). Keep `compactNumber` formatting.
- **Types:** `types/admin/inventory.ts` (or extend an existing inventory types file) — `EntityStockSummary` matching the backend DTO (+ `TopProductRow`, `LowStockRow`).
- **Action:** `getEntityStockSummary(entityType: "LOCATION"|"WAREHOUSE"|"STORE", entityId: string): Promise<EntityStockSummary | null>` in `lib/actions/admin/inventory.ts` (mirror the existing inventory action used by the business detail, via `ApiClient("inventory","staff")`); returns null on failure (resilient — the tab degrades to the empty state).
- **Routes:** `locations/[id]`, `warehouses/[id]`, `stores/[id]` each fetch `getEntityStockSummary(<TYPE>, id)` (resilient `.catch(()=>null)`) and pass `stock={...}` to `EntityDetailView`. Location's Orders behaviour is unchanged.

## 6. Out of scope / deferred
- **Store orders** — `fact_orders` + `Order` have no `store_id`; would require adding store context to the order pipeline (Order service entity/events) and Reports ingestion (`fact_orders` `store_id` + V049 migration). Large, multi-service, Reports not locally buildable. **Deferred — separate workstream.** Handled now by dropping the Orders tab for stores.
- **Warehouse orders** — N/A (warehouses are storage, not POS). Tab dropped.
- **Per-entity stock for the account tree / business billable-units cards** — out of scope; this design only fills the entity *detail* page's Stock & Products tab.
- **Currency conversion** of stock value — out of scope (raw values).

## 7. Verification
- Inventory: `./mvnw test -Dtest=...` (service Mockito tests locally; query tests via testcontainers — locally or CI).
- Dashboard: `npx tsc --noEmit` + `npm run lint` on touched files; no test runner (staging-validate live).
- Stage only touched files in each repo; the user's WIP stays untouched (dashboard: the known WIP files; accounts: the MAX_STAFF WIP — not this repo, but the discipline holds).

## 8. Deploy
- Redeploy **Inventory** (new admin endpoint) + **Customer-Dashboard**. **No Settlo Common publish, no new config keys** (the endpoint is JWT admin; inventory already trusts the platform JWT for `INTERNAL_*` authorities).

## 9. Build order (for the plan)
1. Inventory endpoint (backend) — independently shippable + locally testable.
2. Dashboard types + action.
3. EntityDetailView (conditional Orders tab + real Stock tab).
4. Wire the 3 routes to fetch + pass `stock`.

# Per-entity Stock & Products — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Fill the admin `EntityDetailView` **Stock & Products** tab with real per-entity data (summary metrics + top-items-by-value + low-stock lists) for LOCATION/WAREHOUSE/STORE, via a new Inventory admin endpoint; and drop the Orders tab for warehouses/stores.

**Architecture:** Inventory adds `GET /api/v1/admin/inventory/stock-summary?locationType=&locationId=` (JWT `INTERNAL_internal:accounts:read`), computed **in-memory** by reusing `InventoryBalanceRepository.findAllByLocationId` + mirroring `ReportingService.getDashboardSummary`'s value/low/out logic (so numbers match the existing location dashboard) + one new derived StockBatch count. Dashboard adds an action/types, makes the Stock tab real, and wires the 3 routes. No Settlo Common change, no new config keys.

**Spec:** `docs/superpowers/specs/2026-06-15-per-entity-stock-products-design.md`.

---

## Execution Notes
- Inventory repo (`/Users/Peter/Settlo/Settlo Inventory Service`): Maven, Java 21, `settlo-common 0.8.57-ALPHA` (already in `~/.m2`), testcontainers(Postgres). **Buildable/testable locally.** Branch: its current working branch. **Stage ONLY each task's files** (never `-A`); preserve any user WIP.
- Dashboard (`/Users/Peter/Settlo/Customer-Dashboard`, branch `alpha`): **Stage ONLY each task's files.** Untouched user WIP that must stay unstaged: `app/(admin)/admin/packages/[id]/page.tsx`, `components/admin/catalog/package-detail/comparison-chart.tsx`, `components/billing/invoice-view-dialog.tsx`, `lib/actions/staff-actions.tsx`. Verify `npx tsc --noEmit` + `npm run lint`. No test runner.
- nushell resets cwd per command → prefix with `cd "<repo>" &&`.
- **Numbers must match the existing location dashboard:** mirror `ReportingService.getDashboardSummary` exactly — `available = quantityOnHand - reservedQuantity`; out-of-stock = `available <= 0`; low-stock = `available > 0 && lowStockThreshold != null && available <= lowStockThreshold`; value = `Σ(quantityOnHand × coalesce(averageCost,0))` over rows with `quantityOnHand > 0`.

---

## Task 1: Inventory — per-entity admin stock-summary endpoint

**Files (in `/Users/Peter/Settlo/Settlo Inventory Service`):**
- Create: `admin/dto/AdminEntityStockSummaryResponse.java`
- Modify: `batch/repository/StockBatchRepository.java`
- Create: `admin/service/AdminEntityStockService.java`
- Create: `admin/controller/AdminEntityStockController.java`
- Test: `src/test/java/co/tz/settlo/inventory/admin/service/AdminEntityStockServiceTest.java`

- [ ] **Step 1 — response DTO.** Create `admin/dto/AdminEntityStockSummaryResponse.java` (mirror `AdminBusinessInventorySummaryResponse` Lombok style):
```java
package co.tz.settlo.inventory.admin.dto;

import co.tz.settlo.inventory.common.enums.DestinationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** Per-entity (location/warehouse/store) stock & products summary for the admin entity detail page. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEntityStockSummaryResponse {
    private DestinationType locationType;
    private UUID locationId;
    private BigDecimal totalStockValue;      // Σ(quantityOnHand × averageCost) over in-stock variants
    private BigDecimal totalQuantityOnHand;
    private long productCount;
    private long variantCount;               // distinct variants currently in stock (qtyOnHand > 0)
    private long lowStockCount;
    private long outOfStockCount;
    private long activeBatchCount;
    private OffsetDateTime lastMovementAt;
    private List<TopStockItemRow> topItemsByValue;   // up to 5
    private List<LowStockItemRow> lowStockItems;     // up to 5

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopStockItemRow {
        private UUID variantId;
        private String name;
        private BigDecimal quantityOnHand;
        private BigDecimal stockValue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class LowStockItemRow {
        private UUID variantId;
        private String name;
        private BigDecimal available;
        private BigDecimal lowStockThreshold;
    }
}
```

- [ ] **Step 2 — StockBatch active-count query.** In `batch/repository/StockBatchRepository.java`, add a derived query (StockBatch has `locationType`, `locationId`, `status`, `deletedAt`):
```java
long countByLocationTypeAndLocationIdAndStatusAndDeletedAtIsNull(
        co.tz.settlo.inventory.common.enums.DestinationType locationType,
        java.util.UUID locationId,
        co.tz.settlo.inventory.batch.enums.BatchStatus status);
```
(Use existing imports if `DestinationType`/`BatchStatus`/`UUID` are already imported; otherwise fully-qualify as shown.)

- [ ] **Step 3 — service.** Create `admin/service/AdminEntityStockService.java`. Inject `InventoryBalanceRepository`, `ProductRepository`, `StockBatchRepository`. Reuse `findAllByLocationId(locationId)` (its `@EntityGraph` loads `stockVariant` + `stockVariant.stock`, so `getStockVariant().getDisplayName()` is available; `locationId` is globally unique per entity so type-filtering the balances isn't needed). Mirror `ReportingService` math:
```java
package co.tz.settlo.inventory.admin.service;

import co.tz.settlo.inventory.admin.dto.AdminEntityStockSummaryResponse;
import co.tz.settlo.inventory.admin.dto.AdminEntityStockSummaryResponse.LowStockItemRow;
import co.tz.settlo.inventory.admin.dto.AdminEntityStockSummaryResponse.TopStockItemRow;
import co.tz.settlo.inventory.batch.enums.BatchStatus;
import co.tz.settlo.inventory.batch.repository.StockBatchRepository;
import co.tz.settlo.inventory.common.enums.DestinationType;
import co.tz.settlo.inventory.inventory.model.InventoryBalance;
import co.tz.settlo.inventory.inventory.repository.InventoryBalanceRepository;
import co.tz.settlo.inventory.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminEntityStockService {

    private static final int TOP_N = 5;

    private final InventoryBalanceRepository balanceRepository;
    private final ProductRepository productRepository;
    private final StockBatchRepository stockBatchRepository;

    @Transactional(readOnly = true)
    public AdminEntityStockSummaryResponse summariseEntity(DestinationType locationType, UUID locationId) {
        List<InventoryBalance> balances = balanceRepository.findAllByLocationId(locationId).stream()
                .filter(b -> b.getDeletedAt() == null)
                .toList();

        BigDecimal totalValue = BigDecimal.ZERO;
        BigDecimal totalQty = BigDecimal.ZERO;
        long variantsInStock = 0;
        long lowStock = 0;
        long outOfStock = 0;
        OffsetDateTime lastMovement = null;

        for (InventoryBalance b : balances) {
            BigDecimal onHand = b.getQuantityOnHand();
            BigDecimal available = onHand.subtract(b.getReservedQuantity());
            totalQty = totalQty.add(onHand);
            if (onHand.compareTo(BigDecimal.ZERO) > 0) {
                variantsInStock++;
                BigDecimal avgCost = b.getAverageCost() != null ? b.getAverageCost() : BigDecimal.ZERO;
                totalValue = totalValue.add(onHand.multiply(avgCost));
            }
            if (available.compareTo(BigDecimal.ZERO) <= 0) {
                outOfStock++;
            } else if (b.getLowStockThreshold() != null
                    && available.compareTo(b.getLowStockThreshold()) <= 0) {
                lowStock++;
            }
            if (b.getLastMovementAt() != null
                    && (lastMovement == null || b.getLastMovementAt().isAfter(lastMovement))) {
                lastMovement = b.getLastMovementAt();
            }
        }

        long productCount = productRepository
                .countByLocationTypeAndLocationIdAndDeletedAtIsNull(locationType, locationId);
        long activeBatchCount = stockBatchRepository
                .countByLocationTypeAndLocationIdAndStatusAndDeletedAtIsNull(locationType, locationId, BatchStatus.ACTIVE);

        List<TopStockItemRow> topItems = balances.stream()
                .filter(b -> b.getQuantityOnHand().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(AdminEntityStockService::valueOf).reversed())
                .limit(TOP_N)
                .map(b -> TopStockItemRow.builder()
                        .variantId(b.getStockVariant().getId())
                        .name(b.getStockVariant().getDisplayName())
                        .quantityOnHand(b.getQuantityOnHand())
                        .stockValue(valueOf(b))
                        .build())
                .toList();

        List<LowStockItemRow> lowItems = balances.stream()
                .filter(b -> {
                    BigDecimal available = b.getQuantityOnHand().subtract(b.getReservedQuantity());
                    return available.compareTo(BigDecimal.ZERO) > 0
                            && b.getLowStockThreshold() != null
                            && available.compareTo(b.getLowStockThreshold()) <= 0;
                })
                .sorted(Comparator.comparing(b -> b.getQuantityOnHand().subtract(b.getReservedQuantity())))
                .limit(TOP_N)
                .map(b -> LowStockItemRow.builder()
                        .variantId(b.getStockVariant().getId())
                        .name(b.getStockVariant().getDisplayName())
                        .available(b.getQuantityOnHand().subtract(b.getReservedQuantity()))
                        .lowStockThreshold(b.getLowStockThreshold())
                        .build())
                .toList();

        return AdminEntityStockSummaryResponse.builder()
                .locationType(locationType)
                .locationId(locationId)
                .totalStockValue(totalValue)
                .totalQuantityOnHand(totalQty)
                .productCount(productCount)
                .variantCount(variantsInStock)
                .lowStockCount(lowStock)
                .outOfStockCount(outOfStock)
                .activeBatchCount(activeBatchCount)
                .lastMovementAt(lastMovement)
                .topItemsByValue(topItems)
                .lowStockItems(lowItems)
                .build();
    }

    private static BigDecimal valueOf(InventoryBalance b) {
        BigDecimal avgCost = b.getAverageCost() != null ? b.getAverageCost() : BigDecimal.ZERO;
        return b.getQuantityOnHand().multiply(avgCost);
    }
}
```
> Verify `InventoryBalance` getters: `getQuantityOnHand()`, `getReservedQuantity()`, `getAverageCost()`, `getLowStockThreshold()`, `getLastMovementAt()`, `getStockVariant()`, `getDeletedAt()` (BaseEntity); `StockVariant.getId()` + `getDisplayName()`. All confirmed present.

- [ ] **Step 4 — controller.** Create `admin/controller/AdminEntityStockController.java`:
```java
package co.tz.settlo.inventory.admin.controller;

import co.tz.settlo.inventory.admin.dto.AdminEntityStockSummaryResponse;
import co.tz.settlo.inventory.admin.service.AdminEntityStockService;
import co.tz.settlo.inventory.common.enums.DestinationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@RequiredArgsConstructor
@Slf4j
public class AdminEntityStockController {

    private final AdminEntityStockService adminEntityStockService;

    @GetMapping("/stock-summary")
    @PreAuthorize("hasAuthority('INTERNAL_internal:accounts:read')")
    public ResponseEntity<AdminEntityStockSummaryResponse> getEntityStockSummary(
            @RequestParam DestinationType locationType,
            @RequestParam UUID locationId) {
        log.info("Admin entity stock summary requested for {} {}", locationType, locationId);
        return ResponseEntity.ok(adminEntityStockService.summariseEntity(locationType, locationId));
    }
}
```
(Spring binds the `locationType` query string to the `DestinationType` enum by name — `?locationType=WAREHOUSE`.)

- [ ] **Step 5 — service unit test.** Create `admin/service/AdminEntityStockServiceTest.java` (Mockito; mirror an existing `@ExtendWith(MockitoExtension.class)` service test). Mock the 3 repos. Build 2-3 `InventoryBalance` objects with a `StockVariant` set (via setters: `setStockVariant`, `setQuantityOnHand`, `setReservedQuantity`, `setAverageCost`, `setLowStockThreshold`, `setLastMovementAt`; StockVariant `setId`(? BaseEntity id may need reflection or a setter) / `setDisplayName`). `when(balanceRepository.findAllByLocationId(id)).thenReturn(list)`, stub the two count methods. Assert: `totalStockValue`, `lowStockCount`, `outOfStockCount`, `variantCount`, `topItemsByValue` ordering (highest value first), `lowStockItems` (only the low ones, ascending available). If setting `StockVariant.id` (BaseEntity) is awkward, use a spy/`ReflectionTestUtils.setField(variant, "id", uuid)` or construct via the test fixtures used elsewhere — match the repo's existing test idiom.
  Run: `cd "/Users/Peter/Settlo/Settlo Inventory Service" && ./mvnw -q -Dtest=AdminEntityStockServiceTest test 2>&1 | tail -40` → must pass. If Maven can't resolve a dep, report verbatim but still commit.

- [ ] **Step 6 — commit** the 5 files:
  `cd "/Users/Peter/Settlo/Settlo Inventory Service" && git add admin/dto/AdminEntityStockSummaryResponse.java batch/repository/StockBatchRepository.java admin/service/AdminEntityStockService.java admin/controller/AdminEntityStockController.java src/test/.../AdminEntityStockServiceTest.java && git commit -m "feat(inventory): admin per-entity stock summary endpoint"` (use real `src/main/java/...` paths).

---

## Task 2: Dashboard — types + action

**Files (in `/Users/Peter/Settlo/Customer-Dashboard`):**
- Create: `types/admin/inventory.ts`
- Modify: `lib/actions/admin/business-operations.ts`

- [ ] **Step 1 — types.** Create `types/admin/inventory.ts` (match the Java DTO; BigDecimal→`number`, OffsetDateTime→`string`):
```ts
export type EntityType = "LOCATION" | "WAREHOUSE" | "STORE";

export interface TopStockItemRow {
  variantId: string;
  name: string;
  quantityOnHand: number;
  stockValue: number;
}

export interface LowStockItemRow {
  variantId: string;
  name: string;
  available: number;
  lowStockThreshold: number;
}

export interface EntityStockSummary {
  locationType: EntityType;
  locationId: string;
  totalStockValue: number;
  totalQuantityOnHand: number;
  productCount: number;
  variantCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeBatchCount: number;
  lastMovementAt: string | null;
  topItemsByValue: TopStockItemRow[];
  lowStockItems: LowStockItemRow[];
}
```
> If the existing `AdminBusinessInventorySummary` (`types/admin/business-operations.ts`) types `totalStockValue` as `string`, match that convention instead (check it; numbers from Jackson BigDecimal are usually JSON numbers → `number`).

- [ ] **Step 2 — action.** In `lib/actions/admin/business-operations.ts`, add (reusing the existing `inventoryClient()` + `parseStringify`):
```ts
export async function getEntityStockSummary(
  entityType: EntityType,
  entityId: string,
): Promise<EntityStockSummary> {
  const data = await inventoryClient().get<EntityStockSummary>(
    `/api/v1/admin/inventory/stock-summary?locationType=${entityType}&locationId=${entityId}`,
  );
  return parseStringify(data);
}
```
Add `import type { EntityStockSummary, EntityType } from "@/types/admin/inventory";` to the file.

- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean.
  `git add types/admin/inventory.ts lib/actions/admin/business-operations.ts && git commit -m "feat(admin): entity stock summary action + types"`

---

## Task 3: Dashboard — EntityDetailView (conditional Orders + real Stock tab)

**File:** Modify `components/admin/entity-detail/entity-detail-view.tsx`.

- [ ] **Step 1 — prop + imports.** Add `stock: EntityStockSummary | null;` to `EntityDetailViewProps` and destructure `stock`. Add `import type { EntityStockSummary } from "@/types/admin/inventory";`. (`MetricGrid`/`MetricCell`/`SectionCard`/`compactNumber`/`formatDate` are already imported.)

- [ ] **Step 2 — Orders tab → LOCATION-only.** Wrap BOTH the Orders `TabsTrigger` and the Orders `TabsContent` so they render only for locations:
  - In `<TabsList>`: `{entityType === "LOCATION" && <TabsTrigger value="orders">Orders</TabsTrigger>}`.
  - The entire `<TabsContent value="orders">…</TabsContent>` block: wrap as `{entityType === "LOCATION" && ( <TabsContent value="orders" …>…</TabsContent> )}`. Inside, you can now drop the `entityType !== "LOCATION"` stub branch (it's unreachable) — keep the `ordersRow == null ? … : <MetricGrid…>` logic.

- [ ] **Step 3 — Stock & Products tab → real.** Replace the stub `<TabsContent value="stock">…</TabsContent>` (the `<SectionCard stub …>` block) with real rendering from `stock`:
```tsx
        {/* ── Tab 3: Stock & Products ───────────────────────────────────── */}
        <TabsContent value="stock" className="space-y-4">
          {!stock ||
          (stock.productCount === 0 &&
            stock.variantCount === 0 &&
            stock.totalStockValue === 0) ? (
            <SectionCard title="Stock &amp; Products">
              <p className="text-sm text-muted-foreground">
                No stock recorded for this {entityLabel}.
              </p>
            </SectionCard>
          ) : (
            <>
              <SectionCard title="Stock &amp; Products">
                <MetricGrid cols={4}>
                  <MetricCell label="Products" value={formatMoney(stock.productCount)} />
                  <MetricCell label="Stock items" value={formatMoney(stock.variantCount)} />
                  <MetricCell label="Stock value" value={compactNumber(stock.totalStockValue)} />
                  <MetricCell label="Qty on hand" value={compactNumber(stock.totalQuantityOnHand)} />
                  <MetricCell label="Low stock" value={formatMoney(stock.lowStockCount)} small />
                  <MetricCell label="Out of stock" value={formatMoney(stock.outOfStockCount)} small />
                  <MetricCell label="Active batches" value={formatMoney(stock.activeBatchCount)} small />
                  <MetricCell
                    label="Last movement"
                    value={stock.lastMovementAt ? formatDate(stock.lastMovementAt) : "—"}
                    small
                  />
                </MetricGrid>
              </SectionCard>

              <SectionCard title="Top items by value">
                {stock.topItemsByValue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items in stock.</p>
                ) : (
                  <div className="flex flex-col">
                    {stock.topItemsByValue.map((row) => (
                      <div
                        key={row.variantId}
                        className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{row.name}</div>
                        <div className="flex-shrink-0 font-mono text-[11px] text-muted-foreground">
                          {compactNumber(row.quantityOnHand)} on hand
                        </div>
                        <div className="w-24 flex-shrink-0 text-right font-mono text-[12.5px] font-semibold text-ink">
                          {compactNumber(row.stockValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Low-stock items">
                {stock.lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No low-stock items.</p>
                ) : (
                  <div className="flex flex-col">
                    {stock.lowStockItems.map((row) => (
                      <div
                        key={row.variantId}
                        className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{row.name}</div>
                        <div className="flex-shrink-0 font-mono text-[11px] text-warn">
                          {compactNumber(row.available)} left
                        </div>
                        <div className="w-24 flex-shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                          ≤ {compactNumber(row.lowStockThreshold)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </>
          )}
        </TabsContent>
```

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean.
  `git add components/admin/entity-detail/entity-detail-view.tsx && git commit -m "feat(admin): real per-entity Stock & Products tab; Orders tab location-only"`

---

## Task 4: Dashboard — wire the 3 routes to fetch + pass `stock`

**Files:** `app/(admin)/admin/locations/[id]/page.tsx`, `app/(admin)/admin/warehouses/[id]/page.tsx`, `app/(admin)/admin/stores/[id]/page.tsx`.

- [ ] **Step 1 — location route.** In `locations/[id]/page.tsx`: import `getEntityStockSummary` from `@/lib/actions/admin/business-operations`. Add a resilient fetch and pass it. The route already does `Promise.allSettled([...subscription, breakdown])` — add the stock fetch. Simplest: after the existing fetches, add `const stock = await getEntityStockSummary("LOCATION", id).catch(() => null);` and add `stock={stock}` to `<EntityDetailView … />`. (Or add it as a third entry in the `Promise.allSettled` array + `value(results[2])` — match the file's style.)

- [ ] **Step 2 — warehouse route.** In `warehouses/[id]/page.tsx`: `const stock = await getEntityStockSummary("WAREHOUSE", id).catch(() => null);` and pass `stock={stock}` to `<EntityDetailView entityType="WAREHOUSE" … />`. (Import the action.)

- [ ] **Step 3 — store route.** In `stores/[id]/page.tsx`: `const stock = await getEntityStockSummary("STORE", id).catch(() => null);` and pass `stock={stock}`. (Import the action.)

- [ ] **Step 4 — verify + commit.** `npx tsc --noEmit` clean + `npm run lint` on the 3 routes + EntityDetailView.
  `git add "app/(admin)/admin/locations/[id]/page.tsx" "app/(admin)/admin/warehouses/[id]/page.tsx" "app/(admin)/admin/stores/[id]/page.tsx" && git commit -m "feat(admin): wire per-entity stock summary into location/warehouse/store detail pages"`

---

## Final review & finishing
- [ ] **Inventory:** `./mvnw -q -Dtest=AdminEntityStockServiceTest test` green (or env-blocked, noted). **Dashboard:** `npx tsc --noEmit` clean + `npm run lint`.
- [ ] **Opus holistic** over the full diff (2 repos). Checkpoints: the service mirrors `ReportingService` math exactly (available/low/out/value) so per-entity numbers match the location dashboard; endpoint `@PreAuthorize INTERNAL_internal:accounts:read` + enum-bound `locationType`; reuses `findAllByLocationId` (+ deletedAt filter) and the existing product-count/new batch-count; top/low lists bounded to 5, names from `StockVariant.displayName`; dashboard types match the DTO; Orders tab renders only for LOCATION (trigger + content both gated; defaultValue still "subscription"); Stock tab real for all 3 with a graceful empty state; routes fetch resiliently (`.catch(()=>null)`) and pass `stock`; only intended files committed (WIP preserved both repos); no Settlo Common change, no new config keys.
- [ ] **Report:** done → per-entity Stock & Products live for all 3 entity types; Orders tab now location-only. Deploy = redeploy inventory + dashboard (no Common publish, no config keys). Note store-orders remain deferred (needs store_id upstream).

## Self-review (author checklist)
- **Spec coverage:** inventory endpoint (T1) ✓; dashboard types/action (T2) ✓; EntityDetailView conditional Orders + real Stock (T3) ✓; route wiring (T4) ✓; store-orders deferred ✓.
- **Numbers match:** service mirrors `ReportingService.getDashboardSummary` (available/out/low/value) verbatim.
- **Reuse:** `findAllByLocationId` (+@EntityGraph for names), `countByLocationTypeAndLocationIdAndDeletedAtIsNull` (product), `inventoryClient()`; one new derived query (batch count); no new SQL.
- **Type consistency:** `EntityStockSummary` ↔ `AdminEntityStockSummaryResponse`; `EntityType` = LOCATION|WAREHOUSE|STORE.
- **WIP preservation:** specific-file staging in both repos.

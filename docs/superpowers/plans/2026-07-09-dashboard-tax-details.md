# Dashboard Tax Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the tax data OMS already computes (per-line and per-order) across three dashboard surfaces — Order Details, the Sales report's product/category tabs, and a new dedicated Tax report — by mirroring tax fields onto a second OMS DTO, enriching two Reports Service queries, deploying that work, and building the dashboard UI.

**Architecture:** Three repos in strict order — OMS gets a small, additive DTO mirror (no new computation, just exposing values `Order`/`OrderItem` already carry); Reports Service enriches two existing ClickHouse query services (`TopSellingQueryService`, `CatalogSalesService`) that already scan the right fact table, then pushes `alpha` (auto-deploys, and also finally ships the already-built-but-unpushed `orders/tax` endpoint from an earlier project); Dashboard adds UI across three independent surfaces, each gated only by its own backend dependency.

**Tech Stack:** Java 21 / Spring Boot (OMS, Reports Service), ClickHouse + JDBC (Reports Service), Next.js App Router + TypeScript + TanStack Table (Dashboard).

## Global Constraints

- Spec: `Customer-Dashboard/docs/superpowers/specs/2026-07-09-dashboard-tax-details-design.md`. Prior related spec/plan (context only, already shipped): `Settlo Order Management Service/docs/superpowers/specs/2026-07-06-order-item-tax-reporting-design.md`.
- Repo paths: OMS `/Users/Peter/Settlo/Settlo Order Management Service` (`./mvnw`, branch `alpha`); Reports Service `/Users/Peter/Settlo/Reports Service` (`./mvnw`, branch `alpha`, Docker required for Testcontainers ClickHouse); Customer-Dashboard `/Users/Peter/Settlo/Customer-Dashboard` (Next.js, branch `alpha`, no test runner — verification is manual via `yarn dev`).
- **OMS working tree has one pre-existing, unrelated modified file:** `src/main/java/co/tz/settlo/order_management/common/config/ServiceReadyPublisher.java`. Do not stage or touch it. Stage explicit file paths only, never `git add -A`/`git add .`, in every repo.
- Money columns: OMS Postgres already has `NUMERIC(19,2)` tax columns on `orders`/`order_items` (no migration needed — this plan only reads existing columns). ClickHouse `fact_order_items.tax_amount`/`tax_code` and `fact_orders` money columns already exist (from the earlier project) — this plan only adds `sum(tax_amount)`/`any(tax_code)` to existing SELECTs, no new migration.
- Field-name contract (verbatim, matches OMS's `OrderItem`/`Order` entities and the earlier project's DTOs): `taxTypeId`, `taxTypeCode`, `taxTypeName`, `taxRate`, `taxInclusive`, `taxableAmount`, `taxAmount`.
- Commit style: Conventional Commits (`feat(scope): …`), body ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Dashboard's `docs/` directory is caught by the user's global `~/.gitignore_global` (blanket-ignores any path named `docs`) even though this repo's own history tracks `docs/superpowers/**`. Any commit touching files under `docs/` in the Customer-Dashboard repo needs `git add -f`.

---

## Task 1: OMS — mirror tax fields onto OrderDetailResponse

**Files:**
- Modify: `src/main/java/co/tz/settlo/order_management/order/dto/OrderDetailResponse.java`
- Modify: `src/main/java/co/tz/settlo/order_management/order/service/OrderDetailService.java`
- Test: `src/test/java/co/tz/settlo/order_management/order/service/OrderDetailServiceTaxTest.java` (create)

**Interfaces:**
- Consumes: `Order.getTotalTaxAmount()`, `OrderItem.getTaxTypeId/getTaxTypeCode/getTaxTypeName/getTaxRate/getTaxInclusive/getTaxableAmount/getTaxAmount()` (all already exist, unchanged by this task).
- Produces: `OrderDetailResponse.taxAmount` (`BigDecimal`); `OrderDetailResponse.OrderItemDetail.taxTypeId/taxTypeCode/taxTypeName/taxRate/taxInclusive/taxableAmount/taxAmount`. Dashboard Task 5 consumes these exact field names verbatim (they serialize to the same JSON keys).

- [ ] **Step 1: Write the failing test**

Create `OrderDetailServiceTaxTest.java`:

```java
package co.tz.settlo.order_management.order.service;

import co.tz.settlo.order_management.order.dto.OrderDetailResponse;
import co.tz.settlo.order_management.order.model.Order;
import co.tz.settlo.order_management.order.model.OrderItem;
import co.tz.settlo.order_management.order.repository.OrderCostRepository;
import co.tz.settlo.order_management.order.repository.OrderEventRepository;
import co.tz.settlo.order_management.order.repository.OrderItemRefundRepository;
import co.tz.settlo.order_management.order.repository.OrderRepository;
import co.tz.settlo.order_management.order_transaction.repository.OrderTransactionRepository;
import co.tz.settlo.order_management.reference.repository.CustomerReferenceRepository;
import co.tz.settlo.order_management.reference.repository.StaffReferenceRepository;
import co.tz.settlo.order_management.reference.service.ReferenceService;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pins the tax surfacing contract on OrderDetailResponse — a separate DTO
 * from OrderResponseDto/OrderItemResponseDto (OrderMapperTaxTest covers
 * those), hand-cloned before the tax engine existed and never mirrored.
 * The dashboard's order detail view is the only caller of this path.
 */
class OrderDetailServiceTaxTest {

    private final OrderRepository orderRepository = mock(OrderRepository.class);
    private final OrderCostRepository orderCostRepository = mock(OrderCostRepository.class);
    private final OrderTransactionRepository orderTransactionRepository = mock(OrderTransactionRepository.class);
    private final OrderItemRefundRepository orderItemRefundRepository = mock(OrderItemRefundRepository.class);
    private final OrderEventRepository orderEventRepository = mock(OrderEventRepository.class);
    private final StaffReferenceRepository staffReferenceRepository = mock(StaffReferenceRepository.class);
    private final CustomerReferenceRepository customerReferenceRepository = mock(CustomerReferenceRepository.class);
    private final ReferenceService referenceService = mock(ReferenceService.class);

    private final OrderDetailService service = new OrderDetailService(
            orderRepository,
            orderCostRepository,
            orderTransactionRepository,
            orderItemRefundRepository,
            orderEventRepository,
            staffReferenceRepository,
            customerReferenceRepository,
            referenceService);

    @Test
    void orderDetailCarriesOrderAndItemTaxSnapshot() {
        UUID orderId = UUID.randomUUID();
        UUID taxTypeId = UUID.randomUUID();

        OrderItem item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setName("Burger");
        item.setQuantity(BigDecimal.ONE);
        item.setUnitPrice(new BigDecimal("1180.00"));
        item.setNetAmount(new BigDecimal("1180.00"));
        item.setRemoved(false);
        item.setTaxTypeId(taxTypeId);
        item.setTaxTypeCode("A");
        item.setTaxTypeName("Standard Rate VAT 18%");
        item.setTaxRate(new BigDecimal("18.0000"));
        item.setTaxInclusive(true);
        item.setTaxableAmount(new BigDecimal("1000.00"));
        item.setTaxAmount(new BigDecimal("180.00"));

        Order order = new Order();
        order.setId(orderId);
        order.setNetAmount(new BigDecimal("1180.00"));
        order.setPaidAmount(new BigDecimal("1180.00"));
        order.setTotalTaxAmount(new BigDecimal("180.00"));
        order.setItems(List.of(item));

        when(orderRepository.findByIdAndDeletedAtIsNull(orderId)).thenReturn(Optional.of(order));
        when(orderCostRepository.findByOrderIdAndDeletedAtIsNull(orderId)).thenReturn(List.of());
        when(orderTransactionRepository.findAllByOrderIdAndDeletedAtIsNull(orderId)).thenReturn(List.of());
        when(orderItemRefundRepository.findAllByOrderIdAndDeletedAtIsNull(orderId)).thenReturn(List.of());
        when(orderEventRepository.findAllByOrderIdOrderByCreatedAtDesc(orderId)).thenReturn(List.of());

        OrderDetailResponse detail = service.getOrderDetail(orderId);

        assertThat(detail.getTaxAmount()).isEqualByComparingTo("180.00");
        assertThat(detail.getItems()).hasSize(1);
        OrderDetailResponse.OrderItemDetail itemDetail = detail.getItems().get(0);
        assertThat(itemDetail.getTaxTypeId()).isEqualTo(taxTypeId);
        assertThat(itemDetail.getTaxTypeCode()).isEqualTo("A");
        assertThat(itemDetail.getTaxTypeName()).isEqualTo("Standard Rate VAT 18%");
        assertThat(itemDetail.getTaxRate()).isEqualByComparingTo("18.0000");
        assertThat(itemDetail.getTaxInclusive()).isTrue();
        assertThat(itemDetail.getTaxableAmount()).isEqualByComparingTo("1000.00");
        assertThat(itemDetail.getTaxAmount()).isEqualByComparingTo("180.00");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/Peter/Settlo/Settlo Order Management Service" && ./mvnw -q -Dtest=OrderDetailServiceTaxTest test`
Expected: FAIL — `detail.getTaxAmount()` and the item tax getters don't exist yet (compile error), or once stubbed, assertions fail with null actual values.

- [ ] **Step 3: Add the field to OrderDetailResponse**

In `OrderDetailResponse.java`, add to the top-level class immediately after `private BigDecimal totalTipAmount;`:

```java
    private BigDecimal taxAmount;
```

Add to the nested `OrderItemDetail` static class immediately after `private BigDecimal netAmount;`:

```java
        private UUID taxTypeId;
        private String taxTypeCode;
        private String taxTypeName;
        private BigDecimal taxRate;
        private Boolean taxInclusive;
        private BigDecimal taxableAmount;
        private BigDecimal taxAmount;
```

- [ ] **Step 4: Wire the values in OrderDetailService**

In `OrderDetailService.java`, in the `// Financial` block of `buildDetail` (immediately after `.totalTipAmount(order.getTotalTipAmount())`, before the blank line that precedes `// Cost & profit`), add:

```java
                .taxAmount(order.getTotalTaxAmount())
```

In `toItemDetail` (immediately after `.netAmount(item.getNetAmount())`, before `.preparationStatus(...)`), add:

```java
                .taxTypeId(item.getTaxTypeId())
                .taxTypeCode(item.getTaxTypeCode())
                .taxTypeName(item.getTaxTypeName())
                .taxRate(item.getTaxRate())
                .taxInclusive(item.getTaxInclusive())
                .taxableAmount(item.getTaxableAmount())
                .taxAmount(item.getTaxAmount())
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd "/Users/Peter/Settlo/Settlo Order Management Service" && ./mvnw -q -Dtest=OrderDetailServiceTaxTest test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
cd "/Users/Peter/Settlo/Settlo Order Management Service" && git add src/main/java/co/tz/settlo/order_management/order/dto/OrderDetailResponse.java src/main/java/co/tz/settlo/order_management/order/service/OrderDetailService.java src/test/java/co/tz/settlo/order_management/order/service/OrderDetailServiceTaxTest.java && git commit -m "feat(order): mirror tax fields onto OrderDetailResponse for the dashboard order-detail view

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 2: Reports Service — tax in TopSellingQueryService (by-product)

**Files:**
- Modify: `src/main/java/co/tz/settlo/analytics/itemsales/service/TopSellingQueryService.java`
- Modify: `src/main/java/co/tz/settlo/analytics/itemsales/dto/TopSellingItem.java`
- Modify: `src/main/java/co/tz/settlo/analytics/itemsales/dto/TopSellingSummary.java`
- Test: `src/test/java/co/tz/settlo/analytics/itemsales/TopSellingTaxTest.java` (create)

**Interfaces:**
- Consumes: `fact_order_items.tax_amount` (`Decimal(19,2)`), `fact_order_items.tax_code` (`Nullable(String)`) — both already exist. `OrderIngestionService`/`OrderFactRepository` (unchanged) already populate them per order item.
- Produces: `TopSellingItem.taxAmount` (`BigDecimal`), `TopSellingItem.taxCode` (`String`, nullable); `TopSellingSummary.totalTaxAmount` (`BigDecimal`). Dashboard Task 6 consumes these exact field names.

- [ ] **Step 1: Write the failing test**

Create `TopSellingTaxTest.java`:

```java
package co.tz.settlo.analytics.itemsales;

import co.tz.settlo.analytics.AbstractIntegrationTest;
import co.tz.settlo.analytics.infrastructure.kafka.buffer.EventBufferManager;
import co.tz.settlo.analytics.itemsales.dto.TopSellingItem;
import co.tz.settlo.analytics.itemsales.dto.TopSellingProductsResponse;
import co.tz.settlo.analytics.itemsales.dto.TopSellingSortBy;
import co.tz.settlo.analytics.itemsales.service.TopSellingQueryService;
import co.tz.settlo.analytics.orders.service.OrderIngestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins tax propagation into the "top selling products" report: the item
 * row's tax total/code and the period summary's total tax must reflect
 * fact_order_items.tax_amount/tax_code, which OrderIngestionService
 * already populates from the OMS item payload.
 */
class TopSellingTaxTest extends AbstractIntegrationTest {

    @Autowired private OrderIngestionService orderIngestionService;
    @Autowired private EventBufferManager eventBufferManager;
    @Autowired private TopSellingQueryService topSellingQueryService;

    @Test
    void topSellingItemAndSummaryCarryTax() {
        UUID locationId = UUID.randomUUID();
        UUID businessId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        LocalDate day = LocalDate.of(2026, 7, 9);

        Map<String, Object> item = new HashMap<>();
        item.put("id", UUID.randomUUID().toString());
        item.put("productId", productId.toString());
        item.put("productVariantId", UUID.randomUUID().toString());
        item.put("name", "Burger");
        item.put("quantity", "1");
        item.put("unitPrice", "1180");
        item.put("originalUnitPrice", "1180");
        item.put("netAmount", "1180");
        item.put("taxTypeCode", "A");
        item.put("taxAmount", "180.00");

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", UUID.randomUUID().toString());
        payload.put("orderNumber", "ORD-TAX-TS-1");
        payload.put("businessId", businessId.toString());
        payload.put("locationId", locationId.toString());
        payload.put("businessDate", day.toString());
        payload.put("orderStatus", "CLOSED");
        payload.put("paymentStatus", "PAID");
        payload.put("grossAmount", "1180");
        payload.put("netAmount", "1180");
        payload.put("taxAmount", "180.00");
        payload.put("items", List.of(item));

        orderIngestionService.processOrderEvent("ORDER_CLOSED", payload);
        eventBufferManager.getOrCreate("fact_orders", "", (ps, r) -> {}).flush();
        eventBufferManager.getOrCreate("fact_order_items", "", (ps, r) -> {}).flush();

        TopSellingProductsResponse report = topSellingQueryService.getTopSelling(
                locationId, day, day, TopSellingSortBy.REVENUE, 10, false);

        assertThat(report.getItems()).hasSize(1);
        TopSellingItem topItem = report.getItems().get(0);
        assertThat(topItem.getTaxAmount()).isEqualByComparingTo("180.00");
        assertThat(topItem.getTaxCode()).isEqualTo("A");
        assertThat(report.getSummary().getTotalTaxAmount()).isEqualByComparingTo("180.00");
    }
}
```

(If `TopSellingProductsResponse.getSummary()` or `getItems()` differ from this, they mirror `TopSellingSummary`/`List<TopSellingItem>` fields already read on the class — no other changes needed.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/Peter/Settlo/Reports Service" && ./mvnw -q -Dtest=TopSellingTaxTest test`
Expected: FAIL to compile (`getTaxAmount()`/`getTaxCode()`/`getTotalTaxAmount()` don't exist yet).

- [ ] **Step 3: Add the DTO fields**

In `TopSellingItem.java`, add immediately after `private BigDecimal discountAmount;`:

```java
    private BigDecimal taxAmount;
    /** TRA EFD code (e.g. "A" = Standard 18%). Null = exempt/unclassified. */
    private String taxCode;
```

In `TopSellingSummary.java`, add immediately after `private BigDecimal totalGrossProfit;`:

```java
    private BigDecimal totalTaxAmount;
```

- [ ] **Step 4: Enrich queryItems**

In `TopSellingQueryService.java`, in the `queryItems` SQL text block, add two lines to the SELECT list immediately after `sum(discount_amount)      AS discount_amount,`:

```java
                    sum(tax_amount)           AS tax_amount,
                    any(tax_code)             AS tax_code,
```

In the row-mapper builder immediately after `.discountAmount(decimal(rs, "discount_amount"))`, add:

```java
                        .taxAmount(decimal(rs, "tax_amount"))
                        .taxCode(rs.getString("tax_code"))
```

- [ ] **Step 5: Enrich querySummary**

In the `querySummary` SQL text block, add immediately after `sum(gross_profit)                            AS total_gross_profit,`:

```java
                    sum(tax_amount)                               AS total_tax_amount,
```

In its row-mapper builder immediately after `.totalGrossProfit(decimal(rs, "total_gross_profit"))`, add:

```java
                        .totalTaxAmount(decimal(rs, "total_tax_amount"))
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd "/Users/Peter/Settlo/Reports Service" && ./mvnw -q -Dtest=TopSellingTaxTest test`
Expected: PASS (Docker required).

- [ ] **Step 7: Commit**

```bash
cd "/Users/Peter/Settlo/Reports Service" && git add src/main/java/co/tz/settlo/analytics/itemsales/service/TopSellingQueryService.java src/main/java/co/tz/settlo/analytics/itemsales/dto/TopSellingItem.java src/main/java/co/tz/settlo/analytics/itemsales/dto/TopSellingSummary.java src/test/java/co/tz/settlo/analytics/itemsales/TopSellingTaxTest.java && git commit -m "feat(analytics): tax amount/code in the top-selling-products report

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 3: Reports Service — tax in CatalogSalesService (by-category)

**Files:**
- Modify: `src/main/java/co/tz/settlo/analytics/itemsales/service/CatalogSalesService.java`
- Modify: `src/main/java/co/tz/settlo/analytics/itemsales/dto/CategorySalesRollupDto.java`
- Test: `src/test/java/co/tz/settlo/analytics/itemsales/CatalogSalesTaxTest.java` (create)

**Interfaces:**
- Consumes: `fact_order_items.tax_amount` (already exists); `dim_product.categories` (existing JSON-array dimension column, unchanged by this task — the test populates it directly since no other test in this repo exercises the category-rollup path yet).
- Produces: `CategorySalesRollupDto.taxAmount` (`BigDecimal`). Dashboard Task 7 consumes this exact field name.

- [ ] **Step 1: Write the failing test**

Create `CatalogSalesTaxTest.java`:

```java
package co.tz.settlo.analytics.itemsales;

import co.tz.settlo.analytics.AbstractIntegrationTest;
import co.tz.settlo.analytics.infrastructure.kafka.buffer.EventBufferManager;
import co.tz.settlo.analytics.itemsales.dto.CategorySalesRollupDto;
import co.tz.settlo.analytics.itemsales.dto.CategorySalesRollupResponse;
import co.tz.settlo.analytics.itemsales.service.CatalogSalesService;
import co.tz.settlo.analytics.orders.service.OrderIngestionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins tax propagation into the "sales by category" rollup. Category
 * identity comes from dim_product.categories (a JSON array), which no
 * other test in this package populates yet — this test inserts a
 * minimal dim_product row directly (matches the V001 schema) so the
 * ARRAY JOIN in getCategoryRollup has something to fan out over.
 */
class CatalogSalesTaxTest extends AbstractIntegrationTest {

    @Autowired private OrderIngestionService orderIngestionService;
    @Autowired private EventBufferManager eventBufferManager;
    @Autowired private CatalogSalesService catalogSalesService;

    @Test
    void categoryRollupCarriesTax() {
        UUID locationId = UUID.randomUUID();
        UUID businessId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        LocalDate day = LocalDate.of(2026, 7, 9);

        jdbcTemplate.update(
                "INSERT INTO dim_product "
                        + "(id, location_id, name, categories, updated_at, ver) "
                        + "VALUES (?, ?, ?, ?, now64(3, 'Africa/Nairobi'), 1)",
                productId.toString(), locationId.toString(), "Burger",
                "[{\"id\":\"" + categoryId + "\",\"name\":\"Mains\"}]");

        Map<String, Object> item = new HashMap<>();
        item.put("id", UUID.randomUUID().toString());
        item.put("productId", productId.toString());
        item.put("productVariantId", UUID.randomUUID().toString());
        item.put("name", "Burger");
        item.put("quantity", "1");
        item.put("unitPrice", "1180");
        item.put("originalUnitPrice", "1180");
        item.put("netAmount", "1180");
        item.put("taxAmount", "180.00");

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", UUID.randomUUID().toString());
        payload.put("orderNumber", "ORD-TAX-CAT-1");
        payload.put("businessId", businessId.toString());
        payload.put("locationId", locationId.toString());
        payload.put("businessDate", day.toString());
        payload.put("orderStatus", "CLOSED");
        payload.put("paymentStatus", "PAID");
        payload.put("grossAmount", "1180");
        payload.put("netAmount", "1180");
        payload.put("taxAmount", "180.00");
        payload.put("items", List.of(item));

        orderIngestionService.processOrderEvent("ORDER_CLOSED", payload);
        eventBufferManager.getOrCreate("fact_orders", "", (ps, r) -> {}).flush();
        eventBufferManager.getOrCreate("fact_order_items", "", (ps, r) -> {}).flush();

        CategorySalesRollupResponse rollup = catalogSalesService.getCategoryRollup(locationId, day, day);

        assertThat(rollup.getCategories()).hasSize(1);
        CategorySalesRollupDto category = rollup.getCategories().get(0);
        assertThat(category.getCategoryId()).isEqualTo(categoryId);
        assertThat(category.getTaxAmount()).isEqualByComparingTo("180.00");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/Peter/Settlo/Reports Service" && ./mvnw -q -Dtest=CatalogSalesTaxTest test`
Expected: FAIL to compile (`getTaxAmount()` doesn't exist on `CategorySalesRollupDto` yet).

- [ ] **Step 3: Add the DTO field**

In `CategorySalesRollupDto.java`, add immediately after `private BigDecimal grossProfit;`:

```java
    private BigDecimal taxAmount;
```

- [ ] **Step 4: Enrich the category rollup query**

In `CatalogSalesService.getCategoryRollup`, add to the SELECT list immediately after `sum(foi.gross_profit) AS gross_profit,`:

```java
                    sum(foi.tax_amount)   AS tax_amount,
```

In its row-mapper builder immediately after `.grossProfit(decimal(rs, "gross_profit"))`, add:

```java
                        .taxAmount(decimal(rs, "tax_amount"))
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd "/Users/Peter/Settlo/Reports Service" && ./mvnw -q -Dtest=CatalogSalesTaxTest test`
Expected: PASS.

- [ ] **Step 6: Regression check on the neighboring department rollup**

`CatalogSalesService` also backs "by department" from the same file — confirm it still compiles and passes untouched:

Run: `cd "/Users/Peter/Settlo/Reports Service" && ./mvnw -q -Dtest='TopSellingTaxTest,CatalogSalesTaxTest' test`
Expected: PASS, both classes.

- [ ] **Step 7: Commit**

```bash
cd "/Users/Peter/Settlo/Reports Service" && git add src/main/java/co/tz/settlo/analytics/itemsales/service/CatalogSalesService.java src/main/java/co/tz/settlo/analytics/itemsales/dto/CategorySalesRollupDto.java src/test/java/co/tz/settlo/analytics/itemsales/CatalogSalesTaxTest.java && git commit -m "feat(analytics): tax amount in the sales-by-category rollup

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 4: Reports Service — push alpha (deploy)

**Files:** none (git operation only).

**Interfaces:**
- Consumes: Tasks 2–3 commits, plus the already-committed-but-unpushed `GET /api/v2/analytics/orders/tax` endpoint and V054 migration from the earlier tax-reporting project.
- Produces: a live Reports Service `alpha` deployment carrying all of the above. Dashboard Tasks 6, 7, and 8 need this live to be manually verified end-to-end.

- [ ] **Step 1: Confirm local commits are ready**

Run: `cd "/Users/Peter/Settlo/Reports Service" && git status --short && git log --oneline origin/alpha..HEAD`
Expected: clean working tree; the log lists Task 2's and Task 3's commits plus the earlier project's unpushed `orders/tax` commits.

- [ ] **Step 2: Push**

```bash
cd "/Users/Peter/Settlo/Reports Service" && git push
```

- [ ] **Step 3: Confirm the deploy workflow fired**

Run: `cd "/Users/Peter/Settlo/Reports Service" && gh run list --branch alpha --limit 3`
Expected: a run for `alpha-deploy.yml` triggered by the just-pushed commit, status `in_progress` or `completed`/`success`. If `gh` isn't authenticated, note the push succeeded and move on — Task 6-8's manual verification will confirm the endpoint is actually live.

---

## Task 5: Dashboard — Order Details tax UI

**Files:**
- Modify: `types/orders/type.ts`
- Modify: `app/(protected)/orders/[id]/order-detail-view.tsx`

**Interfaces:**
- Consumes: `OrderDetailResponse.taxAmount` and `OrderItemDetail`'s seven tax fields (Task 1), returned verbatim by OMS's `GET /orders/{id}/detail` and read as-is by `getOrderDetail` (`lib/actions/order-actions.tsx:224-228`, a raw JSON cast — no action-file change needed).
- Produces: nothing consumed elsewhere in this plan (leaf UI task).

- [ ] **Step 1: Add the type fields**

In `types/orders/type.ts`, add to `OrderDetailItem` immediately after `netAmount: number | null;`:

```typescript
  taxTypeId: string | null;
  taxTypeCode: string | null;
  taxTypeName: string | null;
  taxRate: number | null;
  taxInclusive: boolean | null;
  taxableAmount: number | null;
  taxAmount: number | null;
```

Add to `OrderDetail` immediately after `totalTipAmount: number | null;`:

```typescript
  taxAmount: number | null;
```

- [ ] **Step 2: Add the order-level Tax row (Overview tab Totals grid)**

In `order-detail-view.tsx`, in the Totals `DetailRow` grid, add immediately after the `Discount` `DetailRow` (after its closing `/>`, before the `Customer charges` row):

```tsx
            <DetailRow
              label="Tax"
              value={
                order.taxAmount && order.taxAmount > 0
                  ? formatNumber(order.taxAmount)
                  : "—"
              }
            />
```

- [ ] **Step 3: Add the order-level Tax row (Payments tab Money summary)**

In the same file, in the Payments tab's `KeyVal` list, add immediately after the `Discount` `KeyVal`:

```tsx
            <KeyVal
              label="Tax"
              value={
                order.taxAmount && order.taxAmount > 0
                  ? formatNumber(order.taxAmount)
                  : "—"
              }
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
```

(`Receipt` is already imported in this file — used by the `Gross` `KeyVal` a few lines above.)

- [ ] **Step 4: Add the item-level Tax column**

In the items table (the function rendering the `Item/Qty/Unit/Discount/Net/Prep` header row), add a `<th>` immediately after the `Discount` header:

```tsx
            <th className="px-3 py-2 text-right font-medium">Tax</th>
```

Add the matching `<td>` immediately after the Discount `<td>` in the row body:

```tsx
              <td className="px-3 py-2.5 text-right tabular-nums">
                {item.taxAmount && item.taxAmount > 0 ? (
                  <div className="flex flex-col items-end">
                    <span>{formatNumber(item.taxAmount)}</span>
                    {(item.taxRate || item.taxTypeCode) && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.taxRate ? `${formatNumber(item.taxRate, 0)}%` : ""}
                        {item.taxTypeCode ? ` · ${item.taxTypeCode}` : ""}
                        {item.taxInclusive === true
                          ? " · incl."
                          : item.taxInclusive === false
                            ? " · excl."
                            : ""}
                      </span>
                    )}
                  </div>
                ) : (
                  "—"
                )}
              </td>
```

- [ ] **Step 5: Manual verification**

Run: `cd "/Users/Peter/Settlo/Customer-Dashboard" && yarn dev`
Navigate to an order detail page (`/orders/{id}`) for an order placed after the OMS deploy from Task 1 (order must have taxable items). Confirm: the Overview tab's Totals grid shows a `Tax` row with a non-dash value; the Payments tab's Money summary shows the same; the items table shows a `Tax` column with amount + rate/code/mode subtext for taxed lines, and "—" for exempt lines. Confirm an order predating the OMS deploy (or with no taxed items) shows "—" everywhere without erroring.

- [ ] **Step 6: Commit**

```bash
cd "/Users/Peter/Settlo/Customer-Dashboard" && git add types/orders/type.ts "app/(protected)/orders/[id]/order-detail-view.tsx" && git commit -m "feat(orders): show tax on the order detail page

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 6: Dashboard — Sales report tax column + KPI (by-product)

**Files:**
- Modify: `types/reports/top-selling.ts`
- Modify: `components/tables/reports/top-selling/columns.tsx`
- Modify: `app/(protected)/report/sales/_tabs/by-product-tab.tsx`

**Interfaces:**
- Consumes: `TopSellingItem.taxAmount/taxCode`, `TopSellingSummary.totalTaxAmount` (Task 2), returned verbatim by `listTopSellingProducts` (`lib/actions/product-actions.tsx:742-768`, a raw `parseStringify` passthrough — no action-file change needed).
- Produces: nothing consumed elsewhere in this plan (leaf UI task).

- [ ] **Step 1: Add the type fields**

In `types/reports/top-selling.ts`, add to `TopSellingItem` immediately after `private discountAmount` equivalent — i.e. after the `discountAmount: number;` line in the `// ── Money ──` block:

```typescript
  taxAmount: number;
  /** TRA EFD code (e.g. "A" = Standard 18%). Null = exempt/unclassified. */
  taxCode: string | null;
```

Add to `TopSellingSummary` immediately after `totalGrossProfit: number;`:

```typescript
  totalTaxAmount: number;
```

- [ ] **Step 2: Add the Tax column**

In `components/tables/reports/top-selling/columns.tsx`, add a new column definition to the array returned by `buildTopSellingColumns`, immediately after the `revenue` column definition (its closing `},`) and before the `grossProfit` column definition:

```tsx
    {
      accessorKey: "taxAmount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="text-left p-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tax
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        if (!item.taxAmount || item.taxAmount <= 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col tabular-nums">
            <span className="font-medium">{formatNum(item.taxAmount)}</span>
            {item.taxCode && (
              <span className="text-[11px] text-muted-foreground">
                {item.taxCode}
              </span>
            )}
          </div>
        );
      },
    },
```

- [ ] **Step 3: Add the KPI card**

In `by-product-tab.tsx`, add a fifth `KpiCard` to the `KpiStrip` (which is currently `cols={4}` — change to `cols={5}`), immediately after the `Gross profit` card:

```tsx
        <KpiCard
          icon={<Receipt className="h-3 w-3" />}
          label="Tax collected"
          value={
            summary?.totalTaxAmount && summary.totalTaxAmount > 0
              ? formatMoney(summary.totalTaxAmount)
              : "—"
          }
          unit={
            summary?.totalTaxAmount && summary.totalTaxAmount > 0
              ? currency
              : undefined
          }
        />
```

Add `Receipt` to the existing `lucide-react` import at the top of the file (`import { CircleDollarSign, Layers, Package, Receipt, TrendingUp } from "lucide-react";`).

- [ ] **Step 4: Manual verification**

Run: `cd "/Users/Peter/Settlo/Customer-Dashboard" && yarn dev`
Navigate to `/report/sales?tab=product` for a period containing taxed orders (post-deploy). Confirm: the KPI strip shows 5 cards including "Tax collected" with a real value; the table has a `Tax` column with amount + code for taxed products, "—" for exempt ones; sorting by the Tax column works.

- [ ] **Step 5: Commit**

```bash
cd "/Users/Peter/Settlo/Customer-Dashboard" && git add types/reports/top-selling.ts components/tables/reports/top-selling/columns.tsx "app/(protected)/report/sales/_tabs/by-product-tab.tsx" && git commit -m "feat(reports): tax column + KPI on the sales-by-product report

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 7: Dashboard — Sales report tax column (by-category)

**Files:**
- Modify: `types/item-sales/type.ts`
- Modify: `lib/actions/category-sales-actions.ts`
- Modify: `components/tables/reports/sales-by-category/columns.tsx`
- Modify: `app/(protected)/report/sales/_tabs/by-category-tab.tsx`

**Interfaces:**
- Consumes: `CategorySalesRollupDto.taxAmount` (Task 3), returned as JSON by Reports Service's `/api/v2/analytics/item-sales/categories`.
- Produces: nothing consumed elsewhere in this plan (leaf UI task).

Unlike Task 6's by-product path (a raw passthrough), this action explicitly re-maps every field through a `num()` defaulting helper — the new field must be threaded through by hand or it silently drops.

- [ ] **Step 1: Add the backend-facing type field**

In `types/item-sales/type.ts`, add to `CategorySalesRollup` immediately after `grossProfit: number;`:

```typescript
  taxAmount: number;
```

- [ ] **Step 2: Thread the field through the server action**

In `lib/actions/category-sales-actions.ts`, in `getCategorySalesRollup`'s row-mapping (`categories: (data?.categories ?? []).map((r) => ({ ... }))`), add immediately after `grossProfit: num(r.grossProfit),`:

```typescript
        taxAmount: num(r.taxAmount),
```

- [ ] **Step 3: Add the dashboard-side row field and column**

In `components/tables/reports/sales-by-category/columns.tsx`, add to the `CategorySalesRow` interface immediately after `profit: number;`:

```typescript
  tax: number;
```

Add a new column definition to the array returned by `buildSalesByCategoryColumns`, immediately after the `net` column definition and before the `profit` column definition:

```tsx
    {
      accessorKey: "tax",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tax
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const tax = row.original.tax;
        if (!tax || tax <= 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-col tabular-nums">
            <span>{formatNum(tax)}</span>
            <span className="text-[11px] text-muted-foreground">{currency}</span>
          </div>
        );
      },
    },
```

- [ ] **Step 4: Map the field in the tab component**

In `by-category-tab.tsx`, in the `rows: CategorySalesRow[]` mapping, add immediately after `profit: c.grossProfit,`:

```typescript
    tax: c.taxAmount,
```

- [ ] **Step 5: Manual verification**

Run: `cd "/Users/Peter/Settlo/Customer-Dashboard" && yarn dev`
Navigate to `/report/sales?tab=category` for a period containing taxed orders. Confirm the table shows a `Tax` column with real values for categories containing taxed products, "—" otherwise, and sorting works.

- [ ] **Step 6: Commit**

```bash
cd "/Users/Peter/Settlo/Customer-Dashboard" && git add types/item-sales/type.ts lib/actions/category-sales-actions.ts components/tables/reports/sales-by-category/columns.tsx "app/(protected)/report/sales/_tabs/by-category-tab.tsx" && git commit -m "feat(reports): tax column on the sales-by-category report

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Task 8: Dashboard — dedicated Tax report page

**Files:**
- Create: `types/reports/tax.ts`
- Create: `lib/actions/tax-report-actions.ts`
- Create: `components/reports/tax/tax-report-period-toggle.tsx`
- Create: `components/reports/tax/tax-report-breakdown-toggle.tsx`
- Create: `components/tables/reports/tax/columns.tsx`
- Create: `components/reports/tax/tax-report-table.tsx`
- Create: `app/(protected)/report/tax/page.tsx`
- Modify: `types/menu_items.ts`
- Modify: `lib/reports-access.ts`

**Interfaces:**
- Consumes: `GET /api/v2/analytics/orders/tax` (built and — after Task 4 — deployed by an earlier project), returning `{ locationId, startDate, endDate, period, breakdown, totalTaxableAmount, totalTaxAmount, totalsByCurrency: [{currency,taxableAmount,taxAmount}], byTaxCode: [{taxCode,taxName,currency,taxableAmount,taxAmount}], rows: [{period,productId?,productName?,taxCode?,taxName?,currency,taxableAmount,taxAmount}] }` (field names verbatim from `OrderTaxReportDto` in the Reports Service repo).
- Produces: nothing consumed elsewhere in this plan (final task).

- [ ] **Step 1: Add the report types**

Create `types/reports/tax.ts`:

```typescript
export interface TaxReportCurrencyTotal {
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReportCodeSummary {
  taxCode: string;
  taxName: string | null;
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReportRow {
  period: string; // yyyy-MM-dd
  productId: string | null;
  productName: string | null;
  taxCode: string | null;
  taxName: string | null;
  currency: string;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxReport {
  locationId: string;
  startDate: string;
  endDate: string;
  period: "day" | "month";
  breakdown: "product" | "taxCode" | null;
  /** Null when the range spans more than one currency — read totalsByCurrency. */
  totalTaxableAmount: number | null;
  totalTaxAmount: number | null;
  totalsByCurrency: TaxReportCurrencyTotal[];
  byTaxCode: TaxReportCodeSummary[];
  rows: TaxReportRow[];
}

export type TaxReportPeriod = "day" | "month";
export type TaxReportBreakdown = "taxCode" | "product";
```

- [ ] **Step 2: Add the server action**

Create `lib/actions/tax-report-actions.ts`:

```typescript
"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { parseStringify } from "@/lib/utils";
import type { TaxReport, TaxReportBreakdown, TaxReportPeriod } from "@/types/reports/tax";

const EMPTY: TaxReport = {
  locationId: "",
  startDate: "",
  endDate: "",
  period: "day",
  breakdown: null,
  totalTaxableAmount: 0,
  totalTaxAmount: 0,
  totalsByCurrency: [],
  byTaxCode: [],
  rows: [],
};

/**
 * Sales-tax report: totals + per-tax-code split + period rows, optionally
 * broken down by product. Sourced from Reports Service's order facts —
 * tax on sales as charged (see the endpoint's own doc for the ledger-based
 * filing report this does not replace).
 */
export async function getTaxReport(
  startDate: string,
  endDate: string,
  period: TaxReportPeriod = "day",
  breakdown?: TaxReportBreakdown,
): Promise<TaxReport> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return EMPTY;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<TaxReport>(`/api/v2/analytics/orders/tax`, {
      params: {
        locationId: location.id,
        startDate,
        endDate,
        period,
        breakdown,
      },
    });
    return parseStringify(data ?? EMPTY);
  } catch (error) {
    console.error("[getTaxReport] request failed", error);
    return EMPTY;
  }
}
```

- [ ] **Step 3: Add the period toggle**

Create `components/reports/tax/tax-report-period-toggle.tsx`:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaxReportPeriod } from "@/types/reports/tax";

interface Props {
  active: TaxReportPeriod;
}

const OPTIONS: Array<{ value: TaxReportPeriod; label: string }> = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
];

/** URL-driven day/month toggle for the tax report — mirrors VoidsTypeToggle. */
export function TaxReportPeriodToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: TaxReportPeriod) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("period", next);
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn("h-8 text-[12.5px]", isActive ? "" : "border-dashed")}
            onClick={() => apply(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add the breakdown toggle**

Create `components/reports/tax/tax-report-breakdown-toggle.tsx`:

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaxReportBreakdown } from "@/types/reports/tax";

interface Props {
  active: TaxReportBreakdown;
}

const OPTIONS: Array<{ value: TaxReportBreakdown; label: string }> = [
  { value: "taxCode", label: "By tax code" },
  { value: "product", label: "By product" },
];

/** URL-driven breakdown toggle for the tax report table's grouping dimension. */
export function TaxReportBreakdownToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: TaxReportBreakdown) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("breakdown", next);
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn("h-8 text-[12.5px]", isActive ? "" : "border-dashed")}
            onClick={() => apply(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Add the table columns**

Create `components/tables/reports/tax/columns.tsx`:

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import type { TaxReportBreakdown, TaxReportRow } from "@/types/reports/tax";

const formatNum = (value: number | null | undefined, max = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return Intl.NumberFormat("en", { maximumFractionDigits: max }).format(value);
};

interface BuildColumnsOptions {
  breakdown: TaxReportBreakdown;
  multiCurrency: boolean;
}

export function buildTaxReportColumns({
  breakdown,
  multiCurrency,
}: BuildColumnsOptions): ColumnDef<TaxReportRow>[] {
  const columns: ColumnDef<TaxReportRow>[] = [
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => {
        const value = row.original.period;
        const date = new Date(value);
        return Number.isNaN(date.getTime())
          ? value
          : format(date, "MMM d, yyyy");
      },
    },
    breakdown === "product"
      ? {
          accessorKey: "productName",
          header: "Product",
          cell: ({ row }) =>
            row.original.productName ?? (
              <span className="text-muted-foreground">Unassigned</span>
            ),
        }
      : {
          accessorKey: "taxCode",
          header: "Tax code",
          cell: ({ row }) => {
            const code = row.original.taxCode;
            const name = row.original.taxName;
            if (!code) {
              return <span className="text-muted-foreground">Unclassified/exempt</span>;
            }
            return (
              <div className="flex flex-col">
                <span className="font-medium">{code}</span>
                {name && (
                  <span className="text-[11px] text-muted-foreground">{name}</span>
                )}
              </div>
            );
          },
        },
    {
      accessorKey: "taxableAmount",
      header: "Taxable amount",
      cell: ({ row }) => (
        <span className="tabular-nums">{formatNum(row.original.taxableAmount)}</span>
      ),
    },
    {
      accessorKey: "taxAmount",
      header: "Tax amount",
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {formatNum(row.original.taxAmount)}
        </span>
      ),
    },
  ];

  if (multiCurrency) {
    columns.push({
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => row.original.currency,
    });
  }

  return columns;
}
```

- [ ] **Step 6: Add the table wrapper**

Create `components/reports/tax/tax-report-table.tsx`:

```tsx
"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { buildTaxReportColumns } from "@/components/tables/reports/tax/columns";
import type { TaxReportBreakdown, TaxReportRow } from "@/types/reports/tax";

interface Props {
  data: TaxReportRow[];
  breakdown: TaxReportBreakdown;
  multiCurrency: boolean;
}

/** Client wrapper around the data-table for the tax report rows. */
export function TaxReportTable({ data, breakdown, multiCurrency }: Props) {
  const columns = useMemo(
    () => buildTaxReportColumns({ breakdown, multiCurrency }),
    [breakdown, multiCurrency],
  );

  return (
    <Card>
      <CardContent className="px-2 pt-6 sm:px-6">
        <DataTable columns={columns} data={data} searchKey="productName" clientMode />
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Add the page**

Create `app/(protected)/report/tax/page.tsx`:

```tsx
import { endOfMonth, format, startOfMonth } from "date-fns";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { requireReportsReadAll } from "@/lib/auth-utils";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { TaxReportPeriodToggle } from "@/components/reports/tax/tax-report-period-toggle";
import { TaxReportBreakdownToggle } from "@/components/reports/tax/tax-report-breakdown-toggle";
import { TaxReportTable } from "@/components/reports/tax/tax-report-table";
import { getTaxReport } from "@/lib/actions/tax-report-actions";
import type { TaxReportBreakdown, TaxReportPeriod } from "@/types/reports/tax";

type Params = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    period?: string;
    breakdown?: string;
  }>;
};

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

export default async function TaxReportPage({ searchParams }: Params) {
  const resolved = await searchParams;
  await requireReportsReadAll();

  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");
  const period: TaxReportPeriod = resolved.period === "month" ? "month" : "day";
  const breakdown: TaxReportBreakdown =
    resolved.breakdown === "product" ? "product" : "taxCode";

  const report = await getTaxReport(from, to, period, breakdown);

  const subtitle =
    from === to
      ? `Tax on ${format(new Date(from), "MMM d, yyyy")}`
      : `Tax ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  const multiCurrency = report.totalsByCurrency.length > 1;
  const hasData = report.rows.length > 0;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Tax" }]} />
      <PageHeader title="Tax report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <TaxReportPeriodToggle active={period} />
            <TaxReportBreakdownToggle active={breakdown} />
          </div>
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasData ? (
          <>
            {multiCurrency ? (
              <KpiStrip
                cols={
                  Math.min(report.totalsByCurrency.length, 6) as 2 | 3 | 4 | 5 | 6
                }
              >
                {report.totalsByCurrency.map((c) => (
                  <KpiCard
                    key={c.currency}
                    label={`Tax collected (${c.currency})`}
                    value={formatMoney(c.taxAmount)}
                    unit={c.currency}
                    delta={`${formatMoney(c.taxableAmount)} taxable`}
                    deltaTone="neutral"
                  />
                ))}
              </KpiStrip>
            ) : (
              <KpiStrip cols={2}>
                <KpiCard
                  label="Tax collected"
                  value={
                    report.totalTaxAmount !== null
                      ? formatMoney(report.totalTaxAmount)
                      : "—"
                  }
                  unit={report.totalsByCurrency[0]?.currency}
                />
                <KpiCard
                  label="Taxable amount"
                  value={
                    report.totalTaxableAmount !== null
                      ? formatMoney(report.totalTaxableAmount)
                      : "—"
                  }
                  unit={report.totalsByCurrency[0]?.currency}
                />
              </KpiStrip>
            )}

            <TaxReportTable
              data={report.rows}
              breakdown={breakdown}
              multiCurrency={multiCurrency}
            />
          </>
        ) : (
          <NoItems itemName="taxed sales for this period" />
        )}
      </PageBody>
    </PageShell>
  );
}
```

- [ ] **Step 8: Register the nav link and permission gate**

In `types/menu_items.ts`, add a new entry immediately after the `Voids report` entry:

```typescript
        {
          title: "Tax report",
          link: "/report/tax",
          current: args?.isCurrentItem,
          icon: "cart",
        },
```

In `lib/reports-access.ts`, add `"/report/tax"` to `LOCATION_WIDE_REPORT_LINKS`, immediately after `"/report/voids",`:

```typescript
  "/report/tax",
```

- [ ] **Step 9: Manual verification**

Run: `cd "/Users/Peter/Settlo/Customer-Dashboard" && yarn dev`
Navigate to `/report/tax` for a period with taxed orders. Confirm: the page loads under the "Tax report" nav link; the day/month and by-tax-code/by-product toggles rewrite the URL and reload the table with the right columns; the KPI strip shows totals for a single-currency location, or a per-currency card set for a multi-currency one; an empty period shows the `NoItems` state, not an error. Confirm a `reports:read_own`-only user (if one is available to test with) doesn't see the nav link and is blocked at the page.

- [ ] **Step 10: Commit**

```bash
cd "/Users/Peter/Settlo/Customer-Dashboard" && git add types/reports/tax.ts lib/actions/tax-report-actions.ts components/reports/tax/tax-report-period-toggle.tsx components/reports/tax/tax-report-breakdown-toggle.tsx components/tables/reports/tax/columns.tsx components/reports/tax/tax-report-table.tsx "app/(protected)/report/tax/page.tsx" types/menu_items.ts lib/reports-access.ts && git commit -m "feat(reports): dedicated tax report page (by tax code / by product, day / month)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Rollout order

1. Task 1 (OMS) — independently deployable, no consumers yet.
2. Tasks 2–3 (Reports Service query enrichment), then Task 4 (push — auto-deploys both this work and the earlier project's unpushed `orders/tax` endpoint).
3. Tasks 5–8 (Dashboard) — Task 5 only needs Task 1 live; Tasks 6–8 only need Task 4 live. No ordering constraint between Dashboard tasks themselves, though they're listed in spec order.

Repo pushes for OMS and Customer-Dashboard are not individual plan tasks — handle via `superpowers:finishing-a-development-branch` once all tasks are reviewed, consistent with how the earlier tax-reporting project closed out.

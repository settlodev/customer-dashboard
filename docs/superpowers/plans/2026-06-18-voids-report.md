# Voids Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Voids report to the Customer Dashboard that lists every order containing voided line items in a date range, shows each order's void amount, and opens the order detail screen on click — backed by a new dedicated OMS endpoint.

**Architecture:** A new read-only endpoint `GET /api/v1/orders/voids` in the Order Management Service filters orders to those with voided items and returns them (as the existing `OrderResponseDto`) plus a server-computed summary. The dashboard's `/report/voids` server page calls it, reuses the existing orders-table machinery (`buildOrderListView`, `buildOrdersColumns`) via a `VoidsDataTable` sibling, and renders KPIs from the summary.

**Tech Stack:** OMS — Java 21, Spring Boot, Spring Data JPA, Maven, JUnit 5 + Mockito + Testcontainers. Dashboard — Next.js 15 (App Router, server components), TanStack Table, Tailwind. No dashboard test runner (verify via `tsc` + manual run).

## Global Constraints

- **Two repos.** OMS: `/Users/Peter/Settlo/Settlo Order Management Service`. Dashboard: `/Users/Peter/Settlo/Customer-Dashboard`. Use `git -C "<repo>"` for git so the shell working dir is never changed.
- **No DB migration.** The endpoint only *reads* existing columns (`order_items.void_reason`, `order_items.removed`, `order_items.net_amount`). DDL mode is `validate`; do not add Flyway migrations.
- **Void predicate (verbatim, identical everywhere):** an item is a void when `removed = true AND voidReason IS NOT NULL`.
- **Void amount** = `Σ OrderItem.netAmount` of voided items (`BigDecimal` in OMS, `number` in dashboard). **Voided items** = count of voided *line items* (`COUNT(i)`), not units.
- **Endpoint:** `GET /api/v1/orders/voids`, `@PreAuthorize(ORDER_READ)` where `ORDER_READ = "PERM_orders:read"`, location from `RequestContext.get().getLocationId()` via the existing `locationId()` helper.
- **Security parity with `listOrders`:** managers (`canReadAllOrders()` true) see location-wide voids (staffId `null`); others are scoped to their own orders via `AuthenticatedUser.resolveActorStaffId()`. One query each, using `(:staffId IS NULL OR o.assignedTo = :staffId OR o.startedBy = :staffId)`.
- **All order statuses** are eligible (a void on an OPEN order still counts). `status` is an optional filter param.
- **DTO conventions (OMS):** Lombok `@Data` classes for response/summary; a constructor-projection class for the JPQL grouped tally (mirror `order_transaction/dto/CollectionByMethod`). New DTOs live in `order/dto/`.
- **Commit message trailer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Testcontainers tests require Docker running.

## File Structure

**OMS** (`co/tz/settlo/order_management/`)
- `order/dto/VoidReasonTally.java` *(new)* — JPQL constructor projection: `reason`, `count`, `amount`. Also serialized in the response.
- `order/dto/VoidsSummary.java` *(new)* — aggregate totals + `reasons` list.
- `order/dto/OrderVoidsResponse.java` *(new)* — `{ summary, orders }`.
- `order/service/VoidsReportAssembler.java` *(new)* — pure: assemble `VoidsSummary` from orders + tallies + count.
- `order/repository/OrderRepository.java` *(modify)* — add `findVoidedOrders`, `tallyVoidsByReason`, `countOrders`.
- `order/service/OrderService.java` *(modify)* — add `voidsReport(...)`.
- `order/controller/OrderController.java` *(modify)* — add `GET /voids`.
- `test/.../order/service/VoidsReportAssemblerTest.java` *(new)*, `order/repository/OrderVoidsRepositoryTest.java` *(new)*, `order/service/OrderServiceVoidsTest.java` *(new)*.

**Dashboard** (`/Users/Peter/Settlo/Customer-Dashboard/`)
- `types/orders/type.ts` *(modify)* — add `VoidReasonTally`, `VoidsSummary`, `OrderVoidsResponse`, `VOID_REASON_LABELS`.
- `lib/actions/order-actions.tsx` *(modify)* — add `getVoidsReport`.
- `lib/orders/void-report.ts` *(new)* — `orderVoidedItems`, `orderVoidAmount`, `voidedItemCount`.
- `components/tables/orders/voids-columns.tsx` *(new)* — `buildVoidsColumns` (reuses `buildOrdersColumns` + void column).
- `components/tables/orders/voids-data-table.tsx` *(new)* — `VoidsDataTable` (sibling of `AbandonedDataTable`).
- `app/(protected)/report/voids/page.tsx` *(new)* — the report page.
- `types/menu_items.ts` *(modify)* — add the "Voids report" nav entry.

**Phase boundary:** Phase 1 (OMS, Tasks 1–3) is independently shippable. Phase 2 (Dashboard, Tasks 4–6) consumes the endpoint; its manual verification needs Phase 1 deployed/running locally.

---

## Phase 1 — OMS endpoint

### Task 1: Repository void queries + projection DTO

**Files:**
- Create: `src/main/java/co/tz/settlo/order_management/order/dto/VoidReasonTally.java`
- Modify: `src/main/java/co/tz/settlo/order_management/order/repository/OrderRepository.java`
- Test: `src/test/java/co/tz/settlo/order_management/order/repository/OrderVoidsRepositoryTest.java`

**Interfaces:**
- Produces: `VoidReasonTally(VoidReason reason, Long count, BigDecimal amount)` with getters `getReason()`, `getCount()` (long), `getAmount()` (BigDecimal).
- Produces: `OrderRepository.findVoidedOrders(UUID locationId, UUID staffId, LocalDate fromDate, LocalDate toDate, OrderStatus status) : List<Order>`
- Produces: `OrderRepository.tallyVoidsByReason(UUID locationId, UUID staffId, LocalDate fromDate, LocalDate toDate, OrderStatus status) : List<VoidReasonTally>`
- Produces: `OrderRepository.countOrders(UUID locationId, UUID staffId, LocalDate fromDate, LocalDate toDate, OrderStatus status) : long`

- [ ] **Step 1: Create the projection DTO**

`order/dto/VoidReasonTally.java`:
```java
package co.tz.settlo.order_management.order.dto;

import co.tz.settlo.common.enums.VoidReason;
import java.math.BigDecimal;
import lombok.Getter;

/** Per-reason void tally. Doubles as a JPQL constructor projection and a JSON response element. */
@Getter
public class VoidReasonTally {
    private final VoidReason reason;
    private final long count;
    private final BigDecimal amount;

    public VoidReasonTally(VoidReason reason, Long count, BigDecimal amount) {
        this.reason = reason;
        this.count = count == null ? 0L : count;
        this.amount = amount == null ? BigDecimal.ZERO : amount;
    }
}
```

- [ ] **Step 2: Add the three repository methods**

Add to `OrderRepository` (keep imports for `BigDecimal` is not needed here; `VoidReasonTally`, `LocalDate`, `OrderStatus`, `UUID`, `List`, `@Query`, `@Param` are):
```java
@Query("""
        SELECT DISTINCT o FROM Order o
        JOIN o.items i
        WHERE o.locationId = :locationId
          AND o.businessDate BETWEEN :fromDate AND :toDate
          AND o.deletedAt IS NULL
          AND i.removed = true
          AND i.deletedAt IS NULL
          AND i.voidReason IS NOT NULL
          AND (:staffId IS NULL OR o.assignedTo = :staffId OR o.startedBy = :staffId)
          AND (:status IS NULL OR o.orderStatus = :status)
        ORDER BY o.openedDate DESC
        """)
List<Order> findVoidedOrders(@Param("locationId") UUID locationId,
                             @Param("staffId") UUID staffId,
                             @Param("fromDate") LocalDate fromDate,
                             @Param("toDate") LocalDate toDate,
                             @Param("status") OrderStatus status);

@Query("""
        SELECT new co.tz.settlo.order_management.order.dto.VoidReasonTally(
            i.voidReason, COUNT(i), COALESCE(SUM(i.netAmount), 0))
        FROM OrderItem i
        JOIN i.order o
        WHERE o.locationId = :locationId
          AND o.businessDate BETWEEN :fromDate AND :toDate
          AND o.deletedAt IS NULL
          AND i.removed = true
          AND i.deletedAt IS NULL
          AND i.voidReason IS NOT NULL
          AND (:staffId IS NULL OR o.assignedTo = :staffId OR o.startedBy = :staffId)
          AND (:status IS NULL OR o.orderStatus = :status)
        GROUP BY i.voidReason
        """)
List<VoidReasonTally> tallyVoidsByReason(@Param("locationId") UUID locationId,
                                         @Param("staffId") UUID staffId,
                                         @Param("fromDate") LocalDate fromDate,
                                         @Param("toDate") LocalDate toDate,
                                         @Param("status") OrderStatus status);

@Query("""
        SELECT COUNT(o) FROM Order o
        WHERE o.locationId = :locationId
          AND o.businessDate BETWEEN :fromDate AND :toDate
          AND o.deletedAt IS NULL
          AND (:staffId IS NULL OR o.assignedTo = :staffId OR o.startedBy = :staffId)
          AND (:status IS NULL OR o.orderStatus = :status)
        """)
long countOrders(@Param("locationId") UUID locationId,
                 @Param("staffId") UUID staffId,
                 @Param("fromDate") LocalDate fromDate,
                 @Param("toDate") LocalDate toDate,
                 @Param("status") OrderStatus status);
```
Add `import co.tz.settlo.order_management.order.dto.VoidReasonTally;` to the repository.

- [ ] **Step 3: Write the failing integration test**

`order/repository/OrderVoidsRepositoryTest.java`:
```java
package co.tz.settlo.order_management.order.repository;

import static org.assertj.core.api.Assertions.assertThat;

import co.tz.settlo.common.enums.OrderStatus;
import co.tz.settlo.common.enums.VoidReason;
import co.tz.settlo.order_management.order.dto.VoidReasonTally;
import co.tz.settlo.order_management.order.model.Order;
import co.tz.settlo.order_management.order.model.OrderItem;
import co.tz.settlo.order_management.test.IntegrationTestBase;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class OrderVoidsRepositoryTest extends IntegrationTestBase {

    @Autowired
    private OrderRepository orderRepository;

    private final UUID locationId = UUID.randomUUID();

    // NOTE: set EVERY non-null column the Order/OrderItem schema requires. The fields below
    // cover the known NOT NULL columns; if a constraint violation fires at save, add the
    // missing setter here (e.g. businessId, orderType) — do not weaken the test.
    private Order order(OrderStatus status, LocalDate businessDate) {
        Order o = new Order();
        o.setLocationId(locationId);
        o.setBusinessId(UUID.randomUUID());
        o.setOrderNumber("ORD-" + UUID.randomUUID());
        o.setOrderStatus(status);
        o.setBusinessDate(businessDate);
        o.setOpenedDate(OffsetDateTime.now());
        o.setSettlementCurrency("TZS");
        return o;
    }

    private void item(Order o, boolean removed, VoidReason reason, String amount) {
        OrderItem i = new OrderItem();
        i.setOrder(o);
        i.setName("Item");
        i.setQuantity(BigDecimal.ONE);
        i.setNetAmount(new BigDecimal(amount));
        i.setRemoved(removed);
        i.setVoidReason(reason);
        o.getItems().add(i);
    }

    @Test
    void findVoidedOrders_returnsOnlyOrdersWithVoidedItems() {
        LocalDate today = LocalDate.now();
        Order withVoid = order(OrderStatus.CLOSED, today);
        item(withVoid, false, null, "1000");
        item(withVoid, true, VoidReason.WRONG_ITEM, "500");
        Order noVoid = order(OrderStatus.CLOSED, today);
        item(noVoid, false, null, "2000");
        orderRepository.saveAll(List.of(withVoid, noVoid));

        List<Order> result = orderRepository.findVoidedOrders(
                locationId, null, today.minusDays(1), today.plusDays(1), null);

        assertThat(result).extracting(Order::getId).containsExactly(withVoid.getId());
    }

    @Test
    void tallyVoidsByReason_groupsAndSumsNetAmount() {
        LocalDate today = LocalDate.now();
        Order o = order(OrderStatus.CLOSED, today);
        item(o, true, VoidReason.WRONG_ITEM, "500");
        item(o, true, VoidReason.WRONG_ITEM, "300");
        item(o, true, VoidReason.STAFF_ERROR, "200");
        orderRepository.save(o);

        List<VoidReasonTally> tallies = orderRepository.tallyVoidsByReason(
                locationId, null, today.minusDays(1), today.plusDays(1), null);

        assertThat(tallies).hasSize(2);
        VoidReasonTally wrong = tallies.stream()
                .filter(t -> t.getReason() == VoidReason.WRONG_ITEM).findFirst().orElseThrow();
        assertThat(wrong.getCount()).isEqualTo(2L);
        assertThat(wrong.getAmount()).isEqualByComparingTo("800");
    }

    @Test
    void countOrders_countsAllInRangeRegardlessOfVoids() {
        LocalDate today = LocalDate.now();
        orderRepository.saveAll(List.of(order(OrderStatus.CLOSED, today), order(OrderStatus.OPEN, today)));
        long count = orderRepository.countOrders(
                locationId, null, today.minusDays(1), today.plusDays(1), null);
        assertThat(count).isEqualTo(2L);
    }
}
```

- [ ] **Step 4: Run the test — expect PASS** (Docker must be running)

Run: `mvn -q test -Dtest=OrderVoidsRepositoryTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: BUILD SUCCESS, 3 tests pass. If a NOT NULL constraint fails on save, add the missing setter in `order(...)` and re-run (this is the one spot the schema may require more fields than listed).

- [ ] **Step 5: Commit**
```bash
git -C "/Users/Peter/Settlo/Settlo Order Management Service" add \
  src/main/java/co/tz/settlo/order_management/order/dto/VoidReasonTally.java \
  src/main/java/co/tz/settlo/order_management/order/repository/OrderRepository.java \
  src/test/java/co/tz/settlo/order_management/order/repository/OrderVoidsRepositoryTest.java
git -C "/Users/Peter/Settlo/Settlo Order Management Service" commit -m "feat(orders): repository queries for voided orders, reason tally, range count

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Response DTOs + summary assembler

**Files:**
- Create: `src/main/java/co/tz/settlo/order_management/order/dto/VoidsSummary.java`
- Create: `src/main/java/co/tz/settlo/order_management/order/dto/OrderVoidsResponse.java`
- Create: `src/main/java/co/tz/settlo/order_management/order/service/VoidsReportAssembler.java`
- Test: `src/test/java/co/tz/settlo/order_management/order/service/VoidsReportAssemblerTest.java`

**Interfaces:**
- Consumes: `VoidReasonTally` (Task 1).
- Produces: `VoidsSummary(long totalOrders, long voidedOrders, long voidedItems, BigDecimal voidAmount, String currency, List<VoidReasonTally> reasons)` (Lombok `@Data`, all-args + no-args).
- Produces: `OrderVoidsResponse(VoidsSummary summary, List<OrderResponseDto> orders)` (Lombok `@Data`, all-args + no-args).
- Produces: `VoidsReportAssembler.assemble(List<OrderResponseDto> orders, List<VoidReasonTally> tallies, long totalOrders) : VoidsSummary`.

- [ ] **Step 1: Create the DTOs**

`order/dto/VoidsSummary.java`:
```java
package co.tz.settlo.order_management.order.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoidsSummary {
    private long totalOrders;
    private long voidedOrders;
    private long voidedItems;
    private BigDecimal voidAmount;
    private String currency;
    private List<VoidReasonTally> reasons;
}
```

`order/dto/OrderVoidsResponse.java`:
```java
package co.tz.settlo.order_management.order.dto;

import co.tz.settlo.common.dto.order.OrderResponseDto;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderVoidsResponse {
    private VoidsSummary summary;
    private List<OrderResponseDto> orders;
}
```

- [ ] **Step 2: Write the failing assembler test**

`order/service/VoidsReportAssemblerTest.java`:
```java
package co.tz.settlo.order_management.order.service;

import static org.assertj.core.api.Assertions.assertThat;

import co.tz.settlo.common.dto.order.OrderResponseDto;
import co.tz.settlo.common.enums.VoidReason;
import co.tz.settlo.order_management.order.dto.VoidReasonTally;
import co.tz.settlo.order_management.order.dto.VoidsSummary;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class VoidsReportAssemblerTest {

    @Test
    void assemble_sumsItemsAndAmount_andPicksFirstNonNullCurrency() {
        OrderResponseDto noCcy = new OrderResponseDto();
        OrderResponseDto tzs = new OrderResponseDto();
        tzs.setSettlementCurrency("TZS");

        List<VoidReasonTally> tallies = List.of(
                new VoidReasonTally(VoidReason.WRONG_ITEM, 3L, new BigDecimal("1500")),
                new VoidReasonTally(VoidReason.STAFF_ERROR, 2L, new BigDecimal("800")));

        VoidsSummary s = VoidsReportAssembler.assemble(List.of(noCcy, tzs), tallies, 50L);

        assertThat(s.getTotalOrders()).isEqualTo(50L);
        assertThat(s.getVoidedOrders()).isEqualTo(2L);
        assertThat(s.getVoidedItems()).isEqualTo(5L);
        assertThat(s.getVoidAmount()).isEqualByComparingTo("2300");
        assertThat(s.getCurrency()).isEqualTo("TZS");
        assertThat(s.getReasons()).hasSize(2);
    }

    @Test
    void assemble_emptyInputs_zeroesAndNullCurrency() {
        VoidsSummary s = VoidsReportAssembler.assemble(List.of(), List.of(), 0L);
        assertThat(s.getVoidedOrders()).isZero();
        assertThat(s.getVoidedItems()).isZero();
        assertThat(s.getVoidAmount()).isEqualByComparingTo("0");
        assertThat(s.getCurrency()).isNull();
        assertThat(s.getReasons()).isEmpty();
    }
}
```

- [ ] **Step 3: Run it — expect FAIL** (`VoidsReportAssembler` undefined)

Run: `mvn -q test -Dtest=VoidsReportAssemblerTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: compilation failure / `cannot find symbol VoidsReportAssembler`.

- [ ] **Step 4: Implement the assembler**

`order/service/VoidsReportAssembler.java`:
```java
package co.tz.settlo.order_management.order.service;

import co.tz.settlo.common.dto.order.OrderResponseDto;
import co.tz.settlo.order_management.order.dto.VoidReasonTally;
import co.tz.settlo.order_management.order.dto.VoidsSummary;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

public final class VoidsReportAssembler {

    private VoidsReportAssembler() {}

    public static VoidsSummary assemble(List<OrderResponseDto> orders,
                                        List<VoidReasonTally> tallies,
                                        long totalOrders) {
        long voidedItems = tallies.stream().mapToLong(VoidReasonTally::getCount).sum();
        BigDecimal voidAmount = tallies.stream()
                .map(VoidReasonTally::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String currency = orders.stream()
                .map(OrderResponseDto::getSettlementCurrency)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
        return new VoidsSummary(totalOrders, orders.size(), voidedItems, voidAmount, currency, tallies);
    }
}
```

- [ ] **Step 5: Run it — expect PASS**

Run: `mvn -q test -Dtest=VoidsReportAssemblerTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: BUILD SUCCESS, 2 tests pass.

- [ ] **Step 6: Commit**
```bash
git -C "/Users/Peter/Settlo/Settlo Order Management Service" add \
  src/main/java/co/tz/settlo/order_management/order/dto/VoidsSummary.java \
  src/main/java/co/tz/settlo/order_management/order/dto/OrderVoidsResponse.java \
  src/main/java/co/tz/settlo/order_management/order/service/VoidsReportAssembler.java \
  src/test/java/co/tz/settlo/order_management/order/service/VoidsReportAssemblerTest.java
git -C "/Users/Peter/Settlo/Settlo Order Management Service" commit -m "feat(orders): voids response DTOs + summary assembler

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Service method + controller endpoint

**Files:**
- Modify: `src/main/java/co/tz/settlo/order_management/order/service/OrderService.java`
- Modify: `src/main/java/co/tz/settlo/order_management/order/controller/OrderController.java`
- Test: `src/test/java/co/tz/settlo/order_management/order/service/OrderServiceVoidsTest.java`

**Interfaces:**
- Consumes: Task 1 repo methods, Task 2 `VoidsReportAssembler` / `OrderVoidsResponse`; existing `orderMapper.toDto(Order, List)`, private `canReadAllOrders()`, `AuthenticatedUser.resolveActorStaffId()`.
- Produces: `OrderService.voidsReport(UUID locationId, LocalDate fromDate, LocalDate toDate, OrderStatus status) : OrderVoidsResponse`.
- Produces: HTTP `GET /api/v1/orders/voids?fromDate&toDate&status`.

- [ ] **Step 1: Write the failing service test**

`order/service/OrderServiceVoidsTest.java`:
```java
package co.tz.settlo.order_management.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import co.tz.settlo.common.dto.order.OrderResponseDto;
import co.tz.settlo.common.enums.VoidReason;
import co.tz.settlo.order_management.common.security.AuthenticatedUser;
import co.tz.settlo.order_management.order.dto.OrderVoidsResponse;
import co.tz.settlo.order_management.order.dto.VoidReasonTally;
import co.tz.settlo.order_management.order.model.Order;
import co.tz.settlo.order_management.order.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OrderServiceVoidsTest {

    @Mock private OrderRepository orderRepository;
    @Mock private OrderMapper orderMapper;
    @InjectMocks private OrderService orderService;

    @Test
    void voidsReport_managerScope_passesNullStaffId_andAssemblesSummary() {
        UUID loc = UUID.randomUUID();
        LocalDate from = LocalDate.now().minusDays(5);
        LocalDate to = LocalDate.now();

        Order entity = new Order();
        OrderResponseDto dto = new OrderResponseDto();
        dto.setSettlementCurrency("TZS");

        when(orderRepository.findVoidedOrders(eq(loc), isNull(), eq(from), eq(to), isNull()))
                .thenReturn(List.of(entity));
        when(orderMapper.toDto(eq(entity), anyList())).thenReturn(dto);
        when(orderRepository.tallyVoidsByReason(eq(loc), isNull(), eq(from), eq(to), isNull()))
                .thenReturn(List.of(new VoidReasonTally(VoidReason.WRONG_ITEM, 2L, new BigDecimal("700"))));
        when(orderRepository.countOrders(eq(loc), isNull(), eq(from), eq(to), isNull()))
                .thenReturn(10L);

        try (MockedStatic<AuthenticatedUser> au = mockStatic(AuthenticatedUser.class)) {
            // NOTE: stub whatever static AuthenticatedUser call canReadAllOrders() makes so it
            // returns true (manager). Verify the real method name; hasPermission(String) is the
            // expected helper. Adjust this line if the actual call differs.
            au.when(() -> AuthenticatedUser.hasPermission(anyString())).thenReturn(true);

            OrderVoidsResponse resp = orderService.voidsReport(loc, from, to, null);

            assertThat(resp.getOrders()).containsExactly(dto);
            assertThat(resp.getSummary().getVoidedOrders()).isEqualTo(1L);
            assertThat(resp.getSummary().getVoidedItems()).isEqualTo(2L);
            assertThat(resp.getSummary().getVoidAmount()).isEqualByComparingTo("700");
            assertThat(resp.getSummary().getTotalOrders()).isEqualTo(10L);
            assertThat(resp.getSummary().getCurrency()).isEqualTo("TZS");
        }
    }
}
```
NOTE: confirm the import path of `AuthenticatedUser` (used by the existing `listOrders`) and the exact static call inside `canReadAllOrders()`; adjust the `import` and the `au.when(...)` stub to match. If `canReadAllOrders()` reads the Spring `SecurityContext` directly rather than a static helper, drop this unit test and rely on Tasks 1–2 coverage plus the Step 5 manual check.

- [ ] **Step 2: Run it — expect FAIL** (`voidsReport` undefined)

Run: `mvn -q test -Dtest=OrderServiceVoidsTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: compilation failure / `cannot find symbol voidsReport`.

- [ ] **Step 3: Add `voidsReport` to `OrderService`**

Place next to `listOrders`. Reuse the same default-range + `canReadAllOrders()` pattern `listOrders` uses:
```java
@Transactional(readOnly = true)
public OrderVoidsResponse voidsReport(UUID locationId, LocalDate fromDate, LocalDate toDate, OrderStatus status) {
    LocalDate today = LocalDate.now();
    LocalDate from = fromDate != null ? fromDate : today.withDayOfMonth(1);
    LocalDate to = toDate != null ? toDate : today.withDayOfMonth(today.lengthOfMonth());

    UUID staffScope = canReadAllOrders() ? null : AuthenticatedUser.resolveActorStaffId();

    List<Order> voided = orderRepository.findVoidedOrders(locationId, staffScope, from, to, status);
    List<OrderResponseDto> orders = voided.stream().map(o -> orderMapper.toDto(o, List.of())).toList();

    List<VoidReasonTally> tallies = orderRepository.tallyVoidsByReason(locationId, staffScope, from, to, status);
    long totalOrders = orderRepository.countOrders(locationId, staffScope, from, to, status);

    return new OrderVoidsResponse(VoidsReportAssembler.assemble(orders, tallies, totalOrders), orders);
}
```
Add imports: `co.tz.settlo.order_management.order.dto.OrderVoidsResponse`, `co.tz.settlo.order_management.order.dto.VoidReasonTally`. (`OrderResponseDto`, `Order`, `List`, `LocalDate`, `UUID`, `AuthenticatedUser`, `canReadAllOrders`, `orderMapper`, `orderRepository` are already in scope.)

- [ ] **Step 4: Run it — expect PASS**

Run: `mvn -q test -Dtest=OrderServiceVoidsTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: BUILD SUCCESS, 1 test passes. (If the `AuthenticatedUser` stub line needed adjusting per the Step 1 NOTE, make it now.)

- [ ] **Step 5: Add the controller endpoint**

In `OrderController`, next to the existing `list(...)` method (so it sits before `@GetMapping("/{orderId}")`):
```java
@PreAuthorize("hasAuthority('" + OrderPermission.ORDER_READ + "')")
@GetMapping("/voids")
public ResponseEntity<OrderVoidsResponse> voids(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(required = false) OrderStatus status) {
    return ResponseEntity.ok(orderService.voidsReport(locationId(), fromDate, toDate, status));
}
```
Add `import co.tz.settlo.order_management.order.dto.OrderVoidsResponse;`. (`LocalDate`, `OrderStatus`, `DateTimeFormat`, `@RequestParam`, `@GetMapping`, `@PreAuthorize`, `OrderPermission` are already imported for `list`.)

- [ ] **Step 6: Build, then smoke-test the route**

Run: `mvn -q -DskipTests package -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"`
Expected: BUILD SUCCESS.
Then (service running locally, with a valid auth/location context) confirm `GET /api/v1/orders/voids?fromDate=2026-06-01&toDate=2026-06-30` returns `200` with a `{ "summary": {...}, "orders": [...] }` body, and that `GET /api/v1/orders/{someId}` still resolves (no `/voids` vs `/{orderId}` collision).

- [ ] **Step 7: Commit**
```bash
git -C "/Users/Peter/Settlo/Settlo Order Management Service" add \
  src/main/java/co/tz/settlo/order_management/order/service/OrderService.java \
  src/main/java/co/tz/settlo/order_management/order/controller/OrderController.java \
  src/test/java/co/tz/settlo/order_management/order/service/OrderServiceVoidsTest.java
git -C "/Users/Peter/Settlo/Settlo Order Management Service" commit -m "feat(orders): GET /api/v1/orders/voids endpoint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase 2 — Dashboard report

> No test runner in this repo. Each task's gate is `npx tsc --noEmit` (run from the dashboard root) plus, for the page, a manual load. Run typecheck with:
> `npm --prefix "/Users/Peter/Settlo/Customer-Dashboard" exec tsc -- --noEmit`

### Task 4: Dashboard types + `getVoidsReport` action

**Files:**
- Modify: `types/orders/type.ts`
- Modify: `lib/actions/order-actions.tsx`

**Interfaces:**
- Produces (types): `VoidReasonTally { reason: VoidReason; count: number; amount: number }`, `VoidsSummary { totalOrders; voidedOrders; voidedItems; voidAmount: number; currency: string | null; reasons: VoidReasonTally[] }`, `OrderVoidsResponse { summary: VoidsSummary; orders: Order[] }`, `VOID_REASON_LABELS: Record<VoidReason, string>`.
- Produces (action): `getVoidsReport(params?: { fromDate?: string; toDate?: string; status?: OrderStatus | "" }) : Promise<OrderVoidsResponse>`.

- [ ] **Step 1: Add the types**

Append to `types/orders/type.ts` (after the `VoidReason` enum / status-label maps):
```ts
export interface VoidReasonTally {
  reason: VoidReason;
  count: number;
  amount: number;
}

export interface VoidsSummary {
  totalOrders: number;
  voidedOrders: number;
  voidedItems: number;
  voidAmount: number;
  currency: string | null;
  reasons: VoidReasonTally[];
}

export interface OrderVoidsResponse {
  summary: VoidsSummary;
  orders: Order[];
}

export const VOID_REASON_LABELS: Record<VoidReason, string> = {
  [VoidReason.CUSTOMER_REQUEST]: "Customer request",
  [VoidReason.WRONG_ITEM]: "Wrong item",
  [VoidReason.DUPLICATE]: "Duplicate",
  [VoidReason.STAFF_ERROR]: "Staff error",
  [VoidReason.QUALITY]: "Quality",
  [VoidReason.OUT_OF_STOCK]: "Out of stock",
  [VoidReason.OTHER]: "Other",
};
```

- [ ] **Step 2: Add the action**

In `lib/actions/order-actions.tsx`: add `OrderVoidsResponse` to the existing `@/types/orders/type` import, then add below `listOrders`:
```ts
const EMPTY_VOIDS_REPORT: OrderVoidsResponse = {
  summary: {
    totalOrders: 0,
    voidedOrders: 0,
    voidedItems: 0,
    voidAmount: 0,
    currency: null,
    reasons: [],
  },
  orders: [],
};

export interface VoidsReportParams {
  fromDate?: string;
  toDate?: string;
  status?: OrderStatus | "";
}

/** Orders with >= 1 voided line item in the range, plus server-computed totals (OMS). */
export const getVoidsReport = async (
  params?: VoidsReportParams,
): Promise<OrderVoidsResponse> => {
  const location = await getCurrentLocation();
  if (!location?.id) return EMPTY_VOIDS_REPORT;

  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set("fromDate", params.fromDate);
  if (params?.toDate) qs.set("toDate", params.toDate);
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();

  const data = await oms().get<OrderVoidsResponse>(
    `${ordersBase}/voids${query ? `?${query}` : ""}`,
  );
  return parseStringify(data ?? EMPTY_VOIDS_REPORT);
};
```

- [ ] **Step 3: Typecheck — expect clean**

Run: `npm --prefix "/Users/Peter/Settlo/Customer-Dashboard" exec tsc -- --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**
```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add types/orders/type.ts lib/actions/order-actions.tsx
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(dashboard): voids report types + getVoidsReport action

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Void helpers + `VoidsDataTable`

**Files:**
- Create: `lib/orders/void-report.ts`
- Create: `components/tables/orders/voids-columns.tsx`
- Create: `components/tables/orders/voids-data-table.tsx`

**Interfaces:**
- Consumes: `Order`/`OrderItem` types; `buildOrdersColumns`, `OrdersColumnOptions` from `components/tables/orders/columns`; `ORDER_STATUS_FILTER_OPTIONS`, `OrderStatus` from `types/orders/type`; `DataTable`.
- Produces: `orderVoidedItems(o)`, `orderVoidAmount(o): number`, `voidedItemCount(o): number`; `buildVoidsColumns(opts): ColumnDef<Order>[]`; `VoidsDataTable` (props identical to `AbandonedDataTable`).

- [ ] **Step 1: Create the helpers**

`lib/orders/void-report.ts`:
```ts
import type { Order, OrderItem } from "@/types/orders/type";

/** Voided line items: removed AND carrying a void reason (matches the OMS predicate). */
export const orderVoidedItems = (o: Order): OrderItem[] =>
  (o.removedItems ?? []).filter((i) => i.voidReason != null);

/** Net value voided on this order. */
export const orderVoidAmount = (o: Order): number =>
  orderVoidedItems(o).reduce((sum, i) => sum + (i.netAmount ?? 0), 0);

/** Number of voided line items on this order. */
export const voidedItemCount = (o: Order): number => orderVoidedItems(o).length;
```

- [ ] **Step 2: Create the columns factory**

`components/tables/orders/voids-columns.tsx`:
```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Order } from "@/types/orders/type";
import { orderVoidAmount, voidedItemCount } from "@/lib/orders/void-report";
import { buildOrdersColumns, OrdersColumnOptions } from "./columns";

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

/**
 * The Orders columns plus a "Void amount" column inserted just before Status.
 * Reuses buildOrdersColumns so the shared columns stay identical to /orders.
 */
export function buildVoidsColumns(opts: OrdersColumnOptions): ColumnDef<Order>[] {
  const cols = buildOrdersColumns(opts);

  const voidColumn: ColumnDef<Order> = {
    id: "voidAmount",
    header: "Void amount",
    cell: ({ row }) => {
      const amount = orderVoidAmount(row.original);
      const count = voidedItemCount(row.original);
      return (
        <div className="flex flex-col tabular-nums text-[12.5px]">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            {formatMoney(amount)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {count} item{count === 1 ? "" : "s"}
          </span>
        </div>
      );
    },
  };

  const statusIdx = cols.findIndex(
    (c) => "accessorKey" in c && c.accessorKey === "orderStatus",
  );
  cols.splice(statusIdx === -1 ? cols.length : statusIdx, 0, voidColumn);
  return cols;
}
```

- [ ] **Step 3: Create the table (mirror `AbandonedDataTable`)**

`components/tables/orders/voids-data-table.tsx`:
```tsx
"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/tables/data-table";
import {
  Order,
  ORDER_STATUS_FILTER_OPTIONS,
  OrderStatus,
} from "@/types/orders/type";
import { buildVoidsColumns } from "./voids-columns";

// Abandoned orders never have voided items, so drop ABANDONED from the filter.
const VOIDS_FILTER_OPTIONS = ORDER_STATUS_FILTER_OPTIONS.filter(
  (o) => o.value !== OrderStatus.ABANDONED,
);

interface VoidsDataTableProps {
  data: Order[];
  pageCount: number;
  pageNo: number;
  total: number;
  tableMode: boolean;
  staffNames: Record<string, string>;
  tableNames: Record<string, string>;
}

export function VoidsDataTable({
  data,
  pageCount,
  pageNo,
  total,
  tableMode,
  staffNames,
  tableNames,
}: VoidsDataTableProps) {
  const columns = useMemo(
    () => buildVoidsColumns({ tableMode, staffNames, tableNames }),
    [tableMode, staffNames, tableNames],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      pageCount={pageCount}
      pageNo={pageNo}
      searchKey="orderNumber"
      searchPlaceholder="Search order #, table, staff…"
      total={total}
      filterKey="orderStatus"
      filterOptions={VOIDS_FILTER_OPTIONS}
      rowClickBasePath="/orders"
    />
  );
}
```

- [ ] **Step 4: Typecheck — expect clean**

Run: `npm --prefix "/Users/Peter/Settlo/Customer-Dashboard" exec tsc -- --noEmit`
Expected: no errors. (If `ORDER_STATUS_FILTER_OPTIONS` isn't exported, confirm the export name in `types/orders/type.ts` — it's the same symbol `orders-data-table.tsx` imports.)

- [ ] **Step 5: Commit**
```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add \
  lib/orders/void-report.ts \
  components/tables/orders/voids-columns.tsx \
  components/tables/orders/voids-data-table.tsx
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(dashboard): VoidsDataTable + void-amount helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Report page + nav entry

**Files:**
- Create: `app/(protected)/report/voids/page.tsx`
- Modify: `types/menu_items.ts`

**Interfaces:**
- Consumes: `getVoidsReport` (Task 4), `VoidsDataTable` (Task 5), `buildOrderListView`, `OrdersDateFilter`, `KpiStrip`/`KpiCard`, `PageShell`/`PageBody`/`PageHeader`/`PageBreadcrumbs`, `NoItems`, `Card`/`CardContent`, `getLocationSettings`, `fetchAllStaff`, `fetchAllTables`, `VOID_REASON_LABELS`, `VoidReasonTally`.

- [ ] **Step 1: Create the page**

`app/(protected)/report/voids/page.tsx`:
```tsx
import { endOfMonth, format, startOfMonth } from "date-fns";
import { Ban, CircleDollarSign, ListX, Tag } from "lucide-react";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import NoItems from "@/components/layouts/no-items";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersDateFilter } from "@/components/orders/orders-date-filter";
import { VoidsDataTable } from "@/components/tables/orders/voids-data-table";
import { getVoidsReport } from "@/lib/actions/order-actions";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";
import { fetchAllStaff } from "@/lib/actions/staff-actions";
import { fetchAllTables } from "@/lib/actions/space-actions";
import { buildOrderListView } from "@/lib/orders/order-list-view";
import { VOID_REASON_LABELS, type VoidReasonTally } from "@/types/orders/type";

type Params = {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    from?: string;
    to?: string;
  }>;
};

const formatMoney = (value: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);

const topReason = (reasons: VoidReasonTally[]): VoidReasonTally | null =>
  reasons.length === 0
    ? null
    : reasons.reduce((max, r) => (r.count > max.count ? r : max), reasons[0]);

export default async function Page({ searchParams }: Params) {
  const resolved = await searchParams;
  const q = resolved.search ?? "";
  const page = Number(resolved.page) || 1;
  const limit = Number(resolved.limit) || 10;

  // Default to the current month — matches the other report screens.
  const now = new Date();
  const from = resolved.from ?? format(startOfMonth(now), "yyyy-MM-dd");
  const to = resolved.to ?? format(endOfMonth(now), "yyyy-MM-dd");

  const [report, locationSettings, staffList, tablesList] = await Promise.all([
    getVoidsReport({ fromDate: from, toDate: to }).catch(() => null),
    getLocationSettings().catch(() => null),
    fetchAllStaff().catch(() => []),
    fetchAllTables().catch(() => []),
  ]);

  const summary = report?.summary;
  const orders = report?.orders ?? [];
  const tableMode = locationSettings?.orderingMode === "TABLE_MANAGEMENT";
  const currency = summary?.currency ?? "TZS";

  const { pageData, total, pageCount, staffNames, tableNames } =
    buildOrderListView({
      orders,
      search: q,
      page,
      limit,
      staff: staffList,
      tables: tablesList,
    });

  const hasAny = orders.length > 0;
  const isDefaultRange = !resolved.from && !resolved.to;
  const hasFilters = q !== "" || !isDefaultRange;

  const voidedOrders = summary?.voidedOrders ?? 0;
  const totalOrders = summary?.totalOrders ?? 0;
  const voidedItems = summary?.voidedItems ?? 0;
  const voidAmount = summary?.voidAmount ?? 0;
  const top = topReason(summary?.reasons ?? []);
  const rate =
    totalOrders > 0 ? Math.round((voidedOrders / totalOrders) * 100) : 0;

  const subtitle =
    from === to
      ? `Voids on ${format(new Date(from), "MMM d, yyyy")}`
      : `Voids ${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;

  return (
    <PageShell maxWidth="wide">
      <PageBreadcrumbs items={[{ title: "Voids" }]} />
      <PageHeader title="Voids report" subtitle={subtitle} />

      <PageBody>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <OrdersDateFilter from={from} to={to} />
        </div>

        {hasAny || hasFilters ? (
          <>
            <KpiStrip cols={4}>
              <KpiCard
                icon={<Ban className="h-3 w-3" />}
                label="Voided orders"
                value={voidedOrders > 0 ? voidedOrders.toLocaleString() : "—"}
                delta={
                  totalOrders > 0
                    ? `${rate}% of ${totalOrders.toLocaleString()} orders`
                    : undefined
                }
                deltaTone="neutral"
              />
              <KpiCard
                icon={<ListX className="h-3 w-3" />}
                label="Voided items"
                value={voidedItems > 0 ? voidedItems.toLocaleString() : "—"}
                deltaTone="neutral"
              />
              <KpiCard
                icon={<CircleDollarSign className="h-3 w-3" />}
                label="Void amount"
                value={voidAmount > 0 ? formatMoney(voidAmount) : "—"}
                unit={currency}
                deltaTone="neg"
              />
              <KpiCard
                icon={<Tag className="h-3 w-3" />}
                label="Top reason"
                value={top ? VOID_REASON_LABELS[top.reason] : "—"}
                delta={
                  top && voidedItems > 0
                    ? `${Math.round((top.count / voidedItems) * 100)}% of items`
                    : undefined
                }
                deltaTone="neutral"
              />
            </KpiStrip>

            <Card>
              <CardContent className="px-2 pt-6 sm:px-6">
                <VoidsDataTable
                  data={pageData}
                  pageCount={pageCount}
                  pageNo={page - 1}
                  total={total}
                  tableMode={tableMode}
                  staffNames={staffNames}
                  tableNames={tableNames}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <NoItems itemName="voided orders" />
        )}
      </PageBody>
    </PageShell>
  );
}
```

- [ ] **Step 2: Add the nav entry**

In `types/menu_items.ts`, in the Reports section, immediately after the "Refund report" object, insert:
```ts
{
  title: "Voids report",
  link: "/report/voids",
  current: args?.isCurrentItem,
  icon: "cart",
},
```

- [ ] **Step 3: Typecheck — expect clean**

Run: `npm --prefix "/Users/Peter/Settlo/Customer-Dashboard" exec tsc -- --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification** (OMS from Phase 1 running)

Run: `npm --prefix "/Users/Peter/Settlo/Customer-Dashboard" run dev`, sign in, open `/report/voids`. Verify:
1. KPI strip shows Voided orders / Voided items / Void amount / Top reason.
2. The table renders the same columns as `/orders` plus a "Void amount" column before Status; only orders with voids appear.
3. The date filter re-queries; the search box filters by order #/table/staff.
4. Clicking a row navigates to `/orders/{id}`.
5. "Voids report" appears in the Reports nav and routes here.
6. An empty range shows the `NoItems` state.

- [ ] **Step 5: Commit**
```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add \
  "app/(protected)/report/voids/page.tsx" types/menu_items.ts
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(dashboard): voids report page + nav entry

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Reports-section placement (`/report/voids`) → Task 6. ✓
- Voids = orders with voided line items (`removed = true AND voidReason != null`) → predicate in Task 1 queries + Task 5 helper. ✓
- Void amount = net of removed items → Task 1 (`SUM(netAmount)`), Task 5 (`orderVoidAmount`). ✓
- All statuses, optional `status` filter → Task 1 (`:status IS NULL OR …`), Task 3 param. ✓
- Dedicated OMS endpoint returning `{ summary, orders: OrderResponseDto[] }` → Tasks 1–3. ✓
- Reuse `OrderResponseDto` rows, `buildOrderListView`, `buildOrdersColumns`, row-click → `/orders/{id}` → Tasks 5–6. ✓
- KPIs from server summary incl. void rate + top reason → Task 6. ✓
- Void amount column before Status → Task 5 `buildVoidsColumns`. ✓
- Security parity with `listOrders` (nullable staffId) → Tasks 1 + 3. ✓
- Nav entry → Task 6. ✓
- Tests: OMS TDD (repo + assembler + service); dashboard `tsc` + manual per the no-runner decision. ✓

**Placeholder scan:** No TBD/TODO. Two explicit verification NOTEs (Order NOT NULL columns in the repo test; the exact `AuthenticatedUser` static call) are pinpointed, not vague — each says exactly what to confirm and how to adjust.

**Type consistency:** `VoidReasonTally(reason,count,amount)`, `VoidsSummary(totalOrders,voidedOrders,voidedItems,voidAmount,currency,reasons)`, `OrderVoidsResponse(summary,orders)`, and `voidsReport(locationId,fromDate,toDate,status)` are used identically across OMS DTOs, repository, service, assembler, controller, dashboard types, action, and page. Dashboard helpers `orderVoidedItems` / `orderVoidAmount` / `voidedItemCount` are consumed only in `buildVoidsColumns`. ✓

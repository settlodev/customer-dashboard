# Task 3 Report — Service method + controller endpoint

**Status:** COMPLETE ✓ — all verification steps passed.

---

## Files Modified / Created

| Action | File |
|--------|------|
| Modified | `src/main/java/co/tz/settlo/order_management/order/service/OrderService.java` |
| Modified | `src/main/java/co/tz/settlo/order_management/order/controller/OrderController.java` |
| Created  | `src/test/java/co/tz/settlo/order_management/order/service/OrderServiceVoidsTest.java` |

---

## `canReadAllOrders()` / `AuthenticatedUser` — What I Found

**Real implementation** (OrderService.java lines 810–813):
```java
private boolean canReadAllOrders() {
    return AuthenticatedUser.hasPermission(OrderPermission.ORDER_READ_ALL)
            || AuthenticatedUser.hasPermission(OrderPermission.ORDER_MANAGE_ALL);
}
```

**Real `AuthenticatedUser` package:**
`co.tz.settlo.order_management.infrastructure.security.AuthenticatedUser`
(The plan guessed `co.tz.settlo.order_management.common.security.AuthenticatedUser` — this was wrong.)

**`hasPermission(String)` internals:**
It reads from two sources in sequence: `RequestContext.get().getStaffPermissions()` (request-scoped bean), then `SecurityContextHolder.getContext().getAuthentication().getAuthorities()`. Neither is available in a bare Mockito unit test.

**Decision: KEPT the unit test.** The `mockStatic(AuthenticatedUser.class)` approach works cleanly — when the static class is mocked, `hasPermission(anyString())` returns `true` without executing the real body (which would NPE on missing RequestContext). The test passed on first run.

**Adjustment made:** Fixed the import from the plan's guessed package to the real package:
```java
// Wrong (plan guess):
import co.tz.settlo.order_management.common.security.AuthenticatedUser;
// Correct (real):
import co.tz.settlo.order_management.infrastructure.security.AuthenticatedUser;
```

---

## What Was Added

### `OrderService.voidsReport(...)` — placed directly after `listOrders`

```java
@Transactional(readOnly = true)
public OrderVoidsResponse voidsReport(UUID locationId, LocalDate fromDate, LocalDate toDate, OrderStatus status) {
    LocalDate today = LocalDate.now();
    LocalDate from = fromDate != null ? fromDate : today.withDayOfMonth(1);
    LocalDate to   = toDate   != null ? toDate   : today.withDayOfMonth(today.lengthOfMonth());

    UUID staffScope = canReadAllOrders() ? null : AuthenticatedUser.resolveActorStaffId();

    List<Order>           voided  = orderRepository.findVoidedOrders(locationId, staffScope, from, to, status);
    List<OrderResponseDto> orders = voided.stream().map(o -> orderMapper.toDto(o, List.of())).toList();

    List<VoidReasonTally> tallies    = orderRepository.tallyVoidsByReason(locationId, staffScope, from, to, status);
    long                  totalOrders = orderRepository.countOrders(locationId, staffScope, from, to, status);

    return new OrderVoidsResponse(VoidsReportAssembler.assemble(orders, tallies, totalOrders), orders);
}
```

No new imports needed — `co.tz.settlo.order_management.order.dto.*` (wildcard already present) covers `OrderVoidsResponse` and `VoidReasonTally`.

### `OrderController.voids(...)` — inserted before `/{orderId}`

```java
@PreAuthorize("hasAuthority('" + OrderPermission.ORDER_READ + "')")
@GetMapping("/voids")
@Operation(summary = "List orders with voided items in a date range, plus server-computed summary")
public ResponseEntity<OrderVoidsResponse> voids(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(required = false) OrderStatus status) {
    return ResponseEntity.ok(orderService.voidsReport(locationId(), fromDate, toDate, status));
}
```

The literal `/voids` path sits immediately before `@GetMapping("/{orderId}")` in the source. Spring MVC resolves literals ahead of path-variable templates so there is no routing collision.

No new imports needed — `co.tz.settlo.order_management.order.dto.*` already covers `OrderVoidsResponse`.

---

## Commands Run + Results

| Command | Result |
|---------|--------|
| `mvn test -Dtest=OrderServiceVoidsTest -f "…/pom.xml"` | **BUILD SUCCESS** — 1 test run, 0 failures, 0 errors |
| `mvn -q -DskipTests package -f "…/pom.xml"` | **BUILD SUCCESS** — no output (clean compile) |

---

## Concerns / Notes

- **No commit made** — per instructions, changes are left uncommitted on branch `alpha`.
- The Mockito self-attach warning (`"Mockito is currently self-attaching to enable the inline-mock-maker"`) is a JDK 21 / Mockito version advisory, not a failure. It was already present in the existing test suite.
- The `mockStatic` on `AuthenticatedUser` is Mockito-inline and does NOT require the `-Dmockito.mock-maker-inline=true` surefire arg in this project — the existing pom already activates the inline maker (confirmed by the test passing).
- The plan's Step 6 smoke-test (manual HTTP call) was intentionally skipped per task instructions — it requires a running server with auth context. The user should run that.

# Task 1 Report: Repository void queries + projection DTO

**Status:** DONE

## Files Created / Modified

- **Created:** `src/main/java/co/tz/settlo/order_management/order/dto/VoidReasonTally.java`
  - Lombok `@Getter` constructor-projection class exactly as specified in the plan.

- **Modified:** `src/main/java/co/tz/settlo/order_management/order/repository/OrderRepository.java`
  - Added `import co.tz.settlo.order_management.order.dto.VoidReasonTally;`
  - Added three methods: `findVoidedOrders`, `tallyVoidsByReason`, `countOrders` — all exactly matching the plan's JPQL.

- **Created:** `src/test/java/co/tz/settlo/order_management/order/repository/OrderVoidsRepositoryTest.java`
  - Also created the directory `order/repository/` under test (it did not exist).

## Deviations from the Plan

One intentional deviation: the test helper methods `order(...)` and `item(...)` were extended beyond what the plan listed to satisfy the DB NOT NULL constraints that the plan's author flagged as a risk.

**Additional required fields added to `order(...)` helper:**
- `o.setSlug(...)` — `slug` column is `nullable=false`, no auto-generation in Order/BaseEntity.
- `o.setDaySessionId(UUID.randomUUID())` — `day_session_id` is `nullable=false`.
- `o.setOrderType(OrderType.IMMEDIATE)` — `order_type` is `nullable=false`.
- `o.setPlatformType(PlatformType.POS)` — `platform_type` is `nullable=false`.
- `o.setStartedBy(UUID.randomUUID())` — `started_by` is `nullable=false`.

**Additional required fields added to `item(...)` helper:**
- `i.setProductVariantId(UUID.randomUUID())` — `product_variant_id` is `nullable=false`.
- `i.setProductId(UUID.randomUUID())` — `product_id` is `nullable=false`.
- `i.setUnitPrice(new BigDecimal(amount))` — `unit_price` is `nullable=false`.
- `i.setOriginalUnitPrice(new BigDecimal(amount))` — `original_unit_price` is `nullable=false`.

All additional imports (`OrderType`, `PlatformType`) were added to the test file.

The assertions were NOT weakened.

## Test Command and Result

```
mvn test -Dtest=OrderVoidsRepositoryTest -f "/Users/Peter/Settlo/Settlo Order Management Service/pom.xml"
```

**Result:**
```
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 17.38 s
BUILD SUCCESS
```

All 3 tests pass:
- `findVoidedOrders_returnsOnlyOrdersWithVoidedItems`
- `tallyVoidsByReason_groupsAndSumsNetAmount`
- `countOrders_countsAllInRangeRegardlessOfVoids`

## Notes

- No DB migration was added. The queries only read existing columns (`removed`, `void_reason`, `net_amount`, `business_date`, `location_id`, etc.).
- Changes are uncommitted as instructed.
- Docker was running; Testcontainers started Postgres 16-alpine, Redis 7-alpine, and Kafka cp-kafka:7.5.3 successfully.

# Voids Report — SDD progress ledger

Plan: `docs/superpowers/plans/2026-06-18-voids-report.md`
Mode: implement all tasks, **NO commits** (user tests + commits themselves).
Repos: OMS `/Users/Peter/Settlo/Settlo Order Management Service`, Dashboard `/Users/Peter/Settlo/Customer-Dashboard`. Both on `alpha`.

- [x] **Task 1** — OMS repo queries + `VoidReasonTally`. Integration test 3/3 PASS. (uncommitted)
- [x] **Task 2** — OMS response DTOs + `VoidsReportAssembler`. Unit test 2/2 PASS. (uncommitted)
- [x] **Task 3** — OMS `OrderService.voidsReport` + controller `GET /voids`. Unit test 1/1 PASS, clean compile. (uncommitted)
      Real `AuthenticatedUser` = `co.tz.settlo.order_management.infrastructure.security.AuthenticatedUser`; `canReadAllOrders()` uses `hasPermission(String)`.
      Dashboard tsc baseline = 0 errors (clean, despite user WIP).
- [x] **Task 4** — Dashboard types + `getVoidsReport` action. tsc 0 errors (verified by controller; implementer's transient "1 error" was incremental-cache flake). (uncommitted)
- [x] **Task 5** — Dashboard `void-report.ts` helpers + `VoidsDataTable` + `buildVoidsColumns`. tsc 0 errors. (uncommitted)
- [ ] Task 6 — Dashboard `/report/voids` page + nav entry

Notes:
- Task 1 added test-only NOT NULL fields to seed helpers (slug, daySessionId, orderType, platformType, startedBy, productVariantId, productId, unitPrice, originalUnitPrice).
- OMS `application-integration-test.properties` has pre-existing user WIP — leave alone.

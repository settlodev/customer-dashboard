# Admin Hierarchy Rework — Phase 4: Warehouse + Store detail pages — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Add admin **warehouse** and **store** detail pages (`/admin/warehouses/[id]`, `/admin/stores/[id]`) reusing the Phase-1 `EntityDetailView` (entityType WAREHOUSE/STORE), backed by new single-GET accounts endpoints (mirroring the existing location-detail endpoint). Then **wire the warehouse/store drill-down links** left non-clickable in Phases 2–3.

**Architecture:** Accounts service gets `GET /api/v1/admin/warehouses/{id}` + `/stores/{id}` (mirror `getLocationDetail`). Dashboard gets matching actions/types + two routes (mirror `locations/[id]/page.tsx`; Orders + Stock tabs are the existing deferred stubs for non-LOCATION entities — no orders/stock fetch). Finally, flip the warehouse/store `href` in the business billable-units card (P2) + the account tree (P3).

**Spec:** `docs/superpowers/specs/2026-06-15-admin-account-business-entity-hierarchy-design.md` (Phase 4, §8).

**Repos:** Settlo Accounts Service (`/Users/Peter/Settlo/Settlo Accounts Service`) + Customer-Dashboard (`/Users/Peter/Settlo/Customer-Dashboard`). **No Settlo Common change, no new config keys** → deploy = redeploy accounts + dashboard.

---

## Execution Notes
- Accounts: branch `alpha` (already carries the 3B send-email work + settlo-common 0.8.60-ALPHA). Buildable/testable locally (`./mvnw`); `settlo-common 0.8.60-ALPHA` is in `~/.m2`. **Stage ONLY each task's files.**
- Dashboard: branch `alpha`. **Stage ONLY each task's files** (never `-A`). Untouched user WIP: `app/(admin)/admin/packages/[id]/page.tsx`, `components/admin/catalog/package-detail/comparison-chart.tsx`, `components/billing/invoice-view-dialog.tsx`. Verify `npx tsc --noEmit` + `npm run lint`. nushell resets cwd → prefix commands with `cd "<repo>" &&`.
- **Drill-down end-state:** after P4, warehouse/store rows in the P2 billable-units card + P3 account tree become clickable (their routes now exist).
- **Deferred (NOT this phase):** Orders + Stock/Products data for warehouse/store stays stubbed (EntityDetailView already shows the deferred stub for non-LOCATION). The billing-page per-item action cleanup remains a separate optional follow-up (flagged, not done here — avoids removing recently-added convenience without an explicit ask).

---

## Task 1: Accounts — warehouse + store detail endpoints

**Files (in `/Users/Peter/Settlo/Settlo Accounts Service`):**
- Modify: `warehouses/repository/WarehouseRepository.java`, `stores/repository/StoreRepository.java`
- Create: `admin/dto/AdminWarehouseDetailResponse.java`, `admin/dto/AdminStoreDetailResponse.java`
- Modify: `admin/service/AdminService.java`, `admin/controller/AdminController.java`
- Test: `src/test/java/co/tz/settlo/accounts/admin/service/AdminServiceEntityDetailTest.java`

- [ ] **Step 1 — repository fetch-with-relations.** Mirror `LocationRepository.findByIdWithRelations`.
  - In `WarehouseRepository`, add:
    ```java
    @Query("SELECT w FROM WarehouseEntity w LEFT JOIN FETCH w.business WHERE w.id = :id")
    Optional<WarehouseEntity> findByIdWithRelations(@Param("id") UUID id);
    ```
  - In `StoreRepository`, add:
    ```java
    @Query("SELECT s FROM StoreEntity s LEFT JOIN FETCH s.business LEFT JOIN FETCH s.location WHERE s.id = :id")
    Optional<StoreEntity> findByIdWithRelations(@Param("id") UUID id);
    ```
  (Both files already import `Optional`, `UUID`, `@Query`, `@Param` for sibling queries — verify.)

- [ ] **Step 2 — detail DTOs** (mirror `AdminLocationDetailResponse`; the LIST responses lack `businessName`, which the detail page needs). Create `admin/dto/AdminWarehouseDetailResponse.java`:
  ```java
  package co.tz.settlo.accounts.admin.dto;

  import co.tz.settlo.accounts.warehouses.model.WarehouseEntity;
  import lombok.AllArgsConstructor;
  import lombok.Builder;
  import lombok.Data;
  import lombok.NoArgsConstructor;

  import java.time.OffsetDateTime;
  import java.util.UUID;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class AdminWarehouseDetailResponse {
      private UUID id;
      private String name;
      private String slug;
      private String identifier;
      private String description;
      private boolean active;
      private UUID businessId;
      private String businessName;
      private UUID accountId;
      private String code;
      private Integer capacity;
      private boolean primary;
      private OffsetDateTime createdAt;
      private OffsetDateTime updatedAt;

      public static AdminWarehouseDetailResponse fromEntity(WarehouseEntity e) {
          return AdminWarehouseDetailResponse.builder()
                  .id(e.getId())
                  .name(e.getName())
                  .slug(e.getSlug())
                  .identifier(e.getIdentifier())
                  .description(e.getDescription())
                  .active(e.isActive())
                  .businessId(e.getBusinessId())
                  .businessName(e.getBusiness() != null ? e.getBusiness().getName() : null)
                  .accountId(e.getAccountId())
                  .code(e.getCode())
                  .capacity(e.getCapacity())
                  .primary(e.isPrimary())
                  .createdAt(e.getCreatedAt())
                  .updatedAt(e.getUpdatedAt())
                  .build();
      }
  }
  ```
  Create `admin/dto/AdminStoreDetailResponse.java` similarly, with `locationId`/`locationName` instead of capacity/primary:
  ```java
  package co.tz.settlo.accounts.admin.dto;

  import co.tz.settlo.accounts.stores.model.StoreEntity;
  import lombok.AllArgsConstructor;
  import lombok.Builder;
  import lombok.Data;
  import lombok.NoArgsConstructor;

  import java.time.OffsetDateTime;
  import java.util.UUID;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public class AdminStoreDetailResponse {
      private UUID id;
      private String name;
      private String slug;
      private String identifier;
      private String description;
      private boolean active;
      private UUID businessId;
      private String businessName;
      private UUID accountId;
      private UUID locationId;
      private String locationName;
      private String code;
      private OffsetDateTime createdAt;
      private OffsetDateTime updatedAt;

      public static AdminStoreDetailResponse fromEntity(StoreEntity e) {
          return AdminStoreDetailResponse.builder()
                  .id(e.getId())
                  .name(e.getName())
                  .slug(e.getSlug())
                  .identifier(e.getIdentifier())
                  .description(e.getDescription())
                  .active(e.isActive())
                  .businessId(e.getBusinessId())
                  .businessName(e.getBusiness() != null ? e.getBusiness().getName() : null)
                  .accountId(e.getAccountId())
                  .locationId(e.getLocationId())
                  .locationName(e.getLocation() != null ? e.getLocation().getName() : null)
                  .code(e.getCode())
                  .createdAt(e.getCreatedAt())
                  .updatedAt(e.getUpdatedAt())
                  .build();
      }
  }
  ```
  (Verify `StoreEntity.getLocation()` + `WarehouseEntity.getBusiness()` getters exist — the entities declare `business`/`location` `@ManyToOne` relations, so Lombok `@Getter` provides them.)

- [ ] **Step 3 — service methods.** In `AdminService` (after `getLocationDetail`, ~line 422; `warehouseRepository` + `storeRepository` are already injected — used by `listBusinessWarehouses/Stores`):
  ```java
  public AdminWarehouseDetailResponse getWarehouseDetail(UUID warehouseId) {
      WarehouseEntity warehouse = warehouseRepository.findByIdWithRelations(warehouseId)
              .orElseThrow(() -> new EntityNotFoundException("Warehouse not found: " + warehouseId));
      return AdminWarehouseDetailResponse.fromEntity(warehouse);
  }

  public AdminStoreDetailResponse getStoreDetail(UUID storeId) {
      StoreEntity store = storeRepository.findByIdWithRelations(storeId)
              .orElseThrow(() -> new EntityNotFoundException("Store not found: " + storeId));
      return AdminStoreDetailResponse.fromEntity(store);
  }
  ```
  (Add imports for `WarehouseEntity`/`StoreEntity` + the two new DTOs if not already present; `EntityNotFoundException` is already imported.)

- [ ] **Step 4 — controller endpoints.** In `AdminController` (after `getLocationDetail`, ~line 272):
  ```java
  @GetMapping("/warehouses/{warehouseId}")
  @PreAuthorize("hasAuthority('INTERNAL_internal:accounts:read')")
  @Operation(summary = "Get warehouse detail", description = "Returns full warehouse detail (cross-tenant).")
  public ResponseEntity<AdminWarehouseDetailResponse> getWarehouseDetail(@PathVariable UUID warehouseId) {
      log.info("System admin viewing warehouse detail: {}", warehouseId);
      return ResponseEntity.ok(adminService.getWarehouseDetail(warehouseId));
  }

  @GetMapping("/stores/{storeId}")
  @PreAuthorize("hasAuthority('INTERNAL_internal:accounts:read')")
  @Operation(summary = "Get store detail", description = "Returns full store detail (cross-tenant).")
  public ResponseEntity<AdminStoreDetailResponse> getStoreDetail(@PathVariable UUID storeId) {
      log.info("System admin viewing store detail: {}", storeId);
      return ResponseEntity.ok(adminService.getStoreDetail(storeId));
  }
  ```
  (Add DTO imports. Class-level `@RequestMapping("/api/v1/admin")` already provides the prefix — don't double it.)

- [ ] **Step 5 — test** (mirror `AdminServiceStaffAssignmentTest` Mockito style). Create `AdminServiceEntityDetailTest`: mock `warehouseRepository`/`storeRepository`; given an entity with a `business` relation, `getWarehouseDetail`/`getStoreDetail` map to a response whose `businessName` == the business name and ids match; and a not-found case → `EntityNotFoundException`. Use a real `WarehouseEntity`/`StoreEntity` with a stub `BusinessEntity` set via the setters. Run:
  `cd "/Users/Peter/Settlo/Settlo Accounts Service" && ./mvnw -q -Dtest=AdminServiceEntityDetailTest test 2>&1 | tail -40` → must pass. (If Maven can't resolve a dep from CodeArtifact, report verbatim but still commit; 0.8.60-ALPHA is already in ~/.m2.)

- [ ] **Step 6 — commit** only the touched files:
  `cd "/Users/Peter/Settlo/Settlo Accounts Service" && git add warehouses/.../WarehouseRepository.java stores/.../StoreRepository.java admin/dto/AdminWarehouseDetailResponse.java admin/dto/AdminStoreDetailResponse.java admin/service/AdminService.java admin/controller/AdminController.java src/test/.../AdminServiceEntityDetailTest.java && git commit -m "feat(accounts): admin warehouse + store detail endpoints"` (use real paths).

---

## Task 2: Dashboard — detail types + actions

**Files (in `/Users/Peter/Settlo/Customer-Dashboard`):**
- Modify: `types/admin/business.ts` (add `AdminWarehouseDetail`, `AdminStoreDetail`)
- Modify: `lib/actions/admin/businesses.ts` (add `getAdminWarehouseDetail`, `getAdminStoreDetail`)

- [ ] **Step 1 — types.** In `types/admin/business.ts`, mirror `AdminLocationDetail extends AdminLocationListItem`:
  ```ts
  export interface AdminWarehouseDetail extends AdminWarehouseListItem {
    businessName: string | null;
    description: string | null;
    updatedAt: string;
  }

  export interface AdminStoreDetail extends AdminStoreListItem {
    businessName: string | null;
    locationName: string | null;
    description: string | null;
    updatedAt: string;
  }
  ```
- [ ] **Step 2 — actions.** In `lib/actions/admin/businesses.ts`, mirror `getAdminLocationDetail`:
  ```ts
  export async function getAdminWarehouseDetail(
    warehouseId: string,
  ): Promise<AdminWarehouseDetail> {
    const data = await staffClient().get<AdminWarehouseDetail>(
      `/api/v1/admin/warehouses/${warehouseId}`,
    );
    return parseStringify(data);
  }

  export async function getAdminStoreDetail(
    storeId: string,
  ): Promise<AdminStoreDetail> {
    const data = await staffClient().get<AdminStoreDetail>(
      `/api/v1/admin/stores/${storeId}`,
    );
    return parseStringify(data);
  }
  ```
  Add `AdminWarehouseDetail`/`AdminStoreDetail` to the existing `@/types/admin/business` import in that file.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean.
  `git add types/admin/business.ts lib/actions/admin/businesses.ts && git commit -m "feat(admin): warehouse + store detail actions + types"`

---

## Task 3: Dashboard — warehouse + store detail routes

**Files (create):** `app/(admin)/admin/warehouses/[id]/page.tsx`, `app/(admin)/admin/stores/[id]/page.tsx`

- [ ] **Step 1 — warehouse route.** Create `app/(admin)/admin/warehouses/[id]/page.tsx`, mirroring `app/(admin)/admin/locations/[id]/page.tsx` (same auth/role gate, `await params`, try-catch→`notFound()`), but: use `getAdminWarehouseDetail`, NO orders breakdown (warehouse Orders tab is the stub), pass `ordersRow={null}`, `entityType="WAREHOUSE"`. Concretely:
  - Imports: `getAdminWarehouseDetail` from `@/lib/actions/admin/businesses`; `getBusinessSubscription` from `@/lib/actions/admin/billing`; `EntityDetailView`; shell/auth imports (copy from the location route). No `business-intel` import needed.
  - After auth gate + `const { id } = await params;`:
    ```tsx
    let warehouse: Awaited<ReturnType<typeof getAdminWarehouseDetail>>;
    try {
      warehouse = await getAdminWarehouseDetail(id);
    } catch (error: any) {
      if (error?.code === "NOT_FOUND" || error?.status === 404) notFound();
      // render the same error PageShell as the location route
    }
    const businessId = warehouse.businessId;
    const subscription = canBilling ? await getBusinessSubscription(businessId).catch(() => null) : null;
    const item = subscription?.items.find((i) => i.entityId === id) ?? null;
    ```
  - Render:
    ```tsx
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs items={[
          { title: warehouse.businessName ?? "Business", href: `/businesses/${businessId}` },
          { title: warehouse.name },
        ]} />
        <PageHeader
          title={warehouse.name}
          subtitle={[warehouse.code, warehouse.businessName].filter(Boolean).join(" · ") || undefined}
        />
        <PageBody>
          <EntityDetailView
            entityType="WAREHOUSE"
            businessId={businessId}
            subscriptionId={subscription?.id ?? null}
            item={item}
            ordersRow={null}
            rangeLabel=""
            canBilling={canBilling}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
    ```
    (`rangeLabel` is unused by the WAREHOUSE Orders stub — pass `""`.)
  - `metadata = { title: "Warehouse detail" }`.
- [ ] **Step 2 — store route.** Create `app/(admin)/admin/stores/[id]/page.tsx` identically but `getAdminStoreDetail`, `entityType="STORE"`, subtitle `[store.locationName, store.businessName]`, breadcrumb business → store.name, `metadata.title = "Store detail"`.
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean.
  `git add "app/(admin)/admin/warehouses/[id]/page.tsx" "app/(admin)/admin/stores/[id]/page.tsx" && git commit -m "feat(admin): warehouse + store detail pages (reuse EntityDetailView)"`

---

## Task 4: Dashboard — activate warehouse/store drill-down links

**Files:** `components/admin/business-detail/business-detail-view.tsx` (P2 billable-units), `lib/actions/admin/account-structure.ts` (P3 tree node builder).

- [ ] **Step 1 — business billable-units card.** In `business-detail-view.tsx`, the `billableUnits` array currently sets `href: null as string | null, // warehouse detail page lands in Phase 4` for warehouses and `// store detail page lands in Phase 4` for stores. Change those to real hrefs:
  - warehouses: `href: \`/warehouses/${w.id}\`,`
  - stores: `href: \`/stores/${s.id}\`,`
  (Locations already use `/locations/${l.id}`.) The render already wraps any row with a non-null `href` in a `<Link>` + chevron, so no render change is needed.
- [ ] **Step 2 — account tree node builder.** In `lib/actions/admin/account-structure.ts`, `nodeFrom` currently sets `href: entityType === "LOCATION" ? \`/locations/${raw.id}\` : null`. Replace with a full mapping:
  ```ts
  href:
    entityType === "LOCATION"
      ? `/locations/${raw.id}`
      : entityType === "WAREHOUSE"
        ? `/warehouses/${raw.id}`
        : `/stores/${raw.id}`,
  ```
  (The P3 tree `EntityRow` already renders a `<Link>` + chevron when `href` is non-null — no component change needed.)
- [ ] **Step 3 — verify + commit.** `npx tsc --noEmit` clean.
  `git add components/admin/business-detail/business-detail-view.tsx lib/actions/admin/account-structure.ts && git commit -m "feat(admin): activate warehouse/store drill-down links (P4 routes exist)"`

---

## Final review & finishing
- [ ] **Accounts:** `./mvnw -q -Dtest=AdminServiceEntityDetailTest test` green (or env-blocked noted). **Dashboard:** `npx tsc --noEmit` clean + `npm run lint` on touched files.
- [ ] **Opus holistic** over the P4 diff (2 repos). Checkpoints: the two accounts endpoints mirror `getLocationDetail` (fetch-with-relations, EntityNotFoundException, `:read` authority, no double path prefix), detail DTOs carry `businessName` (+ store `locationName`); dashboard actions/types match the endpoint shapes; the two routes mirror the location route (auth/role/`await params`/notFound), pass `ordersRow={null}` + correct `entityType`, and EntityDetailView shows the deferred Orders/Stock stubs for non-LOCATION; warehouse/store rows in the P2 card + P3 tree now link to the new routes (locations unchanged); only intended files committed (dashboard WIP preserved); no new config keys / no Common change.
- [ ] **Report:** Phase 4 done → warehouse/store detail pages live + all entity drill-downs active. Deploy = redeploy accounts (new endpoints) + dashboard; no Common publish, no config keys. Note remaining: the deferred per-entity orders/stock/products backend phase (stubs), and the optional billing-page per-item read-only cleanup.

## Self-review (author checklist)
- **Spec §8 coverage:** warehouse + store detail pages reusing EntityDetailView (T1–T3) ✓; wire account/business drill-down links (T4) ✓; orders/stock stubbed (EntityDetailView non-LOCATION stub) ✓.
- **Reuse:** mirrors `getLocationDetail` + `getAdminLocationDetail` + `locations/[id]/page.tsx` + EntityDetailView; no new patterns.
- **Type consistency:** `AdminWarehouseDetail`/`AdminStoreDetail` extend their list items; routes pass `entityType` WAREHOUSE/STORE + `ordersRow={null}`.
- **Deploy:** accounts endpoints + dashboard only; no Settlo Common bump, no config keys.

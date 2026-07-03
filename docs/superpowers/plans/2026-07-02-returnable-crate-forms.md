# Returnable-Crate Form Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This plan spans TWO repos** — each task names its repo + working directory.

**Goal:** Let a merchant configure returnable crates from the stock form (deposit on the empty crate, a returnable-container link on the full crate), and close the backend M1 gap so the create paths persist those fields.

**Architecture:** Backend — wire per-variant `depositValue`/`depositCurrency` + `returnableContainers` into every `StockVariant` construction site (`StockService.create()`, which `/stocks/with-product` delegates to; plus CSV import). Frontend — extend the stock form's variant rows with `materialType`-gated deposit fields and a returnable-container picker (reusing `StockVariantSelector` + `CurrencySelector`), and thread the fields through the stock server actions.

**Tech Stack:** Backend: Java 21, Spring Boot 4.0.5, JPA, Maven. Frontend: Next.js 15 (App router), React 19, react-hook-form + zod, Radix + Tailwind, axios + server actions.

## Global Constraints

- **Two repos.** Backend = `/Users/Peter/Settlo/Settlo Inventory Service` (`BE`). Frontend = `/Users/Peter/Settlo/Customer-Dashboard` (`FE`). Both are on branch `alpha`; the backend container feature is already merged there.
- **Backend build/test:** offline + targeted — `mvn -o test -Dtest=ClassName`. Unit-only (no Testcontainers; Docker may be down). Migrations validate at deploy under `ddl-auto=validate`. `SettloBusinessException` = `co.tz.settlo.common.exception.SettloBusinessException`.
- **Frontend has NO test runner** (no jest/vitest/@testing-library, no `test` script). The gate per FE task is **`npm run lint` + `npm run build`** (Next build runs the TS typecheck), plus a manual checklist for UI. Do NOT add a test runner.
- **Commit trailer** on every commit (both repos): `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **`materialType` gating rule:** `PACKAGING` → deposit fields; any other type → returnable-container link. Enforced **authoritatively in the FE server action** (stock-level `materialType` is known there) — it drops the irrelevant field before sending. The UI (F3) only shows/hides.
- **Container link shape:** one container in the UI; a **list** in the payload (`returnableContainers: [{ containerStockVariantId, quantityPerUnit }]`), so crate+bottles is a later add with no schema change.
- **Backend field names** (already exist on `CreateStockVariantRequest`): `depositValue: BigDecimal`, `depositCurrency: String`, `returnableContainers: List<ReturnableContainerLinkRequest>` where `ReturnableContainerLinkRequest = { containerStockVariantId: UUID, quantityPerUnit: BigDecimal }`.
- Do NOT commit the unrelated in-flight `pom.xml`/`SecurityConfig.java` edits in the backend working tree.

---

### Task 1 (BE): Persist deposit + links in `StockService.create()`

Closes M1 for `POST /api/v1/stocks` AND `POST /api/v1/stocks/with-product` (the latter delegates to `create()` at `ProductStockComposerService.java:171`).

**Files:**
- Modify: `src/main/java/co/tz/settlo/inventory/stock/service/StockService.java` (`create()`, ~lines 198–279)
- Test: `src/test/java/co/tz/settlo/inventory/stock/service/StockServiceCreateM1Test.java` (new)

**Interfaces:**
- Consumes: `returnableContainerLinkService.replaceLinks(UUID sellableVariantId, List<ReturnableContainerLinkRequest>)` (already a `StockService` field, line 72); `CreateStockVariantRequest.getDepositValue()/getDepositCurrency()/getReturnableContainers()`.
- Produces: `create()` now persists per-variant deposit + returnable-container links.

- [ ] **Step 1: Write the failing test** — `StockServiceCreateM1Test.java`

```java
package co.tz.settlo.inventory.stock.service;

import co.tz.settlo.inventory.container.dto.ReturnableContainerLinkRequest;
import co.tz.settlo.inventory.container.dto.ReturnableContainerLinkResponse;
import co.tz.settlo.inventory.container.service.ReturnableContainerLinkService;
import co.tz.settlo.inventory.stock.dto.CreateStockRequest;
import co.tz.settlo.inventory.stock.dto.CreateStockVariantRequest;
import co.tz.settlo.inventory.stock.dto.StockResponse;
import co.tz.settlo.inventory.stock.model.Stock;
import co.tz.settlo.inventory.stock.model.StockVariant;
import co.tz.settlo.inventory.stock.repository.StockRepository;
import co.tz.settlo.inventory.stock.repository.StockVariantRepository;
import co.tz.settlo.inventory.uom.model.UnitOfMeasure;
import co.tz.settlo.inventory.uom.repository.UnitOfMeasureRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceCreateM1Test {

    @Mock StockRepository stockRepository;
    @Mock StockVariantRepository stockVariantRepository;
    @Mock UnitOfMeasureRepository unitOfMeasureRepository;
    @Mock ReturnableContainerLinkService returnableContainerLinkService;
    @Mock co.tz.settlo.inventory.location.service.LocationConfigService locationConfigService;
    @Mock co.tz.settlo.common.kafka.TracedKafkaProducer kafkaProducer;

    @InjectMocks StockService stockService;

    @Test
    void createPersistsDepositAndInvokesReplaceLinks() {
        UUID businessId = UUID.randomUUID();
        UUID locationId = UUID.randomUUID();
        UUID baseUnitId = UUID.randomUUID();
        UUID containerId = UUID.randomUUID();

        UnitOfMeasure unit = new UnitOfMeasure();
        unit.setId(baseUnitId);
        unit.setName("Crate");
        when(unitOfMeasureRepository.findVisibleToBusiness(eq(baseUnitId), any()))
                .thenReturn(Optional.of(unit));
        when(stockRepository.existsByLocationIdAndNameAndDeletedAtIsNull(locationId, "Coca-Cola Crate"))
                .thenReturn(false);
        when(stockRepository.save(any())).thenAnswer(inv -> {
            Stock s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            for (StockVariant v : s.getVariants()) {
                if (v.getId() == null) v.setId(UUID.randomUUID());
            }
            return s;
        });
        ReturnableContainerLinkResponse linkResp = new ReturnableContainerLinkResponse();
        linkResp.setContainerStockVariantId(containerId);
        when(returnableContainerLinkService.replaceLinks(any(), any())).thenReturn(List.of(linkResp));

        CreateStockVariantRequest variant = new CreateStockVariantRequest();
        variant.setName("Coca-Cola Crate");
        variant.setDepositValue(new BigDecimal("2000"));
        variant.setDepositCurrency("TZS");
        variant.setReturnableContainers(List.of(new ReturnableContainerLinkRequest(containerId, BigDecimal.ONE)));

        CreateStockRequest request = new CreateStockRequest();
        request.setName("Coca-Cola Crate");
        request.setBaseUnitId(baseUnitId);
        request.setVariants(List.of(variant));

        StockResponse response = stockService.create(businessId, locationId, request);

        // Deposit persisted onto the saved variant
        ArgumentCaptor<Stock> cap = ArgumentCaptor.forClass(Stock.class);
        verify(stockRepository).save(cap.capture());
        StockVariant savedVariant = cap.getValue().getVariants().get(0);
        assertThat(savedVariant.getDepositValue()).isEqualByComparingTo("2000");
        assertThat(savedVariant.getDepositCurrency()).isEqualTo("TZS");

        // Links wired via the container service, keyed on the saved variant id
        verify(returnableContainerLinkService).replaceLinks(eq(savedVariant.getId()), any());
        assertThat(response).isNotNull();
    }
}
```

- [ ] **Step 2: Run it to verify it fails**

Run: `mvn -o test -Dtest=StockServiceCreateM1Test`
Expected: FAIL — `savedVariant.getDepositValue()` is null (create doesn't set it) and `replaceLinks` is never invoked.

- [ ] **Step 3: Set deposit in the variant loop** — in `StockService.create()`, inside the variant loop, right after `variant.setSerialTracked(Boolean.TRUE.equals(varReq.getSerialTracked()));` (~line 205):

```java
                variant.setDepositValue(varReq.getDepositValue());
                variant.setDepositCurrency(varReq.getDepositCurrency());
```

- [ ] **Step 4: Wire links after save** — in `create()`, inside the existing `if (!draft && request.getVariants() != null) { ... }` block, after the reorder-config loop (~line 278, before the closing `}` of that block), add:

```java
            // Returnable-container links per variant (deposit is set inline in the
            // variant loop above). Done after save so each variant has an id; a link
            // may reference an earlier-created container variant (the empty crate) or
            // a sibling. replaceLinks validates existence + same-location + non-self.
            for (CreateStockVariantRequest varReq : request.getVariants()) {
                if (varReq.getReturnableContainers() == null || varReq.getReturnableContainers().isEmpty()) {
                    continue;
                }
                saved.getVariants().stream()
                        .filter(v -> v.getName().equalsIgnoreCase(varReq.getName()))
                        .findFirst()
                        .ifPresent(variant -> returnableContainerLinkService.replaceLinks(
                                variant.getId(), varReq.getReturnableContainers()));
            }
```

- [ ] **Step 5: Run it to verify it passes**

Run: `mvn -o test -Dtest=StockServiceCreateM1Test`
Expected: PASS.
Run: `mvn -o test -Dtest=StockServiceContainerLinkTest`
Expected: PASS (regression — the `deleteVariant` guard test is unaffected).

- [ ] **Step 6: Commit**

```bash
git -C "/Users/Peter/Settlo/Settlo Inventory Service" add \
  src/main/java/co/tz/settlo/inventory/stock/service/StockService.java \
  src/test/java/co/tz/settlo/inventory/stock/service/StockServiceCreateM1Test.java
git -C "/Users/Peter/Settlo/Settlo Inventory Service" commit -m "fix(container): persist deposit + returnable links in StockService.create (M1)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2 (BE): CSV import — deposit + material_type columns

Completes M1 for the CSV path. Adds optional `deposit_value`, `deposit_currency`, and `material_type` columns so bulk-imported empty crates carry a deposit. (Returnable-container *links* remain form-only — a CSV can't reference a target variant id.)

**Files:**
- Modify: `src/main/java/co/tz/settlo/inventory/stock/service/StockService.java` (`CsvStockRow` inner class, `parseCsvFile` ~655–743, `importFromCsv` ~562–594)
- Test: `src/test/java/co/tz/settlo/inventory/stock/service/StockServiceCsvDepositTest.java` (new)

**Interfaces:**
- Consumes: `MaterialType` enum (`co.tz.settlo.inventory.stock.enums.MaterialType`).
- Produces: CSV import persists per-variant `depositValue`/`depositCurrency` and stock-level `materialType` from the named columns.

- [ ] **Step 1: Write the failing test** — `StockServiceCsvDepositTest.java`

```java
package co.tz.settlo.inventory.stock.service;

import co.tz.settlo.inventory.common.enums.DestinationType;
import co.tz.settlo.inventory.stock.enums.MaterialType;
import co.tz.settlo.inventory.stock.model.Stock;
import co.tz.settlo.inventory.stock.model.StockVariant;
import co.tz.settlo.inventory.stock.repository.StockRepository;
import co.tz.settlo.inventory.uom.model.UnitOfMeasure;
import co.tz.settlo.inventory.uom.repository.UnitOfMeasureRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockServiceCsvDepositTest {

    @Mock StockRepository stockRepository;
    @Mock UnitOfMeasureRepository unitOfMeasureRepository;
    @Mock co.tz.settlo.inventory.location.service.LocationConfigService locationConfigService;
    @Mock EntityManager entityManager;

    @InjectMocks StockService stockService;

    @Test
    void csvImportPersistsDepositAndMaterialType() {
        UUID locationId = UUID.randomUUID();
        UnitOfMeasure unit = new UnitOfMeasure();
        unit.setId(UUID.randomUUID());
        unit.setName("Crate");
        unit.setAbbreviation("crate");
        when(unitOfMeasureRepository.findAllVisibleToBusiness(any())).thenReturn(List.of(unit));
        when(stockRepository.findAllNamesByLocationId(locationId)).thenReturn(Set.of());
        when(stockRepository.saveAll(any())).thenAnswer(inv -> {
            List<Stock> chunk = inv.getArgument(0);
            for (Stock s : chunk) {
                s.setId(UUID.randomUUID());
                for (StockVariant v : s.getVariants()) v.setId(UUID.randomUUID());
            }
            return chunk;
        });

        String csv = "name,base_unit,material_type,deposit_value,deposit_currency\n"
                + "Empty Crate,crate,PACKAGING,2000,TZS\n";
        MockMultipartFile file = new MockMultipartFile(
                "file", "crates.csv", "text/csv", csv.getBytes(StandardCharsets.UTF_8));

        stockService.importFromCsv(locationId, DestinationType.LOCATION, file);

        ArgumentCaptor<List<Stock>> cap = ArgumentCaptor.forClass(List.class);
        verify(stockRepository).saveAll(cap.capture());
        Stock saved = cap.getValue().get(0);
        assertThat(saved.getMaterialType()).isEqualTo(MaterialType.PACKAGING);
        StockVariant v = saved.getVariants().get(0);
        assertThat(v.getDepositValue()).isEqualByComparingTo("2000");
        assertThat(v.getDepositCurrency()).isEqualTo("TZS");
    }
}
```
(Add `import static org.mockito.Mockito.verify;`.)

- [ ] **Step 2: Run it to verify it fails**

Run: `mvn -o test -Dtest=StockServiceCsvDepositTest`
Expected: FAIL — `materialType` is `FINISHED_GOOD` (default) and the variant's deposit is null.

- [ ] **Step 3: Add fields to `CsvStockRow`** — in the `CsvStockRow` inner class of `StockService`, add:

```java
        BigDecimal depositValue;
        String depositCurrency;
        String materialType;
```

- [ ] **Step 4: Parse the new columns** — in `parseCsvFile`, after the `sku` assignment (`row.sku = emptyToNull(getCol(line, cols, "sku"));`, ~line 702), add:

```java
                row.materialType = emptyToNull(getCol(line, cols, "material_type"));
                row.depositCurrency = emptyToNull(getCol(line, cols, "deposit_currency"));
                String depositStr = getCol(line, cols, "deposit_value");
                if (!depositStr.isEmpty()) {
                    try {
                        row.depositValue = new BigDecimal(depositStr);
                    } catch (NumberFormatException e) {
                        result.addError(rowNum, "Invalid deposit_value: " + depositStr);
                        continue;
                    }
                }
```

- [ ] **Step 5: Apply in `importFromCsv`** — (a) set `materialType` on the stock (after `stock.setBaseUnit(baseUnit);`, ~line 566):

```java
            if (firstRow.materialType != null) {
                try {
                    stock.setMaterialType(MaterialType.valueOf(firstRow.materialType.trim().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    rows.forEach(r -> result.addError(r.rowNum, "Invalid material_type: " + firstRow.materialType));
                    continue;
                }
            }
```

(b) set deposit on the custom variant (after `variant.setIsDefault(isFirst);`, ~line 590):

```java
                    variant.setDepositValue(row.depositValue);
                    variant.setDepositCurrency(row.depositCurrency);
```

(c) set deposit on the default-variant path (replace the `stock.getVariants().add(buildDefaultVariant(stock, baseUnit));` line, ~line 572):

```java
                StockVariant defaultVariant = buildDefaultVariant(stock, baseUnit);
                defaultVariant.setDepositValue(firstRow.depositValue);
                defaultVariant.setDepositCurrency(firstRow.depositCurrency);
                stock.getVariants().add(defaultVariant);
```

- [ ] **Step 6: Run it to verify it passes**

Run: `mvn -o test -Dtest=StockServiceCsvDepositTest`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git -C "/Users/Peter/Settlo/Settlo Inventory Service" add \
  src/main/java/co/tz/settlo/inventory/stock/service/StockService.java \
  src/test/java/co/tz/settlo/inventory/stock/service/StockServiceCsvDepositTest.java
git -C "/Users/Peter/Settlo/Settlo Inventory Service" commit -m "fix(container): CSV import persists deposit + material_type columns (M1)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3 (FE): Types + schema

**Files:**
- Modify: `types/stock/type.ts`
- Modify: `types/stock/schema.ts`

**Interfaces:**
- Produces: `StockVariant` gains `depositValue?`, `depositCurrency?`, `returnableContainers?: ReturnableContainerLinkInput[]`; new exported `ReturnableContainerLinkInput`; `StockVariantSchema` gains the three fields.

- [ ] **Step 1: Add the input type** — in `types/stock/type.ts`, add (near the top, before `StockVariant`):

```ts
export interface ReturnableContainerLinkInput {
  /** Only present after a round-trip read. */
  id?: string;
  containerStockVariantId: string;
  containerName?: string;
  quantityPerUnit: number;
  depositValue?: number | null;
  depositCurrency?: string | null;
}
```

and add to the `StockVariant` interface (after `serialTracked`):

```ts
  depositValue?: number | null;
  depositCurrency?: string | null;
  returnableContainers?: ReturnableContainerLinkInput[];
```

- [ ] **Step 2: Add schema fields** — in `types/stock/schema.ts`, inside `StockVariantSchema` (before the closing `})` that precedes `.superRefine`), add:

```ts
  depositValue: preprocess(toNumber, number().nonnegative().optional()),
  depositCurrency: string().length(3, "Currency must be a 3-letter ISO code").optional().nullish(),
  returnableContainers: array(
    object({
      containerStockVariantId: string().uuid(),
      quantityPerUnit: preprocess(toNumber, number().positive()),
    }),
  ).optional(),
```

(No new refine needed: `materialType` gating is enforced in the server action; the array entry schema already requires a complete row.)

- [ ] **Step 3: Verify typecheck + lint**

Run (from `/Users/Peter/Settlo/Customer-Dashboard`): `npm run lint && npm run build`
Expected: PASS (compiles; no type errors introduced).

- [ ] **Step 4: Commit**

```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add types/stock/type.ts types/stock/schema.ts
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(stock): add deposit + returnableContainers to stock variant types/schema" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4 (FE): Thread fields through the stock server actions

**Files:**
- Modify: `lib/actions/stock-actions.tsx` (`createStock` ~136–154, `createStockWithProduct` ~493–517, `updateStock` variant `POST`/`PUT` ~206–229, `saveStockDraft`'s `mapStockVariantPartial` ~568–589)

**Interfaces:**
- Consumes: the F1 variant fields.
- Produces: payloads carry `depositValue`/`depositCurrency`/`returnableContainers`, gated by stock-level `materialType`.

- [ ] **Step 1: Add a shared gating helper** — near the top of `lib/actions/stock-actions.tsx` (after imports), add:

```ts
// Returnable-crate gating: deposit belongs to a PACKAGING container variant;
// the returnable-container link belongs to a sellable (non-PACKAGING) variant.
// materialType is stock-level, so it decides for all variants — drop the
// irrelevant field so stale form state can't send a nonsensical payload.
function containerFields(
  v: { depositValue?: number | null; depositCurrency?: string | null; returnableContainers?: { containerStockVariantId: string; quantityPerUnit: number }[] },
  materialType: string,
) {
  const isPackaging = materialType === "PACKAGING";
  return {
    depositValue: isPackaging ? v.depositValue ?? undefined : undefined,
    depositCurrency: isPackaging ? v.depositCurrency || undefined : undefined,
    returnableContainers:
      !isPackaging && v.returnableContainers && v.returnableContainers.length > 0
        ? v.returnableContainers
        : undefined,
  };
}
```

- [ ] **Step 2: `createStock`** — in the `variants: validated.data.variants.map((v) => ({ ... }))` block, spread the helper into each mapped variant (after `overstockThreshold: v.overstockThreshold,`):

```ts
        ...containerFields(v, validated.data.materialType),
```

- [ ] **Step 3: `createStockWithProduct`** — same one-line spread in its variant map (after `sellingPrice: v.sellingPrice,`):

```ts
        ...containerFields(v, validated.data.materialType),
```

- [ ] **Step 4: `updateStock`** — add the fields to BOTH the new-variant `POST` body and the existing-variant `PUT` body. New-variant POST body becomes:

```ts
          {
            name: variant.name,
            sku: variant.sku || undefined,
            barcode: variant.barcode || undefined,
            serialTracked: variant.serialTracked,
            ...containerFields(variant, validated.data.materialType),
          },
```

Existing-variant PUT body becomes:

```ts
          {
            name: variant.name,
            sku: variant.sku || undefined,
            barcode: variant.barcode ?? "",
            serialTracked: variant.serialTracked,
            ...containerFields(variant, validated.data.materialType),
          },
```

- [ ] **Step 5: `saveStockDraft`** — `mapStockVariantPartial` doesn't receive `materialType`; drafts can carry deposit safely without gating (links are optional on a draft). Add to the returned object (after `overstockThreshold: v.overstockThreshold,`):

```ts
    depositValue: v.depositValue ?? undefined,
    depositCurrency: v.depositCurrency || undefined,
    returnableContainers:
      v.returnableContainers && v.returnableContainers.length > 0
        ? v.returnableContainers
        : undefined,
```

(Also add `depositValue?`, `depositCurrency?`, `returnableContainers?` to the `DraftStockVariant` type if it's a local interface in this file; if it derives from the schema, no change needed.)

- [ ] **Step 6: Verify typecheck + lint**

Run (from `/Users/Peter/Settlo/Customer-Dashboard`): `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add lib/actions/stock-actions.tsx
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(stock): send deposit + returnableContainers from stock actions (materialType-gated)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 (FE): Stock form — deposit + returnable-container UI

**Files:**
- Modify: `components/forms/stock_form.tsx`

**Interfaces:**
- Consumes: F1 types; `StockVariantSelector` (`@/components/widgets/stock-variant-selector`), `CurrencySelector` (`@/components/widgets/currency-selector`), `getCachedStocks` (`@/lib/cache/reference-data`).

- [ ] **Step 1: Imports + packaging-variant ids (parent `StockForm`)** — add imports:

```ts
import StockVariantSelector from "@/components/widgets/stock-variant-selector";
import CurrencySelector from "@/components/widgets/currency-selector";
import { getCachedStocks } from "@/lib/cache/reference-data";
```

In `StockForm`, near the existing `const materialType = form.watch("materialType");` (line 228), add state + effect to compute the ids of variants that belong to `PACKAGING` stocks (the valid containers):

```ts
  const [packagingVariantIds, setPackagingVariantIds] = useState<string[]>([]);
  useEffect(() => {
    getCachedStocks()
      .then((stocks) =>
        setPackagingVariantIds(
          stocks
            .filter((s) => s.materialType === "PACKAGING" && !s.archived)
            .flatMap((s) => s.variants.filter((v) => !v.archived).map((v) => v.id)),
        ),
      )
      .catch(() => setPackagingVariantIds([]));
  }, []);
```

- [ ] **Step 2: Thread `materialType` + `packagingVariantIds` into `VariantRow`** — add to `VariantRowProps`:

```ts
  materialType: string;
  packagingVariantIds: string[];
```

destructure them in `VariantRowImpl(...)`, and pass them where `<VariantRow ... />` is instantiated (after `locationCurrency={locationCurrency}`):

```tsx
                        materialType={materialType}
                        packagingVariantIds={packagingVariantIds}
```

- [ ] **Step 3: Extend the variant defaults** — in `DEFAULT_VARIANT`, add:

```ts
  depositValue: undefined as number | undefined,
  depositCurrency: undefined as string | undefined,
  returnableContainers: [] as { containerStockVariantId: string; quantityPerUnit: number }[],
```

and add the same three keys to the edit-mode `item.variants.map((v) => ({ ... }))` block (after `sellingPrice: ...`):

```ts
            depositValue: v.depositValue ?? undefined,
            depositCurrency: v.depositCurrency ?? undefined,
            returnableContainers: v.returnableContainers ?? [],
```

- [ ] **Step 4: Render the deposit block (PACKAGING)** — inside `VariantRowImpl`'s returned JSX, after the variant's main fields and before the reorder block, add (shown in create AND edit — no `!isEditing` gate):

```tsx
      {materialType === "PACKAGING" && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border bg-amber-50/40 p-3">
          <p className="col-span-full text-[11px] text-muted-foreground">
            Deposit held per empty container (crate/bottle). Used for deposit valuation.
          </p>
          <FormField
            control={form.control}
            name={`variants.${index}.depositValue`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs">Deposit value</FormLabel>
                <FormControl>
                  <NumericFormat
                    className="flex h-10 w-full rounded-md border-0 bg-white px-3 py-2 text-sm"
                    value={f.value ?? ""}
                    onValueChange={(v) => f.onChange(v.value === "" ? undefined : Number(v.value))}
                    thousandSeparator
                    decimalScale={4}
                    allowNegative={false}
                    placeholder="e.g. 2000"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`variants.${index}.depositCurrency`}
            render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-xs">Deposit currency</FormLabel>
                <FormControl>
                  <CurrencySelector
                    value={f.value || locationCurrency || "TZS"}
                    onChange={f.onChange}
                    isDisabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
```

- [ ] **Step 5: Render the returnable-container block (non-PACKAGING)** — add, alongside the deposit block:

```tsx
      {materialType !== "PACKAGING" && (
        <FormField
          control={form.control}
          name={`variants.${index}.returnableContainers`}
          render={({ field: f }) => {
            const current = (f.value ?? [])[0] as
              | { containerStockVariantId: string; quantityPerUnit: number }
              | undefined;
            const setContainer = (id: string) =>
              f.onChange(id ? [{ containerStockVariantId: id, quantityPerUnit: current?.quantityPerUnit ?? 1 }] : []);
            const setQty = (qty: number | undefined) =>
              current?.containerStockVariantId
                ? f.onChange([{ containerStockVariantId: current.containerStockVariantId, quantityPerUnit: qty ?? 1 }])
                : undefined;
            return (
              <div className="mt-2 space-y-2 rounded-md border bg-gray-50/50 p-3">
                <p className="text-[11px] text-muted-foreground">
                  Returnable container exchanged on sale (e.g. an empty crate). Optional.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium">Empty container</label>
                    <StockVariantSelector
                      value={current?.containerStockVariantId ?? ""}
                      onChange={setContainer}
                      allowedValues={packagingVariantIds}
                      isDisabled={isPending}
                      placeholder="Select the empty crate/bottle"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Qty per unit</label>
                    <NumericFormat
                      className="flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm"
                      value={current?.quantityPerUnit ?? ""}
                      onValueChange={(v) => setQty(v.value === "" ? undefined : Number(v.value))}
                      thousandSeparator
                      decimalScale={6}
                      allowNegative={false}
                      placeholder="1"
                      disabled={isPending || !current?.containerStockVariantId}
                    />
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}
```

- [ ] **Step 6: Verify typecheck + lint**

Run (from `/Users/Peter/Settlo/Customer-Dashboard`): `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 7: Manual verification checklist** (no test runner — verify by hand)

Run `npm run dev`, then:
1. Create a stock item, set **Material type = Packaging**, one variant → the **Deposit value/currency** fields appear (and the container picker does not). Save. In the browser Network tab, the `POST /api/v1/stocks` body shows `variants[0].depositValue` set and no `returnableContainers`.
2. Create a stock item, Material type = **Trading Good**, "also create product" on → the **Returnable container** picker appears (listing only PACKAGING variants incl. the crate from step 1) + Qty per unit; pick it, qty 1. Save → the payload shows `variants[0].returnableContainers: [{ containerStockVariantId, quantityPerUnit: 1 }]` and no deposit.
3. Edit each and confirm the persisted values round-trip into the form.

- [ ] **Step 8: Commit**

```bash
git -C "/Users/Peter/Settlo/Customer-Dashboard" add components/forms/stock_form.tsx
git -C "/Users/Peter/Settlo/Customer-Dashboard" commit -m "feat(stock): materialType-gated deposit + returnable-container fields on the stock form" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes / follow-ups (out of scope)
- Product-form link UI; deposit-valuation dashboard view; multi-container-per-variant UI (payload already supports a list).
- If a downloadable **CSV template** exists in the FE, add the `material_type`/`deposit_value`/`deposit_currency` columns to it (docs-only).
- Returnable-container links via CSV remain unsupported (a CSV can't cleanly reference a target variant id).

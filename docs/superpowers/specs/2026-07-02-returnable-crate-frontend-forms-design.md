# Returnable-Crate Form Support — Design

**Date:** 2026-07-02
**Status:** Design — awaiting review
**Repos:** `Customer-Dashboard` (frontend, primary) + `Settlo Inventory Service` (backend, M1 closure)

## 1. Problem

The backend now supports returnable-crate tracking (empty crate = a `PACKAGING` stock variant carrying a deposit; a sellable full-crate stock variant links to it via `returnableContainers`; movements auto-fire on sale/refund/receipt; a deposit-valuation endpoint exists). The Customer-Dashboard admin UI can't yet configure any of it:
- The stock form has a `materialType` dropdown (so `PACKAGING` is already selectable) but **no deposit fields** and **no returnable-container link UI**.
- The stock **create** endpoints silently drop per-variant `depositValue`/`depositCurrency` and `returnableContainers` (backend **M1 gap**) — only the per-variant edit endpoints persist them.

Goal: let a merchant configure the whole returnable-crate setup from the **stock form**, in one submit, and close the backend M1 gap so create works.

## 2. Scope (decided)

- **Close M1 fully** on the backend (all `StockVariant` construction sites), so create persists deposit + links.
- **Stock-form-only** on the frontend — the returnable link is a stock-variant property; the product form is unchanged.
- Fields are **gated by `materialType`** (deposit shows for `PACKAGING`; the container picker shows for other types).

**Out of scope:** product-form link UI; a deposit-valuation dashboard view; multi-container-per-variant *UI* (payload already supports a list); returnable-container *links* via CSV import (deposit columns yes, links no — CSV can't cleanly reference a target variant id).

## 3. Backend — close M1 (Settlo Inventory Service)

`StockService` builds `StockVariant`s in several places without the deposit/link wiring that `addVariant`/`updateVariant` already do (Tasks 1 & 4 of the backend feature). `StockService` already holds the `returnableContainerLinkService` dependency.

Close the gap at every construction site:

| Site | `depositValue`/`depositCurrency` | `returnableContainers` |
|---|---|---|
| `create()` (`POST /api/v1/stocks`) | set per variant | after saving all variants, `returnableContainerLinkService.replaceLinks(savedVariantId, req.getReturnableContainers())` when present |
| `createStockWithProduct` (`/stocks/with-product`) | set per variant | same as above |
| `buildDefaultVariant` | copy request-level deposit if the path carries it | n/a (no per-variant link input) |
| CSV import | add `deposit_value`/`deposit_currency` columns to the parser/template | **not supported** (links are form/edit-only) |

**Ordering note:** in the bulk paths, save all variants first, then wire links — so a link may target a sibling variant in the same request; the normal case targets the already-created empty crate. `replaceLinks` already validates existence + same-location + non-self.

**Tests:** unit tests (mirroring the existing `StockService`/`StockServiceContainerLinkTest` Mockito style) asserting `create()` and the with-product path persist `depositValue` and invoke `replaceLinks` with the request's `returnableContainers`; a test that CSV import maps the new deposit columns. Offline unit-only per repo convention (`mvn -o test -Dtest=...`).

## 4. Frontend — stock form (Customer-Dashboard)

Tech: Next.js 15 (App router) / React 19 / react-hook-form + zod / Radix + Tailwind / axios + server actions.

### 4.1 Gating rule (the whole UX in one sentence)
`materialType` drives which fields appear on each variant row:
- **`materialType === "PACKAGING"`** (the empty crate) → show **`depositValue`** (numeric) + **`depositCurrency`** (select); hide the container picker.
- **any other `materialType`** (the full crate, e.g. `TRADING_GOOD`) → show a **"Returnable container"** row (a `StockVariantSelector` filtered to `PACKAGING` variants + a `quantityPerUnit` numeric input); hide deposit.

### 4.2 Types & schema
- `types/stock/type.ts` `StockVariant`: add `depositValue?: number | null`, `depositCurrency?: string | null`, `returnableContainers?: ReturnableContainerLink[]`. Add a `ReturnableContainerLink` type `{ id?, containerStockVariantId, containerName?, quantityPerUnit, depositValue?, depositCurrency? }`.
- `types/stock/schema.ts` `StockVariantSchema`: add `depositValue` (optional nonneg number, preprocessed), `depositCurrency` (optional string), `returnableContainers` (optional array of `{ containerStockVariantId: uuid, quantityPerUnit: positive number }`).
  - Cross-field refinement: when `materialType !== "PACKAGING"` and a container row is present, require `containerStockVariantId` + `quantityPerUnit > 0`. (Deposit stays optional.)

### 4.3 Form (`components/forms/stock_form.tsx`, `VariantRow`)
- Add two conditional blocks in `VariantRow`, following the existing collapsible "Reorder & alert config" section pattern.
- **Deposit block** (when `PACKAGING`): `depositValue` via the existing NumericFormat input pattern; `depositCurrency` via the existing currency `Select` (default the business/location currency, e.g. TZS).
- **Returnable-container block** (when not `PACKAGING`): reuse `components/widgets/stock-variant-selector.tsx`. Filter to `PACKAGING` variants via its `allowedValues` prop — compute allowed ids from the cached stocks (`getCachedStocks()` already returns `materialType`). Plus a `quantityPerUnit` numeric input (default `1`). Single row in the UI; stored/sent as a one-element list.
- `materialType` lives at stock level; the `VariantRow` reads it (via form context/prop) to decide which block to render.

### 4.4 Server actions (`lib/actions/stock-actions.tsx`)
Thread the three fields through the variant mapping in: `createStock` (→ `/api/v1/stocks`), `createStockWithProduct` (→ `/stocks/with-product`), the per-variant `POST`/`PUT` in `updateStock` (→ `/variants`), and `saveStockDraft` (deposit/link optional for drafts).

## 5. Data flow (end to end)
1. Merchant creates the **empty crate**: stock form, `materialType: PACKAGING`, one variant with `depositValue`/`depositCurrency`. → `createStock` → backend persists deposit (M1 fix).
2. Merchant creates the **full crate** (sellable): stock form, `materialType: TRADING_GOOD`, "also create product" on, variant's "Returnable container" row = the empty-crate variant + `quantityPerUnit: 1`. → `createStockWithProduct` → backend persists the link (M1 fix) + auto-creates the product.
3. Editing either later goes through `updateStock`'s per-variant endpoints (already persist deposit/link).

## 6. Testing
- **Backend:** unit tests per §3.
- **Frontend:** confirm a test runner exists (jest/vitest); if so, zod-schema tests for the new fields + the `materialType`-gated refinement. Otherwise a manual verification checklist: (a) create empty crate w/ deposit → inspect network payload has `depositValue`; (b) create full crate linking it → payload has `returnableContainers`; (c) reload/edit shows the persisted values.

## 7. Error handling & edge cases
- Container picker filtered to `PACKAGING` → merchant can't accidentally link a non-container. Backend still validates same-location + non-self + existence.
- Deposit/link fields are optional → non-crate stock is unaffected (feature stays opt-in).
- Draft save tolerates missing deposit/link.
- The picker's filter degrades gracefully if `materialType` is missing on a cached stock (treat as not-allowed).

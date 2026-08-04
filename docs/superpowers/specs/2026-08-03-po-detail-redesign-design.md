# Purchase-order detail redesign — shared order-detail design layer (design)

**Date:** 2026-08-03
**Repo:** Customer-Dashboard (only)
**Source design:** claude.ai/design project `019dd974-e60d-78f5-9a35-a8ae67b2f90a` — `Settlo LPO Financing.html` + `order.css` (the `.od-*` design system), read alongside its `order-dir-b.jsx` direction.
**Reference implementation (internal):** `app/(protected)/orders/[id]/order-detail-view.tsx` — the sales-order detail page, which already ships this design language.

## 1. Summary

The purchase-order detail page (`/purchase-orders/[id]`) renders in the dashboard's older composition while the design calls for the `.od-*` treatment: hairline cards with icon-chip headers, mono uppercase table headers, tabular figures, a dot-badge status vocabulary, and a persistent summary rail beside the main content.

The palette is **already in place** — `app/globals.css` defines `--canvas`, `--ink`/`--ink-2`/`--ink-3`, `--line`/`--line-2` and `--primary` with values matching `order.css`, and JetBrains Mono is wired as `--font-mono`. What is missing is composition and component treatment.

The sales-order detail page already solved this once, using ~12 page-local primitives. Rather than copy them a second time, this work **lifts the generic ones into the shared layer, restyles the shared primitives to the `.od-*` treatment, migrates the sales-order page onto them, and composes the purchase-order page from the same set.** One system, two pages.

## 2. Ratified decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Where the treatment lives | Shared primitives (not page-local copies, not a design-system-first audit). |
| D2 | Rail side on the PO page | **Left**, matching the existing sales-order page — internal consistency wins over the mock, which puts it right. |
| D3 | Sales-order page | **Migrated onto the shared primitives** in this work, so the codebase ends with one system rather than two. |
| D4 | `KpiStrip` | Untouched — it already implements the design's `.od-kpis` contract. |
| D5 | Money/profit primitives | Stay local to the sales-order page (`MoneyHero`, `ProfitSplit`, `Ledger`, `LRow`, `LegendItem`) — they are sales-domain, not order-detail-generic. |
| D6 | Out of scope | Other pages' composition, the print/share views, and the public LPO acknowledgement view. |

## 3. The shared order-detail layer

New module: `components/layouts/order-detail/` — primitives shared by both order-detail pages.

**Extracted from the sales-order page** (behaviour-preserving lift, not a rewrite):

| Primitive | Purpose | `order.css` analogue |
|---|---|---|
| `StatusPill` | Header status with leading dot | `.od-badge` |
| `StatusTag` | Compact mono uppercase tag | `.od-tag` |
| `IconChip` | 24px tinted icon square in card heads | `.od-card-title .ico` |
| `CountChip` | Mono count pill ("1 line") | `.od-card-count` |
| `RailCard` | Rail-width card with icon + title | `.od-rail-card` |
| `PanelCard` | Main-column card, optional zero-padding | `.od-card`, `.od-card.pad0` |
| `SegTabs` | Segmented drill-down control | `.od-seg` |

**New in the shared layer** (both pages need it; the design specifies it):

| Primitive | Purpose | `order.css` analogue |
|---|---|---|
| `VList` / `VRow` | Key/value rows with hairline dividers, mono keys | `.od-vlist` / `.od-vrow` |
| `DetailTable` | Table treatment: mono uppercase tracked headers on canvas, hairline row dividers, `align="right"` tabular numerals, dimmed-cell tone, totals row | `.od-tbl` |

**Restyled in place** (existing shared components, additive where possible):

- `Card` — hairline `border-line`, `rounded-xl`; new `pad0` variant; new `CardHead` composing `IconChip` + title + trailing slot.
- `Badge` — new dot variant carrying the design's tones (`ok`, `open`, `warn`, `neg`, `muted`, `primary`).
- `PageHeader` — title scale 26px/700/−0.03em and a mono submeta line. **This changes every page's header**; it is the one non-additive change and is deliberate per D1.

## 4. Purchase-order page composition

Rebuilt `app/(protected)/purchase-orders/[id]/page.tsx` to this order, per the design HTML with D2's rail flip:

1. Breadcrumb.
2. Header — LPO number, status pill, `Settlo financed` pill when applicable, mono submeta (supplier · created · currency), actions: Share / Receive stock / Cancel.
3. **`FinancingBanner`** — directly beneath the header, where the design places it (today it sits far down the page, after the acknowledgement block).
4. `KpiStrip` (5): Items, Ordered, Received (with % received), Outstanding, Order value.
5. Two-column grid, `[360px_minmax(0,1fr)]` — **rail left**, main right:
   - **Rail:** Supplier (`VList`), Supplier acceptance (share link + copy/email + GRN hint), Financing tracker (`FinancingCard`).
   - **Main:** Items (`PanelCard pad0` + `DetailTable` with a totals row and SKU sub-lines), Attachments (dashed dropzone), Notes.

Mixed-currency LPOs keep their existing handling; the totals row uses the page's existing per-currency logic rather than the design's single-currency assumption.

## 5. Sales-order page migration

`order-detail-view.tsx` swaps its seven generic local primitives for the shared imports and deletes the local definitions. Its money/profit primitives (D5) stay. **No visual change is intended** — the shared versions are the lifted implementations. Because the file currently renders correctly, the migration is verified by diffing rendered output expectations rather than by rewriting logic: the lift must be mechanical, and any deliberate visual delta is a defect in this work.

## 6. Verification

Structural breakage is caught mechanically; visual regression is not, so both are addressed:

- `npx tsc --noEmit`, targeted `next lint`, and a full production build (`NODE_OPTIONS=--max-old-space-size=8192 npx next build`, exit 0 + `.next/BUILD_ID`).
- **Archetype smoke pass** — one page per shape, checked and reported: list-with-DataTable, a detail page, a form, settings, the dashboard home, an admin page. These exercise `PageHeader`/`Card`/`Badge`/table treatment across the 220-file blast radius.
- The two order-detail pages checked directly against the design and against each other.

No unit-test harness exists in this repo; this is the honest verification ceiling and is stated as such.

## 7. Risks

- **`PageHeader` typography changes ~220 pages.** Accepted per D1. Mitigated by the archetype smoke pass; a regression here is visible, not silent.
- **Migrating a working 1,371-line page** (D3) risks a regression in a page nobody asked to change. Mitigated by keeping the lift mechanical and reviewing the sales-order page's diff specifically for unintended visual deltas.
- **Two pages, mirrored rails** (D2 vs the mock) — intentional; recorded so a future reader doesn't "fix" it back.

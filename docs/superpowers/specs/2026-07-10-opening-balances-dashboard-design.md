# Opening Balances — Dashboard UI — Design

**Date:** 2026-07-10
**Repo:** Customer-Dashboard (Next.js 15 App Router, React 19, react-hook-form + zod, axios)
**Backend:** Settlo Accounting Service — endpoints already shipped (see `docs/superpowers/specs/2026-07-10-opening-balances-design.md` in that repo)
**Status:** Design — approved, pending spec review

## Problem

Merchants need to record a location's **opening balances** from the dashboard — the starting cash/bank/inventory/loan/equity position that predates their use of the system. The backend shipped (`POST /api/v1/opening-balances`, `GET /api/v1/opening-balances/status`, void via the journal-entry void endpoint), but the Chart of Accounts settings panel has no UI for it. An opening balance is **once per location** (record → view/void → re-record), so no list is needed.

## Backend contract (already shipped — no backend work here)

- `GET /api/v1/opening-balances/status` → `{ posted: boolean, entryId?, entryNumber?, asOfDate?, suggestedAsOfDate?, lines: [{ chartOfAccountId, debit, credit }] }`. `suggestedAsOfDate` = day before the location's earliest activity, else today.
- `POST /api/v1/opening-balances` → body `{ asOfDate?, currencyCode?, lines: [{ chartOfAccountId, amount }] }`. `amount` is **signed, in the account's normal-balance direction**. Returns 201 with the posted entry. Errors (as `SettloBusinessException` code + message): `OPENING_BALANCE_ALREADY_POSTED`, `INVALID_OPENING_ACCOUNT` (non-balance-sheet / foreign / inactive / the system `3200` account), `INVALID_OPENING_DATE` (after first activity), `NO_OPENING_LINES`, `DUPLICATE_ACCOUNT_LINE`. **Balance-sheet accounts only** (ASSET/LIABILITY/EQUITY).
- Void = existing `POST /api/v1/journal-entries/{id}/void` (frontend `voidJournalEntry(id)` already exists). Voiding frees both the service guard and the DB uniqueness index, so a new one can be recorded.
- The backend auto-balances: it posts the residual of the entered lines to a `3200 Opening Balance Equity` account.

## Decisions (agreed)

1. **Surface in `ChartOfAccountsPanel`** as a small status area (record when none; view + void when posted). **No list.**
2. **Record form = add-line picker** — repeatable account + amount rows, with a **live Opening Balance Equity residual preview**.
3. **Omit `currencyCode`** → the entry uses the location's reporting currency (sidesteps the backend's unvalidated-currency follow-up; merchants shouldn't pick a currency here).
4. **Extend `ChartOfAccountSelector`** with an optional `accountTypes?: AccountType[]` allow-list and `excludeIds?: string[]` — the picker shows only balance-sheet accounts, minus already-picked rows and the system `3200` account. Backward-compatible.
5. **Void reuses `voidJournalEntry`** — no new action.

## How it works today (baseline)

- **`ChartOfAccountsPanel`** (`components/settings/panels/chart-of-accounts-panel.tsx`): a `"use client"` component. Loads accounts with `listChartOfAccounts()`, renders a table with edit/delete/toggle, and an "Add account" `Dialog` in the `SettingsSection` footer. Uses `useToast`, `useTransition`, and reads results as `FormResponse` (`{ responseType: "success" | "error", message, data? }`).
- **Server-action pattern** (`lib/actions/chart-of-account-actions.ts`, `lib/actions/journal-entry-actions.ts`): `"use server"`, `new ApiClient()` (`get`/`post`/`put`/`patch`/`delete`), `accountingUrl(path)` (prefixes `ACCOUNTING_SERVICE_URL`), zod `Schema.safeParse(values)`, returns `FormResponse`, `revalidatePath("/settings")`, and an `errResp(error, fallback)` helper that surfaces `error.message`.
- **`voidJournalEntry(id)`** (`journal-entry-actions.ts:128`) already POSTs to `/api/v1/journal-entries/{id}/void` and returns `FormResponse<JournalEntry>`.
- **`ChartOfAccountSelector`** (`components/widgets/chart-of-account-selector.tsx`): a combobox with an optional single `accountType` filter; fetches active accounts via `listChartOfAccounts(accountType)`, groups by type, and calls `onChange(id, account)`.
- **Types** (`types/accounting-mapping/type.ts`): `ChartOfAccount` has `id, code, name, accountType, accountSubType, normalBalance, systemAccount, active, …` — **no `templateCode`** (so exclude the OBE account by its immutable `code === "3200"`). `AccountType`, `NormalBalance`, `ACCOUNT_TYPE_LABELS` exported here. `listChartOfAccounts(accountType?)` lives in `lib/actions/accounting-mapping-actions.ts` and returns `ChartOfAccount[]`. `FormResponse<T>` is in `types/types.ts:62`.
- The dashboard talks to the backend only through these server actions; the backend enforces permissions and returns 4xx with a code/message that `errResp` surfaces.

## Design

### 1. Pure preview helper — `lib/opening-balance.ts`

Mirrors the backend residual logic so the merchant sees where the equity plug lands before posting.

```ts
type Side = "DEBIT" | "CREDIT";
interface PreviewLine { normalBalance: NormalBalance; amount: number; }
// Returns the Opening Balance Equity plug: null when already balanced.
export function computeOpeningBalanceResidual(lines: PreviewLine[]):
  { amount: number; side: Side } | null
```

For each line: `postDebit = (normalBalance === "DEBIT") === (amount >= 0)`; add `Math.abs(amount)` to the debit or credit total. Residual = `debits - credits`; if `> 0` the plug is a **CREDIT** of that amount to OBE, if `< 0` a **DEBIT** of its magnitude, if `0` → `null`. Pure and unit-testable.

### 2. Types + schema — `types/opening-balance/type.ts`, `types/opening-balance/schema.ts`

```ts
// type.ts
export interface OpeningBalanceLineView { chartOfAccountId: string; debit: number; credit: number; }
export interface OpeningBalanceStatus {
  posted: boolean;
  entryId?: string | null;
  entryNumber?: string | null;
  asOfDate?: string | null;
  suggestedAsOfDate?: string | null;
  lines: OpeningBalanceLineView[];
}
// POST response echo (used only for the success toast/refresh):
export interface OpeningBalanceResponse {
  journalEntryId: string;
  entryNumber: string;
  asOfDate: string;
  currencyCode: string;
  totalDebit: number;
  totalCredit: number;
  postedAt: string;
  lines: OpeningBalanceLineView[];
}
```

```ts
// schema.ts
export const OpeningBalanceSchema = z.object({
  asOfDate: z.string().optional(),           // ISO date; omitted → backend defaults
  lines: z.array(z.object({
    chartOfAccountId: z.string().min(1, "Pick an account"),
    amount: z.number().refine((n) => n !== 0, "Enter a non-zero amount"),
  })).min(1, "Add at least one account"),
});
export type OpeningBalanceFormValues = z.infer<typeof OpeningBalanceSchema>;
```

### 3. Server actions — `lib/actions/opening-balance-actions.ts`

- `getOpeningBalanceStatus(): Promise<OpeningBalanceStatus>` — GET `/api/v1/opening-balances/status`; `try/catch` returning `{ posted: false, lines: [] }` on error (initial-load resilience only; this is a read, not a user action). Documented so the silent-default gotcha ([[missing-request-param-returns-400]]) is intentional here, not accidental.
- `postOpeningBalance(values: OpeningBalanceFormValues): Promise<FormResponse<OpeningBalanceResponse>>` — `OpeningBalanceSchema.safeParse` → on failure return the standard validation `FormResponse`; else POST `/api/v1/opening-balances` with `{ asOfDate: values.asOfDate || undefined, lines: values.lines }` (no `currencyCode`), `revalidatePath("/settings")`, return success/`errResp`. The backend's `errResp`-surfaced message (e.g. "Opening balances have already been posted…") reaches the toast.
- **Void:** import and call the existing `voidJournalEntry(entryId)`; wrap in the panel's transition + toast + refresh. (No new action; optionally re-export for locality.)

### 4. `ChartOfAccountSelector` extension (`components/widgets/chart-of-account-selector.tsx`)

Add two optional props: `accountTypes?: AccountType[]` and `excludeIds?: string[]`.

- Fetch: if `accountTypes` is set, call `listChartOfAccounts()` (all) and keep `accounts.filter(a => a.active && accountTypes.includes(a.accountType))`; otherwise the existing single-`accountType` path. Then always drop `excludeIds`. Both props default to undefined → **current behavior unchanged**.

### 5. Record dialog — `components/settings/opening-balance/record-opening-balance-dialog.tsx`

Local-state dialog (mirrors the panel's own `useState`-based form rather than introducing RHF):

- State: `asOfDate: string` (init from `status.suggestedAsOfDate`), `rows: { key: string; chartOfAccountId: string; account: ChartOfAccount | null; amount: string }[]` (start with one empty row).
- Each row: `<ChartOfAccountSelector accountTypes={["ASSET","LIABILITY","EQUITY"]} excludeIds={[...otherPickedIds, obeAccountId]} value={row.chartOfAccountId} onChange={(id, acc) => …} />` + a numeric amount `Input` (allows negative + decimals) + a remove button. Copy hint: "Enter each balance in the account's normal direction; use a negative for a contra balance."
- "+ Add account" appends a row; the last row can't be removed below one.
- **Live preview** under the rows: `computeOpeningBalanceResidual(rows.filter(valid).map(→ {normalBalance: row.account.normalBalance, amount: Number(row.amount)}))` → "Balances to **Opening Balance Equity**: `<formatted> (Dr|Cr)`", or "Already balanced — no equity adjustment" when `null`.
- **As-of date** date input, pre-filled + editable, with the go-live hint.
- **Post** button (`startTransition`): builds `OpeningBalanceFormValues` (drop empty/zero rows, `amount: Number(...)`), calls `postOpeningBalance`, toasts the result; on success closes and calls the panel's `onChanged()` to refresh status. Disabled while pending or when no valid non-zero row exists.
- `obeAccountId` = the loaded account whose `code === "3200"` (if present), so it's excluded from the picker.

### 6. View dialog

Read-only recap: as-of date, entry number, and a table of `status.lines` — resolve each `chartOfAccountId` to `code · name` from the panel's already-loaded accounts, show Debit / Credit columns. Reuses the same `Dialog` primitives.

### 7. Void confirm

An `AlertDialog` (or the existing `Dialog` with a confirm/cancel footer): "Void the opening balance (`<entryNumber>`)? It will be removed from all reports; you can record a new one afterwards." Confirm → `voidJournalEntry(status.entryId)` under a transition → toast → `onChanged()`.

### 8. Panel integration — `ChartOfAccountsPanel`

Add an opening-balance block **above** the accounts table (inside the panel, or as a sibling `OpeningBalanceStatusCard` fed the loaded `accounts` + a status + an `onChanged` callback):

- On mount (and after any opening-balance action) load status via `getOpeningBalanceStatus()`.
- **Not posted:** a `Card`/row "Opening balance — not recorded yet" + `[ Record opening balance ]` (opens the record dialog).
- **Posted:** "Opening balance — recorded as of `<asOfDate>` · `<entryNumber>`" + `[ View ]` `[ Void ]`.
- `onChanged()` re-fetches status (accounts list is unaffected, but a `reload()` is harmless).

## Testing

- **Typecheck + lint + build** (`tsc --noEmit` / the repo's `next build` / lint script) — the primary gate for this TS/React change.
- **Unit-test the pure helper** `computeOpeningBalanceResidual` if the repo has a test runner (check `package.json`): credit residual (assets > liabilities), debit residual, contra/negative flips the side, already-balanced → `null`. If no runner is configured, this is covered by manual verification instead (do not add a test framework just for this).
- **Manual walkthrough:** record (add rows, watch the OBE preview, post) → panel flips to posted; View shows the lines; Void → confirm → panel flips back to not-recorded and Record is available again; error toasts for a back-dated-after-activity date and for a second post.

## Out of scope

- **Listing/paginating opening balances** — only one per location by design.
- **Editing a posted opening balance** — immutable; correction is void + re-record (backend contract).
- **Currency selection** — uses the location's reporting currency.
- **Any backend change** — all endpoints already shipped.
- **Reclassifying Opening Balance Equity** into owner's capital / retained earnings — a normal journal entry, not part of this UI.
- **Frontend permission-gating of the buttons** — the backend enforces `JOURNAL_ENTRY_POST` / `_READ` / `_VOID` and surfaces 4xx via toast; hiding buttons per-permission is a separate concern if the dashboard adopts a client-side permission model.

# Opening Balances — Dashboard UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a merchant record, view, and void a location's opening balances from the Chart of Accounts settings panel, using the already-shipped backend endpoints.

**Architecture:** A status area inside `ChartOfAccountsPanel` (driven by `GET /opening-balances/status`) flips between "Record opening balance" (none) and "recorded as of `<date>` · View · Void" (posted). The record dialog is an add-line picker with a live Opening Balance Equity residual preview computed by a pure helper that mirrors the backend. New server actions wrap the endpoints; void reuses the existing `voidJournalEntry`. The shared `ChartOfAccountSelector` gains an optional balance-sheet allow-list.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, zod, axios (via `ApiClient`), shadcn/ui primitives (`Dialog`, `Card`, `Button`, `Input`, `Label`, `NumericInput`), `useToast`.

**Spec:** `docs/superpowers/specs/2026-07-10-opening-balances-dashboard-design.md`

## Global Constraints

- **No test runner** in this repo (`package.json` has only `dev`/`build`/`start`/`lint`). Do **not** add one. Per-task gate = **typecheck the touched files** and **manual verification** on the UI-wiring task.
- **Typecheck around unrelated WIP:** the working tree has ~47 uncommitted unrelated files that may not typecheck. Verify a task by running `npx tsc --noEmit` and grepping the output for **the files this task touched** — expect no matches. Never treat a pre-existing WIP error in an untouched file as this task's failure.
- **Server actions** use `"use server"`, `new ApiClient()`, `accountingUrl(path)`, return `FormResponse` (`{ responseType, message, data?, error? }` — `types/types.ts:62`), and `revalidatePath("/settings")`. Reads that back the UI may `catch`-and-default; user actions must surface `error.message`.
- **Backend contract (shipped, do not change):** `GET /api/v1/opening-balances/status`; `POST /api/v1/opening-balances` body `{ asOfDate?, currencyCode?, lines: [{ chartOfAccountId, amount }] }` (`amount` signed, natural direction); void = `POST /api/v1/journal-entries/{id}/void`. **Omit `currencyCode`** (use reporting currency). Balance-sheet accounts only.
- **Amounts** are `number` (via `NumericInput`, `onChange: (value: number | undefined)`); compare with `=== 0` / `Math.abs`, and skip `undefined`/`0` lines.
- **Exclude the system OBE account** from the picker by its immutable `code === "3200"` (the frontend `ChartOfAccount` has no `templateCode`).
- **Commit only each task's own files** with explicit `git add <path> …` — never `git add -A`/`.` (unrelated WIP must stay unstaged).

## File Structure

**New:**
- `lib/opening-balance.ts` — pure `computeOpeningBalanceResidual` helper.
- `types/opening-balance/type.ts` — `OpeningBalanceStatus`, `OpeningBalanceLineView`, `OpeningBalanceResponse`.
- `types/opening-balance/schema.ts` — `OpeningBalanceSchema`, `OpeningBalanceFormValues`.
- `lib/actions/opening-balance-actions.ts` — `getOpeningBalanceStatus`, `postOpeningBalance`.
- `components/settings/opening-balance/record-opening-balance-dialog.tsx` — the record dialog.
- `components/settings/opening-balance/opening-balance-section.tsx` — status block + view + void, wired into the panel.

**Modified:**
- `components/widgets/chart-of-account-selector.tsx` — add `accountTypes?` / `excludeIds?` props.
- `components/settings/panels/chart-of-accounts-panel.tsx` — render `<OpeningBalanceSection accounts={items} />` above the table.

---

### Task 1: Pure helper + types + schema

**Files:**
- Create: `lib/opening-balance.ts`
- Create: `types/opening-balance/type.ts`
- Create: `types/opening-balance/schema.ts`

**Interfaces:**
- Produces: `computeOpeningBalanceResidual(lines: OpeningBalancePreviewLine[]) → { amount: number; side: "DEBIT" | "CREDIT" } | null`; `OpeningBalanceStatus`, `OpeningBalanceLineView`, `OpeningBalanceResponse`; `OpeningBalanceSchema`, `OpeningBalanceFormValues`.

- [ ] **Step 1: Create the pure helper**

`lib/opening-balance.ts`:

```ts
import type { NormalBalance } from "@/types/accounting-mapping/type";

export interface OpeningBalancePreviewLine {
  normalBalance: NormalBalance;
  amount: number;
}

export interface OpeningBalanceResidual {
  amount: number; // positive magnitude of the equity plug
  side: "DEBIT" | "CREDIT";
}

/**
 * Mirrors the backend residual logic. Each line posts on its natural side
 * (debit for a DEBIT-normal account, credit for a CREDIT-normal one) when the
 * amount is >= 0, and flips when the amount is negative (contra balance). The
 * Opening Balance Equity plug closes the debit/credit gap. Returns null when
 * the entered lines already balance (no plug needed). Zero / non-finite
 * amounts are ignored.
 */
export function computeOpeningBalanceResidual(
  lines: OpeningBalancePreviewLine[],
): OpeningBalanceResidual | null {
  let debits = 0;
  let credits = 0;
  for (const line of lines) {
    if (!Number.isFinite(line.amount) || line.amount === 0) continue;
    const debitNormal = line.normalBalance === "DEBIT";
    const postDebit = debitNormal === (line.amount >= 0);
    const magnitude = Math.abs(line.amount);
    if (postDebit) debits += magnitude;
    else credits += magnitude;
  }
  const residual = debits - credits;
  if (residual === 0) return null;
  return residual > 0
    ? { amount: residual, side: "CREDIT" }
    : { amount: -residual, side: "DEBIT" };
}
```

- [ ] **Step 2: Create the types**

`types/opening-balance/type.ts`:

```ts
export interface OpeningBalanceLineView {
  chartOfAccountId: string;
  debit: number;
  credit: number;
}

export interface OpeningBalanceStatus {
  posted: boolean;
  entryId?: string | null;
  entryNumber?: string | null;
  asOfDate?: string | null;
  suggestedAsOfDate?: string | null;
  lines: OpeningBalanceLineView[];
}

// POST response echo — used only for the success toast / refresh.
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

- [ ] **Step 3: Create the schema**

`types/opening-balance/schema.ts`:

```ts
import { z } from "zod";

export const OpeningBalanceSchema = z.object({
  asOfDate: z.string().optional(),
  lines: z
    .array(
      z.object({
        chartOfAccountId: z.string().min(1, "Pick an account"),
        amount: z
          .number({ invalid_type_error: "Enter an amount" })
          .refine((n) => n !== 0, "Enter a non-zero amount"),
      }),
    )
    .min(1, "Add at least one account"),
});

export type OpeningBalanceFormValues = z.infer<typeof OpeningBalanceSchema>;
```

- [ ] **Step 4: Typecheck the new files**

Run: `npx tsc --noEmit 2>&1 | grep -iE "opening-balance|opening_balance" || echo "OK: no opening-balance type errors"`
Expected: `OK: no opening-balance type errors`.

- [ ] **Step 5: Commit**

```bash
git add lib/opening-balance.ts types/opening-balance/type.ts types/opening-balance/schema.ts
git commit -m "feat(opening-balance): add residual helper, types, and zod schema"
```

---

### Task 2: Extend `ChartOfAccountSelector`

**Files:**
- Modify: `components/widgets/chart-of-account-selector.tsx`

**Interfaces:**
- Consumes: `listChartOfAccounts(accountType?)` (unchanged).
- Produces: `ChartOfAccountSelector` gains optional `accountTypes?: AccountType[]` (allow-list, client-side filter) and `excludeIds?: string[]` (hidden ids). Existing single-`accountType` behavior unchanged.

- [ ] **Step 1: Add the two props**

In the `Props` interface (around line 27), add:

```ts
  /** Optional allow-list of types (client-side filter). Takes precedence over `accountType`. */
  accountTypes?: AccountType[];
  /** Account ids to hide (e.g. already-picked rows, system accounts). */
  excludeIds?: string[];
```

Destructure them in the component signature: `accountTypes`, `excludeIds` alongside the existing props.

- [ ] **Step 2: Filter the fetch by the allow-list**

Replace the fetch effect body so it fetches all when `accountTypes` is set, then filters. Use a stable dependency key for the array:

```ts
  const typeKey = (accountTypes ?? []).join(",");

  useEffect(() => {
    let cancelled = false;
    if (open && accounts.length === 0) {
      setLoading(true);
      const request =
        accountTypes && accountTypes.length > 0
          ? listChartOfAccounts()
          : listChartOfAccounts(accountType);
      request
        .then((all) => {
          if (cancelled) return;
          let rows = all.filter((a) => a.active);
          if (accountTypes && accountTypes.length > 0) {
            rows = rows.filter((a) => accountTypes.includes(a.accountType));
          }
          setAccounts(rows);
        })
        .catch(() => !cancelled && setAccounts([]))
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountType, typeKey, accounts.length]);
```

- [ ] **Step 3: Hide `excludeIds` from the list**

Add a derived visible list and use it where `accounts` currently feeds the grouping. Just after the `grouped` memo's inputs, change `grouped` to derive from a filtered list:

```ts
  const excludeKey = (excludeIds ?? []).join(",");
  const visible = useMemo(
    () => accounts.filter((a) => !(excludeIds ?? []).includes(a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accounts, excludeKey],
  );
```

Then change the `grouped` memo to iterate `visible` instead of `accounts` (replace `for (const a of accounts)` with `for (const a of visible)` and its dep `[accounts]` → `[visible]`). Leave `selected` deriving from `accounts` (so a chosen value still resolves even if later excluded).

- [ ] **Step 4: Typecheck (this file) + confirm existing callers still compile**

Run: `npx tsc --noEmit 2>&1 | grep -iE "chart-of-account-selector" || echo "OK: selector typechecks"`
Expected: `OK: selector typechecks`.
(Existing callers pass neither new prop, so they are unaffected — both props are optional.)

- [ ] **Step 5: Commit**

```bash
git add components/widgets/chart-of-account-selector.tsx
git commit -m "feat(opening-balance): add accountTypes allow-list + excludeIds to ChartOfAccountSelector"
```

---

### Task 3: Server actions

**Files:**
- Create: `lib/actions/opening-balance-actions.ts`

**Interfaces:**
- Consumes: types + schema (Task 1); `ApiClient`, `accountingUrl`, `parseStringify`.
- Produces: `getOpeningBalanceStatus() → Promise<OpeningBalanceStatus>`; `postOpeningBalance(values) → Promise<FormResponse<OpeningBalanceResponse>>`. (Void reuses `voidJournalEntry` from `journal-entry-actions.ts` — not re-declared here.)

- [ ] **Step 1: Create the actions**

`lib/actions/opening-balance-actions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { FormResponse } from "@/types/types";
import {
  OpeningBalanceSchema,
  type OpeningBalanceFormValues,
} from "@/types/opening-balance/schema";
import type {
  OpeningBalanceResponse,
  OpeningBalanceStatus,
} from "@/types/opening-balance/type";

import { accountingUrl } from "./accounting-client";

export async function getOpeningBalanceStatus(): Promise<OpeningBalanceStatus> {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl("/api/v1/opening-balances/status"),
    );
    return parseStringify(data);
  } catch (error) {
    // Read-path resilience: a failed status load renders the "not recorded"
    // state instead of crashing the settings page. User actions (post/void)
    // surface their own errors via FormResponse/toast.
    console.error("getOpeningBalanceStatus failed", error);
    return { posted: false, lines: [] };
  }
}

export async function postOpeningBalance(
  values: OpeningBalanceFormValues,
): Promise<FormResponse<OpeningBalanceResponse>> {
  const parsed = OpeningBalanceSchema.safeParse(values);
  if (!parsed.success) {
    return {
      responseType: "error",
      message: "Please correct the errors and try again",
      error: new Error(parsed.error.message),
    };
  }
  try {
    const apiClient = new ApiClient();
    const data = (await apiClient.post(
      accountingUrl("/api/v1/opening-balances"),
      {
        asOfDate: parsed.data.asOfDate || undefined,
        lines: parsed.data.lines,
      },
    )) as OpeningBalanceResponse;
    revalidatePath("/settings");
    return {
      responseType: "success",
      message: "Opening balances recorded",
      data: parseStringify(data),
    };
  } catch (error: unknown) {
    console.error("postOpeningBalance failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to record opening balances",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -iE "opening-balance-actions" || echo "OK: actions typecheck"`
Expected: `OK: actions typecheck`.

- [ ] **Step 3: Commit**

```bash
git add lib/actions/opening-balance-actions.ts
git commit -m "feat(opening-balance): add getOpeningBalanceStatus + postOpeningBalance server actions"
```

---

### Task 4: Record dialog

**Files:**
- Create: `components/settings/opening-balance/record-opening-balance-dialog.tsx`

**Interfaces:**
- Consumes: `computeOpeningBalanceResidual` (Task 1), `postOpeningBalance` (Task 3), `ChartOfAccountSelector` with `accountTypes`/`excludeIds` (Task 2), `NumericInput`, `formatNumber`.
- Produces: `RecordOpeningBalanceDialog({ open, onOpenChange, suggestedAsOfDate, obeAccountId, onRecorded })`.

- [ ] **Step 1: Create the dialog**

`components/settings/opening-balance/record-opening-balance-dialog.tsx`:

```tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import { useToast } from "@/hooks/use-toast";
import { postOpeningBalance } from "@/lib/actions/opening-balance-actions";
import { computeOpeningBalanceResidual } from "@/lib/opening-balance";
import { formatNumber } from "@/lib/utils";
import type { ChartOfAccount, AccountType } from "@/types/accounting-mapping/type";

const BALANCE_SHEET_TYPES: AccountType[] = ["ASSET", "LIABILITY", "EQUITY"];

interface Row {
  key: string;
  chartOfAccountId: string;
  account: ChartOfAccount | null;
  amount: number | undefined;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedAsOfDate?: string | null;
  /** The system 3200 account id, if it exists — hidden from the picker. */
  obeAccountId?: string;
  onRecorded: () => void;
}

export function RecordOpeningBalanceDialog({
  open,
  onOpenChange,
  suggestedAsOfDate,
  obeAccountId,
  onRecorded,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [asOfDate, setAsOfDate] = useState<string>(suggestedAsOfDate ?? "");
  const keyCounter = useRef(1);
  const [rows, setRows] = useState<Row[]>([
    { key: "r0", chartOfAccountId: "", account: null, amount: undefined },
  ]);

  const addRow = () =>
    setRows((rs) => [
      ...rs,
      {
        key: `r${keyCounter.current++}`,
        chartOfAccountId: "",
        account: null,
        amount: undefined,
      },
    ]);

  const removeRow = (key: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));

  const patchRow = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const previewLines = rows
    .filter((r) => r.account && typeof r.amount === "number" && r.amount !== 0)
    .map((r) => ({
      normalBalance: r.account!.normalBalance,
      amount: r.amount as number,
    }));
  const residual = computeOpeningBalanceResidual(previewLines);

  const validRows = rows.filter(
    (r) => r.chartOfAccountId && typeof r.amount === "number" && r.amount !== 0,
  );

  const submit = () =>
    startTransition(async () => {
      const result = await postOpeningBalance({
        asOfDate: asOfDate || undefined,
        lines: validRows.map((r) => ({
          chartOfAccountId: r.chartOfAccountId,
          amount: r.amount as number,
        })),
      });
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Recorded" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        onRecorded();
        onOpenChange(false);
      }
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record opening balances</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-w-[220px]">
            <Label>As of date</Label>
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The day your books start — usually just before your first recorded
              transaction. Pre-filled with our suggestion.
            </p>
          </div>

          <div className="space-y-2">
            {rows.map((row, idx) => {
              const excludeIds = [
                ...rows
                  .filter((_, i) => i !== idx)
                  .map((r) => r.chartOfAccountId)
                  .filter(Boolean),
                ...(obeAccountId ? [obeAccountId] : []),
              ];
              return (
                <div key={row.key} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ChartOfAccountSelector
                      accountTypes={BALANCE_SHEET_TYPES}
                      excludeIds={excludeIds}
                      value={row.chartOfAccountId}
                      placeholder="Select account"
                      onChange={(id, account) =>
                        patchRow(row.key, { chartOfAccountId: id, account })
                      }
                    />
                  </div>
                  <div className="w-40">
                    <NumericInput
                      value={row.amount ?? null}
                      onChange={(v) => patchRow(row.key, { amount: v })}
                      allowNegative
                      decimalScale={2}
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove line"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}
            <Button variant="outline" size="sm" type="button" onClick={addRow}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add account
            </Button>
          </div>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {residual ? (
              <>
                Balances to{" "}
                <span className="font-medium">Opening Balance Equity</span>:{" "}
                <span className="font-mono">{formatNumber(residual.amount)}</span>{" "}
                ({residual.side === "CREDIT" ? "Cr" : "Dr"})
              </>
            ) : (
              <span className="text-muted-foreground">
                Entered balances net to zero — no equity adjustment.
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={isPending || validRows.length === 0}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Post opening balances
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -iE "record-opening-balance-dialog" || echo "OK: dialog typechecks"`
Expected: `OK: dialog typechecks`.

- [ ] **Step 3: Commit**

```bash
git add components/settings/opening-balance/record-opening-balance-dialog.tsx
git commit -m "feat(opening-balance): add record dialog with live equity residual preview"
```

---

### Task 5: Status section + view + void + panel wiring

**Files:**
- Create: `components/settings/opening-balance/opening-balance-section.tsx`
- Modify: `components/settings/panels/chart-of-accounts-panel.tsx`

**Interfaces:**
- Consumes: `getOpeningBalanceStatus` (Task 3), `voidJournalEntry` (existing), `RecordOpeningBalanceDialog` (Task 4), `formatNumber`.
- Produces: `OpeningBalanceSection({ accounts })`, rendered by the panel above the accounts table.

- [ ] **Step 1: Create the section component**

`components/settings/opening-balance/opening-balance-section.tsx`:

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getOpeningBalanceStatus } from "@/lib/actions/opening-balance-actions";
import { voidJournalEntry } from "@/lib/actions/journal-entry-actions";
import { formatNumber } from "@/lib/utils";
import type { ChartOfAccount } from "@/types/accounting-mapping/type";
import type { OpeningBalanceStatus } from "@/types/opening-balance/type";

import { RecordOpeningBalanceDialog } from "./record-opening-balance-dialog";

interface Props {
  accounts: ChartOfAccount[];
}

export function OpeningBalanceSection({ accounts }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState<OpeningBalanceStatus | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reload = async () => setStatus(await getOpeningBalanceStatus());
  useEffect(() => {
    reload();
  }, []);

  const obeAccountId = accounts.find((a) => a.code === "3200")?.id;
  const accountLabel = (id: string) => {
    const a = accounts.find((x) => x.id === id);
    return a ? `${a.code} · ${a.name}` : id;
  };

  const onVoid = () =>
    startTransition(async () => {
      if (!status?.entryId) return;
      const result = await voidJournalEntry(status.entryId);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Voided" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        setVoidOpen(false);
        await reload();
      }
    });

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Opening balance</p>
          {status === null ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : status.posted ? (
            <p className="text-xs text-muted-foreground">
              Recorded as of {status.asOfDate}
              {status.entryNumber ? ` · ${status.entryNumber}` : ""}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not recorded yet — set each account&apos;s starting balance.
            </p>
          )}
        </div>

        {status !== null && !status.posted && (
          <Button size="sm" onClick={() => setRecordOpen(true)}>
            Record opening balance
          </Button>
        )}
        {status !== null && status.posted && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setViewOpen(true)}>
              View
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVoidOpen(true)}>
              Void
            </Button>
          </div>
        )}
      </div>

      <RecordOpeningBalanceDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        suggestedAsOfDate={status?.suggestedAsOfDate}
        obeAccountId={obeAccountId}
        onRecorded={reload}
      />

      {/* View */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Opening balance{status?.entryNumber ? ` · ${status.entryNumber}` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">As of {status?.asOfDate}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase text-gray-400">
                <th className="py-2">Account</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(status?.lines ?? []).map((l, i) => (
                <tr key={i}>
                  <td className="py-2">{accountLabel(l.chartOfAccountId)}</td>
                  <td className="py-2 text-right font-mono">
                    {l.debit ? formatNumber(l.debit) : "—"}
                  </td>
                  <td className="py-2 text-right font-mono">
                    {l.credit ? formatNumber(l.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void confirm */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Void opening balance?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This voids {status?.entryNumber ?? "the opening-balance entry"} and
            removes it from all reports. You can record a new opening balance
            afterwards.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setVoidOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onVoid} disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Void
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Wire the section into the panel**

In `components/settings/panels/chart-of-accounts-panel.tsx`:

Add the import near the other component imports:

```tsx
import { OpeningBalanceSection } from "../opening-balance/opening-balance-section";
```

Then wrap the panel's children so the section renders above the accounts `Card`. Replace the opening `<Card className="border-line">` line with a fragment that renders the section first:

```tsx
      <div className="space-y-3">
        <OpeningBalanceSection accounts={items} />
        <Card className="border-line">
```

and add the matching closing `</div>` immediately after that `Card`'s closing `</Card>` tag. (The `SettingsSection` already wraps children in a spaced container, so the extra `div` just groups the two blocks.)

- [ ] **Step 3: Typecheck the touched files**

Run: `npx tsc --noEmit 2>&1 | grep -iE "opening-balance-section|chart-of-accounts-panel" || echo "OK: section + panel typecheck"`
Expected: `OK: section + panel typecheck`.

- [ ] **Step 4: Manual verification (dev server)**

Start the app (`yarn dev` / `npm run dev`) and open the Chart of Accounts settings panel for a location. Confirm:
1. An "Opening balance" row shows above the accounts table. With no opening balance → "Not recorded yet" + **Record opening balance**.
2. Record → add 2–3 balance-sheet accounts (the picker offers only ASSET/LIABILITY/EQUITY, and won't offer an account already chosen), enter amounts → the "Balances to Opening Balance Equity: X (Dr/Cr)" line updates live → **Post** → success toast, dialog closes, the row flips to "Recorded as of `<date>` · JE-…".
3. **View** shows the recorded lines (debits/credits). 
4. **Void** → confirm → success toast → row flips back to "Not recorded yet", and Record works again.
5. Error path: set the as-of date to *after* today's activity (if the location has any) → **Post** → destructive toast with the backend message.

- [ ] **Step 5: Commit**

```bash
git add components/settings/opening-balance/opening-balance-section.tsx \
        components/settings/panels/chart-of-accounts-panel.tsx
git commit -m "feat(opening-balance): status section with view/void, wired into COA panel"
```

---

## Self-review notes

- **Spec coverage:** §1 preview helper → Task 1; §2 types/schema → Task 1; §3 server actions → Task 3; §4 selector extension → Task 2; §5 record dialog → Task 4; §6 view dialog → Task 5; §7 void confirm → Task 5; §8 panel integration → Task 5. Void reuses `voidJournalEntry` (spec Decision 5) → Task 5 imports it directly (no new action). No `currencyCode` sent (spec Decision 3) → Task 3 omits it.
- **Type consistency:** `OpeningBalancePreviewLine`/`OpeningBalanceResidual` produced in Task 1, consumed in Task 4; `OpeningBalanceStatus`/`OpeningBalanceResponse` produced in Task 1, consumed in Tasks 3 & 5; `OpeningBalanceFormValues` produced in Task 1, consumed in Tasks 3 & 4; `accountTypes`/`excludeIds` added in Task 2, used in Task 4; `getOpeningBalanceStatus`/`postOpeningBalance` produced in Task 3, consumed in Tasks 5 & 4; `RecordOpeningBalanceDialog` props match between Task 4 (definition) and Task 5 (usage: `open`, `onOpenChange`, `suggestedAsOfDate`, `obeAccountId`, `onRecorded`).
- **No test runner:** the one piece of pure logic (`computeOpeningBalanceResidual`) is verified by typecheck + the live preview in the Task 5 manual walkthrough (both residual directions and the balanced/contra cases are visible while entering amounts). Adding a test framework is explicitly out of scope.
- **WIP isolation:** every commit lists explicit paths; the typecheck gates grep for the touched files so pre-existing WIP type errors never mask or fail a task.

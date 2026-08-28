# Import Capacity UI (Customer-Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface the CSV import capacity pre-flight in the dashboard: a plan-limit banner on the preview screen (with the numbers), a properly rendered whole-batch rejection at commit, and a clear "your plan stopped the rest" result when a cap tripped mid-batch.

**Architecture:** Inventory's `PreviewResponse` now carries an optional `capacity` block and `CommitResponse` an optional `stoppedBy`; a blocked commit returns HTTP 400 with `errorCode=BILLING_ERROR` / message `IMPORT_LIMIT_EXCEEDED` in the reason field and the full user copy in `message`. All UI work lands in the existing `components/imports/import-flow.tsx` + `lib/actions/import-actions.ts`; types in `types/imports/type.ts`.

**Tech Stack:** Next.js (App Router), TypeScript, existing Alert/Button/Card primitives, server actions via `ApiClient`. No test framework in this repo — verification is `npx tsc --noEmit` + `npm run lint` + manual states.

**Spec:** `/Users/Peter/Settlo/Settlo Inventory Service/docs/superpowers/specs/2026-08-25-import-capacity-preflight-design.md` (Section D).

## Global Constraints

- Repo: `/Users/Peter/Settlo/Customer-Dashboard`, branch `alpha`. Deploy AFTER the Inventory Service plan — the fields are additive, so this UI degrades to today's behaviour against an older backend (`capacity` simply absent).
- All new fields are optional in the types — never assume they exist at runtime.
- Multi-line server copy (`\n\n`-separated blocks) must render as paragraphs, not one run-on line, and NEVER in a toast.
- Verification for every task: `npx tsc --noEmit` (from the repo root) must be clean, then `npm run lint`.
- Commit after every task.

---

### Task 1: Types

**Files:**
- Modify: `types/imports/type.ts`

**Interfaces:**
- Produces: `CapacityCheck`, `CapacityAssessment` interfaces; `PreviewResponse.capacity?`; `CommitResponse.stoppedBy?` — mirrors of the Java DTOs in `co.tz.settlo.inventory.imports.capacity` (this file's header comment says to keep in sync; do).

- [ ] **Step 1: Add the types**

In `types/imports/type.ts`, add above `PreviewResponse`:

```ts
/** One evaluated plan cap — present even when it fits, so the UI can warn on "barely fits". */
export interface CapacityCheck {
  limitKey: string;
  /** Merchant-facing noun, e.g. "products", "items held in stock". */
  noun: string;
  limit: number;
  currentUsage: number;
  headroom: number;
  requested: number;
  excess: number;
  exceeded: boolean;
}

/** Capacity pre-flight verdict. Absent = not evaluated (older backend, billing unreachable). */
export interface CapacityAssessment {
  /** true → the commit WILL be refused as-is. */
  blocked: boolean;
  /** Rendered multi-paragraph copy (blocks separated by \n\n); null unless blocked. */
  message: string | null;
  checks: CapacityCheck[];
}
```

Extend `PreviewResponse` with:

```ts
  capacity?: CapacityAssessment | null;
```

Extend `CommitResponse` with:

```ts
  /**
   * Set when a plan cap tripped partway through the batch (a race beat the
   * pre-flight): the counted rows are committed, the rest were not attempted.
   */
  stoppedBy?: string | null;
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: clean (nothing consumes the fields yet).

- [ ] **Step 3: Commit**

```bash
git add types/imports/type.ts
git commit -m "feat(imports): capacity + stoppedBy types for the import flow"
```

---

### Task 2: Preview capacity banner + import-button gating

**Files:**
- Modify: `components/imports/import-flow.tsx`

**Interfaces:**
- Consumes: `preview.capacity` (Task 1), the existing `Alert*` primitives and `decisions` map already passed to `PreviewStep`.
- Produces: `CapacityAlert` component (same file, beside `MissingLookupsAlert`); `PreviewStep` renders it and gates the import button.

- [ ] **Step 1: Add the `CapacityAlert` component**

Place it directly after `MissingLookupsAlert` (~line 590), following its structure:

```tsx
/**
 * Plan-capacity verdict for this file. Danger + reasons when the commit
 * would be refused; a soft warning when it fits but consumes most of the
 * remaining headroom (>80% of any cap). Numbers come rendered from the
 * server — this component only lays them out.
 */
function CapacityAlert({ capacity }: { capacity: CapacityAssessment }) {
  const nearLimit = capacity.checks.filter(
    (c) => !c.exceeded && c.requested > 0 && c.requested > 0.8 * c.headroom,
  );
  if (capacity.blocked) {
    return (
      <Alert tone="danger">
        <AlertIcon>
          <AlertTriangle className="h-3.5 w-3.5" />
        </AlertIcon>
        <AlertBody>
          <AlertTitle>Plan limit exceeded</AlertTitle>
          <AlertDescription className="space-y-2">
            {(capacity.message ?? "This file exceeds your plan's limits.")
              .split("\n\n")
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            <p>
              You can skip rows below to shrink the import — the limit is
              re-checked when you press import.
            </p>
          </AlertDescription>
        </AlertBody>
      </Alert>
    );
  }
  if (nearLimit.length === 0) return null;
  return (
    <Alert tone="warning">
      <AlertIcon>
        <AlertTriangle className="h-3.5 w-3.5" />
      </AlertIcon>
      <AlertBody>
        <AlertTitle>Approaching your plan&apos;s limits</AlertTitle>
        <AlertDescription className="space-y-1">
          {nearLimit.map((c) => (
            <p key={c.limitKey}>
              This file uses {c.requested} of the {c.headroom} remaining{" "}
              {c.noun} on your plan ({c.currentUsage} of {c.limit} already in
              use).
            </p>
          ))}
        </AlertDescription>
      </AlertBody>
    </Alert>
  );
}
```

Add `CapacityAssessment` to the type import from `@/types/imports/type`.

- [ ] **Step 2: Wire it into `PreviewStep`**

Inside `PreviewStep`'s returned tree, directly under `<SummaryBar …/>` (before the `MissingLookupsAlert` block):

```tsx
      {preview.capacity && <CapacityAlert capacity={preview.capacity} />}
```

- [ ] **Step 3: Gate the import button**

The preview's `capacity` is computed server-side from the WORST CASE, so skipping rows can genuinely fix it — a permanently disabled button would dead-end the skip-and-retry path, and duplicating the server's per-cap arithmetic client-side is exactly the drift this feature avoids. Gate it on "blocked AND untouched" instead: disabled until the operator changes any decision, after which the commit re-check is the authority.

In `PreviewStep`, compute (after the `groups` memo):

```tsx
  const capacityBlocked = preview.capacity?.blocked === true;
  // Any operator edit away from the seeded defaults re-enables the button —
  // the server re-checks capacity at commit, so the club stays server-side.
  const decisionsTouched = useMemo(
    () =>
      preview.rows.some(
        (r) => decisions.get(r.rowIndex)?.action !== r.defaultDecision,
      ),
    [preview.rows, decisions],
  );
```

and change the import button's `disabled` prop:

```tsx
          disabled={
            committing ||
            importableCount === 0 ||
            (capacityBlocked && !decisionsTouched)
          }
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` → clean. Run: `npm run lint` → clean.
Manual check (`npm run dev`, any imports page): a preview without `capacity` renders exactly as before.

- [ ] **Step 5: Commit**

```bash
git add components/imports/import-flow.tsx
git commit -m "feat(imports): plan-capacity banner and import gating on the preview step"
```

---

### Task 3: Commit rejection — carry the block through the action

**Files:**
- Modify: `lib/actions/import-actions.ts`
- Modify: `components/imports/import-flow.tsx`

**Interfaces:**
- Consumes: `SettloApiError` (`lib/settlo-api-error-handler.ts`) — its `.code` and `.message`.
- Produces: `CommitResult`'s failure arm gains `blocked?: boolean`; `ImportFlow.onCommit` and `PreviewStep` render a blocked commit as a "Plan limit exceeded" danger alert (multi-paragraph), not a generic "Commit failed" toast+alert.

- [ ] **Step 1: Verify the error code survives the ApiClient wrapper**

The backend returns HTTP 400 with body `{ errorCode: "BILLING_ERROR", message: "<full copy>", … }` (inventory's `ErrorResponse` shape). Read `handleSettloApiError` in `lib/settlo-api-error-handler.ts` and confirm what lands in `SettloApiError.code` and `.message` for that body — the known hazard is this wrapper dropping non-standard bodies. Specifically confirm:
- `.message` carries the body's `message` (the full user copy). If the wrapper substitutes a generic string for BUSINESS/BILLING errors, patch it so an explicit body `message` always wins for 4xx responses.
- `.code` carries the body's `errorCode` (or `code`). If neither is mapped, extend the mapping to read `errorCode` as a fallback.

Record what you found (and any patch) in the commit message.

- [ ] **Step 2: Extend `commitImport`**

In `lib/actions/import-actions.ts`:

Change the failure arm of `CommitResult`:

```ts
export type CommitResult =
  | { ok: true; data: CommitResponse }
  // `pending` means the request reached the server but we never got a result
  // (gateway timeout / 5xx / dropped connection). The import may have already
  // completed — the UI must warn rather than invite a duplicate re-import.
  // `blocked` means the server refused the WHOLE batch on a plan cap —
  // nothing was written; the preview is still cached, so trimming rows and
  // re-committing the same previewId is safe.
  | { ok: false; pending?: boolean; blocked?: boolean; message: string };
```

Import the error class:

```ts
import { SettloApiError } from "@/lib/settlo-api-error-handler";
```

In `commitImport`'s `catch`, before the `pending` computation:

```ts
    const blocked =
      error instanceof SettloApiError &&
      (error.code === "BILLING_ERROR" ||
        // digest is set to the code and survives the server→client boundary.
        error.digest === "BILLING_ERROR");
    if (blocked) {
      return { ok: false, blocked: true, message };
    }
```

(The existing `pending` heuristic stays for everything else; a 400 block never reads as pending.)

- [ ] **Step 3: Render it**

In `components/imports/import-flow.tsx`:

Add state near the other commit states:

```tsx
  const [commitBlocked, setCommitBlocked] = useState<string | null>(null);
```

Reset it alongside `setCommitError(null)` in `onCommit`, and handle the new arm FIRST in the `!res.ok` branch:

```tsx
        if (res.blocked) {
          // Whole batch refused on a plan cap — nothing was written, the
          // preview is still valid. Stay here so the operator can skip rows.
          setCommitBlocked(res.message);
          toast({
            variant: "destructive",
            title: "Plan limit exceeded",
            description: "Nothing was imported — see the details above the table.",
          });
          return;
        }
```

Pass it into `PreviewStep` as a new `blocked: string | null` prop (thread it exactly like the existing `error` prop), and render it in `PreviewStep` directly above the existing `{error && …}` alert:

```tsx
      {blocked && (
        <Alert tone="danger">
          <AlertIcon>
            <AlertTriangle className="h-3.5 w-3.5" />
          </AlertIcon>
          <AlertBody>
            <AlertTitle>Plan limit exceeded — nothing was imported</AlertTitle>
            <AlertDescription className="space-y-2">
              {blocked.split("\n\n").map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <p>
                Skip rows below (or reduce the file) and press import again —
                nothing from this attempt was saved.
              </p>
            </AlertDescription>
          </AlertBody>
        </Alert>
      )}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit` → clean. Run: `npm run lint` → clean.

- [ ] **Step 5: Commit**

```bash
git add lib/actions/import-actions.ts components/imports/import-flow.tsx
git commit -m "feat(imports): render a blocked commit as a plan-limit rejection, not a generic failure"
```

---

### Task 4: Mid-batch stop in the result step

**Files:**
- Modify: `components/imports/import-flow.tsx` (`ResultStep`, and the result toast in `onCommit`)

**Interfaces:**
- Consumes: `CommitResponse.stoppedBy` (Task 1).
- Produces: when `stoppedBy` is set, the result step leads with the plan-limit reason instead of the generic per-row error framing.

- [ ] **Step 1: Adjust the result toast**

In `onCommit`'s success branch, before the existing `failed === 0` chain:

```tsx
      if (data.stoppedBy) {
        toast({
          variant: "warning",
          title: "Import stopped by your plan limit",
          description: `${imported} imported before the limit was reached — see the summary below`,
        });
      } else if (failed === 0) {
```

(i.e. the existing chain becomes `else if`.)

- [ ] **Step 2: Render it in `ResultStep`**

In `ResultStep`, treat a stop as at-best-partial:

```tsx
  const state: "ok" | "partial" | "failed" =
    result.stoppedBy
      ? imported > 0
        ? "partial"
        : "failed"
      : failed === 0
        ? "ok"
        : imported > 0
          ? "partial"
          : "failed";
```

and add, as the FIRST alert inside the card content (above the existing partial-state alert):

```tsx
        {result.stoppedBy && (
          <Alert tone="danger">
            <AlertIcon>
              <AlertTriangle className="h-3.5 w-3.5" />
            </AlertIcon>
            <AlertBody>
              <AlertTitle>Your plan&apos;s limit stopped this import partway</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>{result.stoppedBy}</p>
                <p>
                  {imported} row{imported === 1 ? " was" : "s were"} imported
                  before the limit was reached; the remaining rows were not
                  attempted. Remove what was already imported from your file,
                  then re-upload the rest — or upgrade your plan.
                </p>
              </AlertDescription>
            </AlertBody>
          </Alert>
        )}
```

Also update the heading map so a stopped-but-nothing-imported run doesn't read as generic failure:

```tsx
  const heading =
    result.stoppedBy && imported === 0
      ? "Import stopped by your plan limit"
      : state === "ok"
        ? "Import complete"
        : state === "partial"
          ? "Imported with some errors"
          : "Nothing imported";
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → clean. Run: `npm run lint` → clean.
Then `npm run build` once — the flow file is large and build catches what dev mode defers.

- [ ] **Step 4: Commit**

```bash
git add components/imports/import-flow.tsx
git commit -m "feat(imports): surface mid-batch plan-limit stops in the result step"
```

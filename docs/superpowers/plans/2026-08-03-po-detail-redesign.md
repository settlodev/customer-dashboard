# Purchase-Order Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the sales-order detail page's `.od-*` design primitives into a shared `components/layouts/order-detail/` module, restyle the shared `Card`/`Badge`/`PageHeader` to match, migrate the sales-order page onto the shared primitives with zero visual change, and recompose the purchase-order detail page from the same system with the rail on the left.

**Architecture:** One new shared module (`components/layouts/order-detail/`) holds nine presentational primitives — seven lifted verbatim from `order-detail-view.tsx`, two new (`VList`/`VRow`, `DetailTable`). Three existing shared files (`ui/card.tsx`, `ui/badge.tsx`, `layouts/page-shell.tsx`) get small additive changes (plus one non-additive typography change in `PageHeader`). The sales-order page then imports the lifted primitives instead of defining them locally, and the purchase-order page is rebuilt to compose the same primitives with `RailCard`/`PanelCard`/`VList`/`DetailTable` replacing its current ad-hoc `Card`+raw-`<table>` markup.

**Tech Stack:** Next.js 15 (App Router, React Server Components), TypeScript, Tailwind CSS with a CSS-variable design-token layer (`app/globals.css` + `tailwind.config.ts`), shadcn/ui primitives, lucide-react icons. No test runner is configured in this repo.

## Global Constraints

- Design tokens (`--canvas`, `--ink*`, `--line*`, `--primary`, JetBrains Mono) already exist in `app/globals.css` and `tailwind.config.ts` — never redefine them, only consume the existing utility classes (`bg-canvas`, `text-ink`/`ink-2`/`ink-3`, `border-line`/`line-2`, `bg-pos-tint`/`text-pos`, `bg-neg-tint`/`text-neg`, `bg-warn-tint`/`text-warn`, `text-muted-2`, `bg-primary/10`, `text-primary-dark`).
- `KpiStrip`/`KpiCard` (`components/layouts/kpi-strip.tsx`) are already design-conformant — do not touch them.
- `PageHeader` (`components/layouts/page-shell.tsx`) is the only non-additive shared change in this plan and it ripples across roughly 220 pages — accepted per the spec's D1, mitigated by the archetype smoke pass in the final task.
- The sales-order page migration (Task 6) must be MECHANICAL — same markup, same classes, zero intended visual delta. Any visual change there is a defect, not a feature.
- The money/profit primitives (`MoneyHero`, `ProfitSplit`, `Ledger`, `LRow`, `LegendItem`) stay local to `order-detail-view.tsx` — they are sales-domain, not order-detail-generic, and are out of scope for this plan.
- The rail sits on the LEFT on both order-detail pages (sales-order today, purchase-order after this plan) — internal consistency wins over the source mock, which puts it on the right. This is deliberate (spec D2); do not "fix" it back.
- There is no unit-test harness in this repo. Do not add jest/vitest or invent test files. Verification per task is `npx tsc --noEmit` plus targeted `npx next lint --file <changed files>`. The final task additionally runs a full production build (`NODE_OPTIONS=--max-old-space-size=8192 npx next build`, must exit 0 and produce `.next/BUILD_ID`) and an archetype visual/render smoke pass.
- Use semantic design tokens, never raw hex — except on the sales-order page's permanently-dark `MoneyHero`, which already uses fixed hex values by design (unaffected by this plan) and stays that way.
- `docs/` is excluded by this machine's global `~/.gitignore_global` (confirmed via `git check-ignore`), even though the repo's own local `.gitignore` says nothing about it — every commit that stages a file under `docs/` must `git add -f` that file or it will silently fail to stage.
- Commit messages end with two separate `-m` flags — the second one is exactly `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Stage files explicitly by path in every commit. Never `git add -A` or `git add .`.

---

### Task 1: Shared order-detail module — seven lifted primitives

**Files:**
- Create: `components/layouts/order-detail/primitives.tsx`
- Create: `components/layouts/order-detail/index.ts`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `Card` from `@/components/ui/card` (existing, unmodified in this task).
- Produces (re-exported from `components/layouts/order-detail`):
  - `type Tone = "pos" | "neg" | "warn" | "info" | "muted"`
  - `StatusPill({ tone: Tone; dot?: boolean; children: React.ReactNode })`
  - `StatusTag({ tone: Tone; children: React.ReactNode })`
  - `IconChip({ children: React.ReactNode })`
  - `CountChip({ children: React.ReactNode })`
  - `RailCard({ icon: React.ReactNode; title: string; children: React.ReactNode })`
  - `PanelCard({ icon: React.ReactNode; title: string; count?: number; pad0?: boolean; children: React.ReactNode })` — note the prop is named `pad0` (not the reference implementation's `flush`) to match the design's `.od-card.pad0` vocabulary; Task 6 updates the sales-order page's call sites to match.
  - `type SegTab<T extends string = string> = { id: T; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }`
  - `SegTabs<T extends string>({ tabs: SegTab<T>[]; active: T; onSelect: (id: T) => void })` — generalized from the reference's page-local `TabKey`/`Receipt` types so it can leave the single-file context; markup and classes are unchanged, only the TypeScript generics are new.

- [ ] **Step 1: Create the primitives file**

```tsx
// components/layouts/order-detail/primitives.tsx
/**
 * Shared order-detail primitives — the `.od-*` treatment lifted from the
 * sales-order detail page (`app/(protected)/orders/[id]/order-detail-view.tsx`)
 * so the purchase-order detail page can compose from the same system instead
 * of re-implementing it.
 *
 * See docs/superpowers/specs/2026-08-03-po-detail-redesign-design.md.
 *
 * `StatusPill` / `StatusTag` carry a small, fixed tone vocabulary
 * (`pos`/`neg`/`warn`/`info`/`muted`) that is distinct from `Badge`'s `tone`
 * prop (`ok`/`open`/`warn`/`neg`/`muted`/`primary`) — the two evolved
 * independently for different call sites and are not meant to be unified.
 */

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type Tone = "pos" | "neg" | "warn" | "info" | "muted";

const CHIP: Record<Tone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  info: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  muted: "bg-canvas text-ink-3",
};

export function StatusPill({
  tone,
  dot,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
        CHIP[tone],
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusTag({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]",
        CHIP[tone],
      )}
    >
      {children}
    </span>
  );
}

export function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
      {children}
    </span>
  );
}

export function CountChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-3">
      {children}
    </span>
  );
}

export function RailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3.5 flex items-center gap-2.5">
        <IconChip>{icon}</IconChip>
        <span className="text-[13.5px] font-semibold tracking-tight text-ink">
          {title}
        </span>
      </div>
      {children}
    </Card>
  );
}

export function PanelCard({
  icon,
  title,
  count,
  pad0,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  /** Zero-pad the body so edge-to-edge content (e.g. `DetailTable`) can span
   *  flush with the card's border — the `.od-card.pad0` treatment. */
  pad0?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 pt-4",
          pad0 ? "pb-3" : "pb-0",
        )}
      >
        <IconChip>{icon}</IconChip>
        <span className="text-[14px] font-semibold tracking-tight text-ink">
          {title}
        </span>
        {count != null && <CountChip>{count}</CountChip>}
      </div>
      <div className={pad0 ? "" : "px-5 pb-5 pt-3.5"}>{children}</div>
    </Card>
  );
}

export interface SegTab<T extends string = string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function SegTabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: SegTab<T>[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div
        role="tablist"
        className="inline-flex items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px]"
      >
        {tabs.map((tb) => {
          const on = active === tb.id;
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(tb.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", on ? "opacity-100" : "opacity-70")} />
              {tb.label}
              {tb.count != null && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none",
                    on ? "bg-white/20 text-white" : "bg-canvas text-ink-3",
                  )}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the barrel export**

```ts
// components/layouts/order-detail/index.ts
export {
  StatusPill,
  StatusTag,
  IconChip,
  CountChip,
  RailCard,
  PanelCard,
  SegTabs,
  type Tone,
  type SegTab,
} from "./primitives";
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/layouts/order-detail/primitives.tsx --file components/layouts/order-detail/index.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -f components/layouts/order-detail/primitives.tsx components/layouts/order-detail/index.ts
git commit -m "feat(order-detail): lift seven .od-* primitives into a shared module" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Shared order-detail module — VList and DetailTable

**Files:**
- Create: `components/layouts/order-detail/vlist.tsx`
- Create: `components/layouts/order-detail/detail-table.tsx`
- Modify: `components/layouts/order-detail/index.ts`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces (re-exported from `components/layouts/order-detail`):
  - `VList({ children: React.ReactNode })`
  - `VRow({ label: React.ReactNode; value: React.ReactNode })`
  - `DetailTable({ children: React.ReactNode; className?: string })`
  - `DetailTableHead({ children: React.ReactNode })`
  - `DetailTh({ children: React.ReactNode; align?: "left" | "right" })`
  - `DetailTableBody({ children: React.ReactNode })`
  - `DetailTd({ children?: React.ReactNode; align?: "left" | "right"; dim?: boolean; strong?: boolean; className?: string })`
  - `DetailTableTotals({ children: React.ReactNode })`

- [ ] **Step 1: Create VList/VRow**

```tsx
// components/layouts/order-detail/vlist.tsx
/**
 * VList / VRow — key/value rows with hairline dividers and mono uppercase
 * keys, the `.od-vlist` / `.od-vrow` treatment. Used inside `RailCard`s that
 * show a flat set of facts (e.g. supplier details) rather than a table.
 */

export function VList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function VRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[13px] last:border-b-0">
      <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className="min-w-0 truncate text-right font-medium text-ink">
        {value}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create DetailTable family**

```tsx
// components/layouts/order-detail/detail-table.tsx
/**
 * DetailTable — the `.od-tbl` treatment: mono uppercase tracked headers on
 * canvas, hairline row dividers, right-aligned tabular numerals, a dimmed
 * tone for empty/placeholder cells, and an optional totals row. Values for
 * padding/typography are pulled from the sales-order page's own local `Th` +
 * `ItemsTable` cell classes (`order-detail-view.tsx`), which already ship
 * this exact treatment.
 */

import { cn } from "@/lib/utils";

export function DetailTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px]", className)}>
        {children}
      </table>
    </div>
  );
}

export function DetailTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function DetailTh({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line bg-canvas px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

export function DetailTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function DetailTd({
  children,
  align = "left",
  dim,
  strong,
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  /** Dimmed-cell tone — e.g. a placeholder "—" or a zero value. */
  dim?: boolean;
  /** Bold emphasis — used by totals-row cells and line-total cells. */
  strong?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-3.5 py-3.5 align-top",
        align === "right" && "text-right tabular-nums",
        dim
          ? "font-medium text-muted-2"
          : strong
            ? "font-semibold text-ink"
            : "text-ink",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function DetailTableTotals({ children }: { children: React.ReactNode }) {
  return (
    <tfoot>
      <tr className="border-t border-line-2 bg-surface">{children}</tr>
    </tfoot>
  );
}
```

- [ ] **Step 3: Extend the barrel export**

```ts
// components/layouts/order-detail/index.ts
export {
  StatusPill,
  StatusTag,
  IconChip,
  CountChip,
  RailCard,
  PanelCard,
  SegTabs,
  type Tone,
  type SegTab,
} from "./primitives";
export { VList, VRow } from "./vlist";
export {
  DetailTable,
  DetailTableHead,
  DetailTh,
  DetailTableBody,
  DetailTd,
  DetailTableTotals,
} from "./detail-table";
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/layouts/order-detail/vlist.tsx --file components/layouts/order-detail/detail-table.tsx --file components/layouts/order-detail/index.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -f components/layouts/order-detail/vlist.tsx components/layouts/order-detail/detail-table.tsx components/layouts/order-detail/index.ts
git commit -m "feat(order-detail): add VList and DetailTable primitives" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Restyle Card — pad0 content variant + CardHead

**Files:**
- Modify: `components/ui/card.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CardContent` gains an additive `pad0?: boolean` prop (renders `p-0` instead of `p-6 pt-0` when true; unset/false is byte-identical to today). New export `CardHead({ icon?: React.ReactNode; title: React.ReactNode; trailing?: React.ReactNode; className?: string })`.

Note: `Card` itself already renders `rounded-xl border border-line bg-card text-card-foreground shadow-sm` — the hairline border and rounded-xl corner the spec calls for already exist. This task only adds the two new pieces; it does not touch `Card`'s own className.

- [ ] **Step 1: Add `pad0` to CardContent**

Find in `components/ui/card.tsx`:

```tsx
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"
```

Replace with:

```tsx
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { pad0?: boolean }
>(({ className, pad0, ...props }, ref) => (
  <div ref={ref} className={cn(pad0 ? "p-0" : "p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"
```

- [ ] **Step 2: Add CardHead**

Find in `components/ui/card.tsx`:

```tsx
const CardFooter = React.forwardRef<
```

Insert immediately before it:

```tsx
interface CardHeadProps {
  /** 24px tinted icon square — the `.od-card-title .ico` treatment. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  /** Right-aligned slot (a count chip, an action button, etc.). */
  trailing?: React.ReactNode;
  className?: string;
}

/**
 * Card section header — icon chip + title + optional trailing slot, the
 * `.od-card-head` treatment. For cards built directly on `Card` (not via the
 * order-detail `RailCard`/`PanelCard`, which already bundle an equivalent
 * header of their own).
 */
const CardHead = React.forwardRef<HTMLDivElement, CardHeadProps>(
  ({ icon, title, trailing, className }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2.5 px-5 pt-4 pb-3", className)}
    >
      {icon && (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 text-[14px] font-semibold tracking-tight text-ink">
        {title}
      </span>
      {trailing}
    </div>
  ),
)
CardHead.displayName = "CardHead"

const CardFooter = React.forwardRef<
```

(Only the `const CardFooter = React.forwardRef<` line is duplicated here to anchor the insertion point — do not create two `CardFooter` declarations; the inserted block goes above the existing one.)

- [ ] **Step 3: Update the export list**

Find:

```tsx
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

Replace with:

```tsx
export { Card, CardHeader, CardHead, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors (this file is imported by ~220 pages — a real type error here would show up as a flood of downstream errors).

Run: `npx next lint --file components/ui/card.tsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ui/card.tsx
git commit -m "feat(ui): add Card pad0 content variant and CardHead composer" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Restyle Badge — dot-pill tone variant

**Files:**
- Modify: `components/ui/badge.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BadgeProps` gains two additive optional props, `tone?: BadgeTone` and `dot?: boolean`. `export type BadgeTone = "ok" | "open" | "warn" | "neg" | "muted" | "primary"`. When `tone` is set, `Badge` renders the dot-pill treatment (ignoring `variant`); when `tone` is unset, `Badge` behaves exactly as it does today — every existing call site (e.g. `FINANCING_BADGE_VARIANT: Record<OrderFinancingStatus, BadgeProps["variant"]>` in `components/widgets/lpo/financing-card.tsx`) is unaffected.

- [ ] **Step 1: Add the tone vocabulary and dot-pill render path**

Find in `components/ui/badge.tsx`:

```tsx
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

Replace with:

```tsx
export type BadgeTone = "ok" | "open" | "warn" | "neg" | "muted" | "primary";

// Dot-pill tone vocabulary — the `.od-badge` treatment. Distinct from the
// `variant` prop above: `tone` is additive and, when set, takes over
// rendering entirely (see `Badge` below), so every existing `variant`-based
// call site keeps working unchanged.
const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  ok: "bg-pos-tint text-pos",
  open: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-canvas text-ink-3",
  primary: "bg-primary/10 text-primary-dark dark:text-primary",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders the `.od-badge` dot-pill treatment instead of `variant`, using
   *  the design's tone vocabulary. Takes precedence over `variant` when set. */
  tone?: BadgeTone;
  /** Leading status dot — only meaningful together with `tone`. */
  dot?: boolean;
}

function Badge({ className, variant, tone, dot, children, ...props }: BadgeProps) {
  if (tone) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
          BADGE_TONE_CLASSES[tone],
          className,
        )}
        {...props}
      >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        {children}
      </div>
    )
  }
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/ui/badge.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/badge.tsx
git commit -m "feat(ui): add Badge dot-pill tone variant" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Restyle PageHeader typography

**Files:**
- Modify: `components/layouts/page-shell.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: no signature change — `PageHeader`'s props are unchanged. Only the rendered title's font-weight and letter-spacing change.

This is the plan's one non-additive shared change: `PageHeader` is imported by roughly 220 pages. Its subtitle is already `font-mono text-[13px] text-muted-foreground` (the "mono submeta" the spec asks for), and the title is already `text-[26px]` — the only real deltas are `font-semibold` (600) → `font-bold` (700) and `tracking-tight` (Tailwind's default −0.025em) → the design's exact `-0.03em`.

- [ ] **Step 1: Update the title classes**

Find in `components/layouts/page-shell.tsx`:

```tsx
        <h1 className="flex items-center gap-3 text-[26px] font-semibold leading-tight tracking-tight text-ink">
```

Replace with:

```tsx
        <h1 className="flex items-center gap-3 text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink">
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file components/layouts/page-shell.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/layouts/page-shell.tsx
git commit -m "feat(layouts): bump PageHeader title to 700/-0.03em per the order-detail design" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Migrate the sales-order page onto the shared primitives

**Files:**
- Modify: `app/(protected)/orders/[id]/order-detail-view.tsx`

**Interfaces:**
- Consumes: `CountChip, IconChip, PanelCard, RailCard, SegTabs, StatusPill, StatusTag, type Tone` from `@/components/layouts/order-detail` (Task 1).
- Produces: no change — `OrderDetailView({ order: OrderDetail; currency?: string })`'s exported signature and rendered output are unchanged. This task only changes where seven components are *defined*, not what they render.

This must be a byte-for-byte mechanical lift: every JSX string, class list, and prop shape carries over unchanged except the `PanelCard` prop rename `flush` → `pad0` (a pure rename, done consistently at both the definition — already renamed when it was lifted in Task 1 — and every call site here).

- [ ] **Step 1: Swap the top-of-file imports**

Find:

```tsx
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FulfillmentStatus,
```

Replace with:

```tsx
import { cn } from "@/lib/utils";
import {
  CountChip,
  IconChip,
  PanelCard,
  RailCard,
  SegTabs,
  StatusPill,
  StatusTag,
  type Tone,
} from "@/components/layouts/order-detail";
import {
  FulfillmentStatus,
```

- [ ] **Step 2: Delete the local Tone type and CHIP map**

Find:

```tsx
type Tone = "pos" | "neg" | "warn" | "info" | "muted";

// Semantic chip colours. pos/neg/warn map onto the dashboard's status
// tokens (theme-aware); "info" is the design's blue for open / in-progress
// states — it follows the same convention the orders list already uses.
const CHIP: Record<Tone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  info: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  muted: "bg-canvas text-ink-3",
};

// Fixed hues for chips rendered on the always-dark money hero, where the
```

Replace with:

```tsx
// Fixed hues for chips rendered on the always-dark money hero, where the
```

(`TONE_HEX` right after this, and every `xxxToneOf` helper's `: Tone` return type, need no further edits — they now resolve `Tone` via the import added in Step 1.)

- [ ] **Step 3: Delete the local StatusPill/StatusTag/IconChip/CountChip/RailCard/PanelCard definitions**

Find:

```tsx
// ─── primitives ──────────────────────────────────────────────────────

function StatusPill({
  tone,
  dot,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
        CHIP[tone],
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

function StatusTag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.04em]",
        CHIP[tone],
      )}
    >
      {children}
    </span>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
      {children}
    </span>
  );
}

function CountChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-3">
      {children}
    </span>
  );
}

function RailCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3.5 flex items-center gap-2.5">
        <IconChip>{icon}</IconChip>
        <span className="text-[13.5px] font-semibold tracking-tight text-ink">
          {title}
        </span>
      </div>
      {children}
    </Card>
  );
}

function PanelCard({
  icon,
  title,
  count,
  flush,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-2.5 px-5 pt-4",
          flush ? "pb-3" : "pb-0",
        )}
      >
        <IconChip>{icon}</IconChip>
        <span className="text-[14px] font-semibold tracking-tight text-ink">
          {title}
        </span>
        {count != null && <CountChip>{count}</CountChip>}
      </div>
      <div className={flush ? "" : "px-5 pb-5 pt-3.5"}>{children}</div>
    </Card>
  );
}

// ─── money rail ──────────────────────────────────────────────────────
```

Replace with:

```tsx
// ─── money rail ──────────────────────────────────────────────────────
```

- [ ] **Step 4: Delete the local SegTabs definition**

Find:

```tsx
// ─── segmented tabs (reuses the date-filter pill control) ────────────

function SegTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: { id: TabKey; label: string; icon: typeof Receipt; count?: number }[];
  active: TabKey;
  onSelect: (id: TabKey) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div
        role="tablist"
        className="inline-flex items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px]"
      >
        {tabs.map((tb) => {
          const on = active === tb.id;
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(tb.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", on ? "opacity-100" : "opacity-70")} />
              {tb.label}
              {tb.count != null && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none",
                    on ? "bg-white/20 text-white" : "bg-canvas text-ink-3",
                  )}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── facts grid ──────────────────────────────────────────────────────
```

Replace with:

```tsx
// ─── facts grid ──────────────────────────────────────────────────────
```

- [ ] **Step 5: Rename the three `flush` call sites to `pad0`**

Find (inside `ItemsPanel`):

```tsx
      <PanelCard
        icon={<Package className="h-3.5 w-3.5" />}
        title="Items"
        count={items.length}
        flush={items.length > 0}
      >
```

Replace with:

```tsx
      <PanelCard
        icon={<Package className="h-3.5 w-3.5" />}
        title="Items"
        count={items.length}
        pad0={items.length > 0}
      >
```

Find (inside `ItemsPanel`, the removed-items card):

```tsx
        <PanelCard
          icon={<Undo2 className="h-3.5 w-3.5" />}
          title="Removed items"
          count={removed.length}
          flush
        >
```

Replace with:

```tsx
        <PanelCard
          icon={<Undo2 className="h-3.5 w-3.5" />}
          title="Removed items"
          count={removed.length}
          pad0
        >
```

Find (inside `PaymentsPanel`):

```tsx
      <PanelCard
        icon={<CreditCard className="h-3.5 w-3.5" />}
        title="Transactions"
        count={txs.length || undefined}
        flush={txs.length > 0}
      >
```

Replace with:

```tsx
      <PanelCard
        icon={<CreditCard className="h-3.5 w-3.5" />}
        title="Transactions"
        count={txs.length || undefined}
        pad0={txs.length > 0}
      >
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors. If you see `Card is declared but its value is never read` or similar, confirm Step 1 removed the `Card` import entirely (nothing in this file uses `<Card>` directly anymore — every use went through the now-imported `RailCard`/`PanelCard`).

Run: `npx next lint --file "app/(protected)/orders/[id]/order-detail-view.tsx"`
Expected: no errors, no unused-import warnings.

- [ ] **Step 7: Manual mechanical-lift review**

Open the file and confirm, by eye, that every remaining reference to `StatusPill`, `StatusTag`, `IconChip`, `CountChip`, `RailCard`, `PanelCard`, and `SegTabs` is a call site (JSX usage or type reference), not a definition — the only definitions left in the file should be the money/profit primitives (`MoneyHero`, `ProfitSplit`, `LegendItem`, `LRow`, `Ledger`) plus the sales-order-specific panels/tables (`FactGrid`, `Th`, `ItemsTable`, `TxnTable`, `RefundsList`, `Timeline`, `OverviewPanel`, `ItemsPanel`, `PaymentsPanel`, `TimelinePanel`) and the tone-mapping helpers. This confirms the lift removed exactly the seven primitives and nothing else.

- [ ] **Step 8: Commit**

```bash
git add "app/(protected)/orders/[id]/order-detail-view.tsx"
git commit -m "refactor(orders): migrate sales-order detail page onto shared order-detail primitives" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Recompose the purchase-order detail page

**Files:**
- Modify: `app/(protected)/purchase-orders/[id]/page.tsx`

**Interfaces:**
- Consumes:
  - `PanelCard, RailCard, StatusPill, VList, VRow, DetailTable, DetailTableHead, DetailTh, DetailTableBody, DetailTd, DetailTableTotals, type Tone` from `@/components/layouts/order-detail` (Tasks 1–2).
  - `KpiStrip, KpiCard` from `@/components/layouts/kpi-strip` (unchanged, cols now `5`).
  - `PageShell, PageHeader, PageBreadcrumbs, PageBody` from `@/components/layouts/page-shell` (unchanged API).
  - `Money` from `@/components/widgets/money`; `effectiveLpoStatus`, `type Lpo` from `@/types/lpo/type`; `LpoStatusActions`, `LpoShareButton`, `LpoShareAcknowledgement`, `FinancingCard`, `FinancingBanner`, `AttachmentsPanel` — all unchanged existing widgets, mounted here, not modified by this task.
- Produces: no change to the page's exported default — `LpoDetailPage({ params: Promise<{ id: string }> })` — or to any of its data-fetching behavior (financing gating, mixed-currency totals). Only the JSX composition changes.

This is a full-file rewrite of the render (the async data-fetching prologue is preserved verbatim). Two judgment calls made concrete here, both grounded in the actual `Lpo`/`LpoItem` types (`types/lpo/type.ts`), which carry no separate SKU/product-code field:

1. **Status pill tone.** `effectiveLpoStatus()` returns a label plus a raw Tailwind class string, not a `Tone`. A local `lpoStatusTone()` helper maps `LpoStatus` + `SupplierAcknowledgement` onto the shared `Tone` vocabulary, mirroring `effectiveLpoStatus`'s own override logic (awaiting-supplier → warn, rejected-by-supplier → neg) so the pill's color always agrees with the pill's text.
2. **"SKU sub-lines."** `LpoItem` has no SKU/product-code field — only `stockVariantId` (a UUID) and `variantName`. The only sub-line-worthy signal on the line is currency deviation, so the sub-line under each item's name reads "Billed in {currency}" whenever that line's currency differs from the LPO's primary currency. The page-level "Lines span multiple currencies" notice is kept too (now inside the Items `PanelCard`, above the table) so the existing mixed-currency handling is fully preserved, not just replaced by the per-row hint.

- [ ] **Step 1: Replace the full file**

```tsx
import { notFound } from "next/navigation";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  PanelCard,
  RailCard,
  StatusPill,
  VList,
  VRow,
  DetailTable,
  DetailTableHead,
  DetailTh,
  DetailTableBody,
  DetailTd,
  DetailTableTotals,
  type Tone,
} from "@/components/layouts/order-detail";
import { Money } from "@/components/widgets/money";
import { DEFAULT_CURRENCY } from "@/lib/helpers";
import { getLpo } from "@/lib/actions/lpo-actions";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import { effectiveLpoStatus, type Lpo } from "@/types/lpo/type";
import { LpoStatusActions } from "@/components/widgets/lpo/status-actions";
import { LpoShareButton } from "@/components/widgets/lpo/share-dialog";
import { LpoShareAcknowledgement } from "@/components/widgets/lpo/share-acknowledgement";
import { FinancingCard } from "@/components/widgets/lpo/financing-card";
import { FinancingBanner } from "@/components/widgets/lpo/financing-banner";
import { LOANS_ENABLED } from "@/lib/loans/config";
import { getLoanAccess } from "@/lib/loans/access";
import {
  getMyApplication,
  getFinancingTerms,
} from "@/lib/actions/loan-applications-actions";
import type { LoanApplication } from "@/types/loans/applications";
import { AttachmentsPanel } from "@/components/widgets/attachments-panel";
import {
  FileText,
  Layers,
  Boxes,
  PackageCheck,
  AlertCircle,
  Building2,
  Coins,
  Package,
} from "lucide-react";

type Params = Promise<{ id: string }>;

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Maps the LPO's internal status (plus the supplier-acknowledgement override
// `effectiveLpoStatus` already applies for its label) onto the shared
// `StatusPill` tone vocabulary. Kept local — it's LPO-specific, not a
// generic order-detail concern.
function lpoStatusTone(lpo: Lpo): Tone {
  if (lpo.status === "APPROVED" && lpo.supplierAcknowledgement === "PENDING") {
    return "warn";
  }
  if (lpo.status === "CANCELLED" && lpo.supplierAcknowledgement === "REJECTED") {
    return "neg";
  }
  switch (lpo.status) {
    case "DRAFT":
      return "muted";
    case "SUBMITTED":
    case "APPROVED":
      return "info";
    case "PARTIALLY_RECEIVED":
      return "warn";
    case "RECEIVED":
      return "pos";
    case "CANCELLED":
      return "neg";
    default:
      return "muted";
  }
}

export default async function LpoDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (id === "new") notFound();

  const [lpo, suppliers] = await Promise.all([getLpo(id), fetchAllSuppliers()]);
  if (!lpo) notFound();

  const supplier = suppliers.find((s) => s.id === lpo.supplierId) ?? null;

  // ── Financing gating + context (spec §7) ─────────────────────────
  // Banner + modal render only for viewers with the loans module enabled
  // AND loans:read. The application (when one exists) is read here so the
  // banner renders in-progress / offer-ready / declined states without a
  // client round-trip; a transient LMS failure degrades to null (the banner
  // then shows honest in-progress off financingStatus alone).
  const loanAccess = LOANS_ENABLED ? await getLoanAccess() : null;
  const showFinancing = Boolean(LOANS_ENABLED && loanAccess?.canRead);
  const application: LoanApplication | null =
    showFinancing && lpo.loanApplicationId
      ? await getMyApplication(lpo.loanApplicationId).catch(() => null)
      : null;
  // Terms acceptance drives the "Terms accepted" tracker stage on the
  // financing card; only worth a call once the LPO is actually financed.
  // Best-effort like `application` above — financing is secondary content on
  // this page and a transient LMS failure here must never take down the
  // primary purchase-order view.
  const financingTerms =
    showFinancing && lpo.paymentMethod === "SETTLO_FINANCING"
      ? await getFinancingTerms().catch(() => null)
      : null;

  const lpoCurrency = lpo.currency || lpo.items[0]?.currency || DEFAULT_CURRENCY;
  const totalOrdered = lpo.items.reduce(
    (sum, item) => sum + Number(item.orderedQuantity || 0),
    0,
  );
  const totalReceived = lpo.items.reduce(
    (sum, item) => sum + Number(item.receivedQuantity || 0),
    0,
  );
  const totalOutstanding = Math.max(0, totalOrdered - totalReceived);
  const totalsByCurrency = lpo.items.reduce<Map<string, number>>((acc, item) => {
    const cur = (item.currency || lpoCurrency).toUpperCase();
    const line = Number(item.orderedQuantity || 0) * Number(item.unitCost || 0);
    acc.set(cur, (acc.get(cur) ?? 0) + line);
    return acc;
  }, new Map<string, number>());
  const hasMixedCurrency = totalsByCurrency.size > 1;

  const statusInfo = effectiveLpoStatus(lpo.status, lpo.supplierAcknowledgement);

  // KpiStrip's "Order value" tile — a single figure in the common case, or
  // every currency's subtotal stacked when the LPO's lines are mixed (same
  // per-currency data the items table's totals row uses).
  const orderValueNode = hasMixedCurrency ? (
    <div className="flex flex-col items-end gap-0.5 text-[15px] leading-tight">
      {Array.from(totalsByCurrency.entries()).map(([cur, amt]) => (
        <span key={cur}>
          {amt.toLocaleString()}{" "}
          <span className="font-mono text-[10px] font-normal text-muted-foreground">
            {cur}
          </span>
        </span>
      ))}
    </div>
  ) : (
    (Array.from(totalsByCurrency.values())[0] ?? 0).toLocaleString()
  );

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Purchase Orders", href: "/purchase-orders" },
          { title: lpo.lpoNumber },
        ]}
      />
      <PageHeader
        title={lpo.lpoNumber}
        subtitle={`${supplier?.name || "Unknown supplier"} · Created ${formatDateTime(lpo.createdAt)} · ${lpoCurrency}`}
        titleAccessory={
          <span className="flex items-center gap-2">
            <StatusPill tone={lpoStatusTone(lpo)} dot>
              {statusInfo.label}
            </StatusPill>
            {lpo.paymentMethod === "SETTLO_FINANCING" && (
              <StatusPill tone="info">Settlo financed</StatusPill>
            )}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LpoShareButton lpo={lpo} />
            <LpoStatusActions lpo={lpo} />
          </div>
        }
      />
      <PageBody>
        {showFinancing && (
          <FinancingBanner
            lpo={lpo}
            application={application}
            canApply={loanAccess?.canApply ?? false}
          />
        )}

        <KpiStrip cols={5}>
          <KpiCard
            icon={<Layers className="h-3 w-3" />}
            label="Items"
            value={lpo.items.length.toLocaleString()}
          />
          <KpiCard
            icon={<Boxes className="h-3 w-3" />}
            label="Ordered"
            value={totalOrdered.toLocaleString()}
          />
          <KpiCard
            icon={<PackageCheck className="h-3 w-3" />}
            label="Received"
            value={`${totalReceived.toLocaleString()} (${
              totalOrdered > 0
                ? Math.round((totalReceived / totalOrdered) * 100)
                : 0
            }%)`}
          />
          <KpiCard
            icon={<AlertCircle className="h-3 w-3" />}
            label="Outstanding"
            value={totalOutstanding.toLocaleString()}
            deltaTone={totalOutstanding === 0 ? "pos" : "neutral"}
          />
          <KpiCard
            icon={<Coins className="h-3 w-3" />}
            label="Order value"
            value={orderValueNode}
            unit={!hasMixedCurrency ? lpoCurrency : undefined}
          />
        </KpiStrip>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
            <RailCard icon={<Building2 className="h-3.5 w-3.5" />} title="Supplier">
              <VList>
                <VRow label="Supplier" value={supplier?.name || "—"} />
                <VRow
                  label="Contact"
                  value={
                    supplier
                      ? [supplier.phone, supplier.email].filter(Boolean).join(" · ") ||
                        "—"
                      : "—"
                  }
                />
                <VRow label="Location type" value={lpo.locationType} />
                <VRow label="Last updated" value={formatDateTime(lpo.updatedAt)} />
              </VList>
            </RailCard>

            <LpoShareAcknowledgement lpo={lpo} supplier={supplier} />

            <FinancingCard
              lpo={lpo}
              termsAcceptedAt={financingTerms?.acceptedAt ?? null}
              applicationStatus={application?.status ?? null}
            />
          </aside>

          <main className="flex min-w-0 flex-col gap-3.5">
            <PanelCard
              icon={<Package className="h-3.5 w-3.5" />}
              title="Items"
              count={lpo.items.length}
              pad0
            >
              {hasMixedCurrency && (
                <div className="border-b border-line bg-warn-tint px-5 py-2 text-[11.5px] font-medium text-warn">
                  Lines span multiple currencies — conversion happens at GRN receive.
                </div>
              )}
              <DetailTable>
                <DetailTableHead>
                  <DetailTh>Item</DetailTh>
                  <DetailTh align="right">Ordered</DetailTh>
                  <DetailTh align="right">Received</DetailTh>
                  <DetailTh align="right">Outstanding</DetailTh>
                  <DetailTh align="right">Unit cost</DetailTh>
                  <DetailTh align="right">Line total</DetailTh>
                </DetailTableHead>
                <DetailTableBody>
                  {lpo.items.map((item) => {
                    const lineCurrency = item.currency || lpoCurrency;
                    const ordered = Number(item.orderedQuantity || 0);
                    const received = Number(item.receivedQuantity || 0);
                    const outstanding = Math.max(0, ordered - received);
                    const lineTotal = ordered * Number(item.unitCost || 0);
                    const pct =
                      ordered > 0 ? Math.round((received / ordered) * 100) : 0;
                    const offCurrency =
                      Boolean(item.currency) && item.currency !== lpoCurrency;
                    return (
                      <tr key={item.id}>
                        <DetailTd>
                          <div className="text-[13.5px] font-semibold tracking-tight text-ink">
                            {item.variantName || "—"}
                          </div>
                          {offCurrency && (
                            <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
                              Billed in {lineCurrency}
                            </div>
                          )}
                        </DetailTd>
                        <DetailTd align="right">{ordered.toLocaleString()}</DetailTd>
                        <DetailTd align="right">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold tabular-nums text-ink">
                              {received.toLocaleString()}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {pct}%
                            </span>
                          </div>
                        </DetailTd>
                        <DetailTd
                          align="right"
                          className={
                            outstanding === 0
                              ? "font-semibold text-pos"
                              : outstanding === ordered
                                ? "font-medium text-muted-2"
                                : "font-semibold text-warn"
                          }
                        >
                          {outstanding.toLocaleString()}
                        </DetailTd>
                        <DetailTd align="right">
                          <Money amount={Number(item.unitCost)} currency={lineCurrency} />
                        </DetailTd>
                        <DetailTd align="right" strong>
                          <Money amount={lineTotal} currency={lineCurrency} />
                        </DetailTd>
                      </tr>
                    );
                  })}
                </DetailTableBody>
                <DetailTableTotals>
                  <DetailTd align="right" strong>
                    Totals
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalOrdered.toLocaleString()}
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalReceived.toLocaleString()}
                  </DetailTd>
                  <DetailTd align="right" strong>
                    {totalOutstanding.toLocaleString()}
                  </DetailTd>
                  <DetailTd />
                  <DetailTd align="right" strong>
                    <div className="flex flex-col items-end gap-0.5">
                      {Array.from(totalsByCurrency.entries()).map(([cur, amt]) => (
                        <Money key={cur} amount={amt} currency={cur} />
                      ))}
                    </div>
                  </DetailTd>
                </DetailTableTotals>
              </DetailTable>
            </PanelCard>

            <AttachmentsPanel
              entityType="LPO"
              entityId={lpo.id}
              description="Quotations, approval letters, supplier correspondence. Max 10 MB per file."
            />

            {lpo.notes && (
              <PanelCard icon={<FileText className="h-3.5 w-3.5" />} title="Notes">
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
                  {lpo.notes}
                </p>
              </PanelCard>
            )}
          </main>
        </div>
      </PageBody>
    </PageShell>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx next lint --file "app/(protected)/purchase-orders/[id]/page.tsx"`
Expected: no errors, no unused-import warnings (the old `Card`/`CardContent` import and the local `Field` helper are both gone — confirm neither is referenced anywhere else in the file).

- [ ] **Step 3: Commit**

```bash
git add "app/(protected)/purchase-orders/[id]/page.tsx"
git commit -m "feat(purchase-orders): recompose detail page on order-detail primitives, rail left" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Final verification — production build + archetype smoke pass

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 2: Production build**

Run: `NODE_OPTIONS=--max-old-space-size=8192 npx next build`
Expected: exit 0 (check with `echo $?` immediately after — do not infer success from unpiped output alone), and `.next/BUILD_ID` exists afterward (`test -f .next/BUILD_ID && echo present`). If the build OOMs or exits non-zero, do not retry with a smaller heap — that is the known-required flag (see repo memory on Customer-Dashboard builds); investigate the actual compile error instead.

- [ ] **Step 3: Boot the production build for the smoke pass**

Run: `NODE_OPTIONS=--max-http-header-size=65536 npx next start -p 3990 &` (background) and wait for it to report ready (poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:3990` until it stops erroring, up to ~30s).

- [ ] **Step 4: Archetype smoke pass — render-level check**

This repo has no browser-automation tool configured, and every one of these routes sits behind auth, so a plain `curl` will very likely redirect to `/login` rather than return the page body — that redirect (a 30x) is itself the useful signal here: it proves the route compiled and rendered on the server without throwing. A `500`/`Internal Server Error` response is the failure signal to act on. If you have interactive browser access in your environment (e.g. Playwright), additionally log into the app and visually inspect each page instead of relying on the curl proxy below — but the curl pass is the mandatory minimum.

For each archetype page, run `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3990<path>` and record the status code:

| Shape | Path | Notes |
|---|---|---|
| List with DataTable | `/products` | uses `PageHeader` + `DataTable` |
| Detail page (unrelated to this plan) | `/suppliers/<any-existing-id>` | uses `PageHeader` + `Card`; if you have no known id, hit `/suppliers` instead and note that the detail page itself couldn't be reached without live data |
| Form | `/suppliers/new` | uses `PageHeader` over a form |
| Settings | `/settings` | uses `PageHeader` + `Card` |
| Dashboard home | `/dashboard` | uses `PageShell` (no `PageHeader`) + `Card`/`Badge` inside `components/dashboard/Dashboard` |
| Admin page | `/admin/dashboard` (served from the `(admin)` route group) | uses `PageHeader` |
| Sales-order detail (migrated) | `/orders/<any-existing-id>` | the Task 6 migration target |
| Purchase-order detail (recomposed) | `/purchase-orders/<any-existing-id>` | the Task 7 recomposition target |

Report any `500` alongside the route. A `500` caused by an unreachable upstream backend/API in this environment (not by a React render exception) is an infra limitation, not a plan defect — note it as such rather than treating it as a failure, but do not skip investigating whether the stack trace actually points at one of the files this plan touched.

- [ ] **Step 5: Stop the server**

Run: `kill %1` (or find and kill the `next start` process started in Step 3).

- [ ] **Step 6: Spec-conformance read-through**

This step needs no running server — it is always executable. Re-open `docs/superpowers/specs/2026-08-03-po-detail-redesign-design.md` alongside the two finished files and confirm, line by line:

- Against spec §4 (purchase-order composition), open `app/(protected)/purchase-orders/[id]/page.tsx` and check off: breadcrumb → header (status pill, "Settlo financed" pill when `paymentMethod === "SETTLO_FINANCING"`, mono submeta, Share/Receive stock/Cancel actions) → `FinancingBanner` directly under the header → 5-up `KpiStrip` (Items, Ordered, Received-with-%, Outstanding, Order value) → `grid-cols-[360px_minmax(0,1fr)]` with the rail on the LEFT (Supplier `VList`, Supplier acceptance, `FinancingCard`) and the main column on the right (Items `PanelCard pad0` + `DetailTable` with totals row, Attachments, Notes) → mixed-currency totals still per-currency, not collapsed to one figure.
- Against spec §5 (sales-order migration), open `app/(protected)/orders/[id]/order-detail-view.tsx` and confirm the seven primitives are imported, not defined, and that `MoneyHero`/`ProfitSplit`/`Ledger`/`LRow`/`LegendItem` are still defined locally in this file.
- Confirm neither file defines `StatusPill`, `StatusTag`, `IconChip`, `CountChip`, `RailCard`, `PanelCard`, `SegTabs`, `VList`, `VRow`, or any `DetailTable*` export locally — every one of those symbols should resolve via an import from `@/components/layouts/order-detail`.

If any bullet fails, fix it before considering this plan complete — do not proceed to a PR or hand-off with a known gap here.

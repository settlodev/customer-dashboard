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
        <h3 className="text-[13.5px] font-semibold tracking-tight text-ink">
          {title}
        </h3>
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
        <h3 className="text-[14px] font-semibold tracking-tight text-ink">
          {title}
        </h3>
        {count != null && <CountChip>{count}</CountChip>}
      </div>
      <div className={pad0 ? "" : "px-5 pb-5 pt-3.5"}>{children}</div>
    </Card>
  );
}

// `SegTabs` (and its `SegTab` type) lives in `./seg-tabs` — it's the one
// primitive here that attaches an event handler and needs `"use client"`;
// see that file's header comment for why it's split out rather than
// putting the directive on this whole module.

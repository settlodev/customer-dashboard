"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Table chrome shared by the list-style settings panels (tax types, expense
 * categories, chart of accounts, closure dates…). One place for the card,
 * the loading and empty states, the horizontal scroll container, and the
 * head/cell classes — so every CRUD panel reads the same.
 *
 * Columns stay with the caller: compose `<SettingsTableCard>` around a plain
 * `<table>` whose header row uses {@link tableHeadRowClass} / {@link thClass}
 * and whose body rows use {@link trClass} / {@link tdClass}.
 */

export const tableHeadRowClass =
  "border-b border-line bg-canvas text-left font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3";

export const thClass = "whitespace-nowrap px-4 py-2.5 font-semibold";

export const trClass = "border-b border-line last:border-b-0 hover:bg-canvas/60";

export const tdClass = "px-4 py-3 align-middle text-[13px] text-ink";

/** Right-aligned action cell — keeps the button cluster from wrapping. */
export const tdActionsClass = "px-4 py-3 text-right whitespace-nowrap";

export function SettingsTableCard({
  loading,
  isEmpty,
  emptyLabel = "Nothing here yet.",
  loadingLabel = "Loading…",
  className,
  children,
}: {
  loading?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  loadingLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden border-line", className)}>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingLabel}
          </div>
        ) : isEmpty ? (
          <div className="py-10 text-center text-[13px] text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          // Wide tables scroll inside the card rather than the page.
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** Small neutral chip for row metadata, e.g. a "System" marker. */
export function RowTag({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 inline-flex items-center rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
      {children}
    </span>
  );
}

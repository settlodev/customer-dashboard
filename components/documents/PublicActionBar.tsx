"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Spacer placed (in flow) after a {@link PrintableDocument} so the document's
 * bottom edge can scroll clear of the fixed action bar. Hidden on print.
 */
export function ActionBarSpacer() {
  return <div className="h-24 print:hidden" />;
}

/**
 * Fixed, always-visible action bar for shared public documents. Floats above
 * the page bottom so the primary action (accept / acknowledge) is never missed
 * — the previous pattern tucked it below a full-height A4 page where it was
 * easy to scroll past. Hidden on print so the PDF stays clean.
 *
 * Render it together with an {@link ActionBarSpacer} as siblings after the
 * document:
 *
 *   <PrintableDocument … />
 *   <ActionBarSpacer />
 *   <PublicActionBar className="flex … justify-between">…</PublicActionBar>
 *
 * Owns only the fixed shell + document-width container; callers pass their own
 * flex layout via `className`.
 */
export function PublicActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur print:hidden">
      <div className={cn("mx-auto max-w-[210mm] px-4 py-3", className)}>
        {children}
      </div>
    </div>
  );
}

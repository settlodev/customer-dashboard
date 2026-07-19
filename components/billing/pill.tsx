import React from "react";
import { cn } from "@/lib/utils";
import type { BadgeProps } from "@/components/ui/badge";

/**
 * StatusPill — the dotted, fully-rounded status chip the billing design
 * uses everywhere a lifecycle state is shown (subscription header,
 * subscribed-entity rows, invoice rows, invoice documents).
 *
 * It is deliberately *not* the global `<Badge>`: Badge is a squared
 * 11px tag used for counts and neutral labels, while billing statuses
 * read as pills with a leading dot (`.pill` / `.st` / `.bl-status` in
 * the prototype). Keeping it local avoids re-skinning Badge for the
 * whole app.
 */

export type PillTone = "pos" | "neg" | "warn" | "neutral";

const TONE_CLASS: Record<PillTone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  neutral: "bg-canvas text-ink-3",
};

/**
 * Bridges the `BadgeProps["variant"]` values returned by the existing
 * `shared.ts` status-meta helpers onto a pill tone, so call sites can
 * keep using `getInvoiceStatusMeta` / `getSubscriptionStatusMeta`.
 */
export function toPillTone(variant: BadgeProps["variant"]): PillTone {
  switch (variant) {
    case "pos":
      return "pos";
    case "neg":
    case "destructive":
      return "neg";
    case "warn":
      return "warn";
    default:
      return "neutral";
  }
}

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

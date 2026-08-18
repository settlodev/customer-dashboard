import React from "react";
import { cn } from "@/lib/utils";

/**
 * DefList / DefRow — the label↔value rows used in the account-detail right
 * column (Subscription, Engagement, Support, Timestamps) and the dashboard's
 * Billing / Platform-health panels. Hairline divider between rows, value
 * right-aligned in mono with optional tone, and an optional leading icon
 * swatch on the label.
 */

export function DefList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

export type DefTone = "default" | "pos" | "neg" | "warn" | "dim";

const VALUE_TONE: Record<DefTone, string> = {
  default: "text-ink",
  pos: "text-pos",
  neg: "text-neg",
  warn: "text-warn",
  dim: "font-medium text-muted-2",
};

interface DefRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Tints the value. */
  tone?: DefTone;
  /** Optional leading icon swatch on the label (use <DefIcon/>). */
  icon?: React.ReactNode;
  /** Render the value as-is (e.g. a pill) without mono styling. */
  rawValue?: boolean;
}

export function DefRow({
  label,
  value,
  tone = "default",
  icon,
  rawValue = false,
}: DefRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-b-0">
      <div className="flex items-center gap-2.5 text-[13px] text-ink-3">
        {icon}
        <span>{label}</span>
      </div>
      {rawValue ? (
        <div className="text-right">{value}</div>
      ) : (
        <div
          className={cn(
            "text-right font-mono text-[12.5px] font-semibold tabular-nums",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </div>
      )}
    </div>
  );
}

export type DefIconTone = "pos" | "neg" | "warn" | "blue" | "neutral";

const ICON_TONE: Record<DefIconTone, string> = {
  pos: "bg-pos-tint text-pos",
  neg: "bg-neg-tint text-neg",
  warn: "bg-warn-tint text-warn",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  neutral: "bg-black/5 text-ink-3 dark:bg-white/5",
};

/** Small tinted square that fronts a DefRow label (icon goes inside). */
export function DefIcon({
  tone = "neutral",
  children,
}: {
  tone?: DefIconTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "grid h-6.5 w-6.5 flex-shrink-0 place-items-center rounded-[7px]",
        ICON_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

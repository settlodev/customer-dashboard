import React from "react";
import { cn } from "@/lib/utils";

/**
 * BarList / BarRow — the horizontal share-bar list used for "Plan mix" and
 * "Locations by region" on the dashboard. Each row is a label + value line
 * with a thin track underneath whose fill width encodes the share.
 */

export function BarList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col gap-3.5", className)}>{children}</div>;
}

interface BarRowProps {
  label: React.ReactNode;
  /** Main right-aligned value (e.g. "TZS 1.50M" or "9"). */
  value: React.ReactNode;
  /** Share 0–100: drives the fill width and the muted "%" beside the value. */
  pct: number;
  /** Fill (and dot) colour — CSS colour string. Defaults to brand orange. */
  color?: string;
  /** Show a small colour chip before the label. */
  dot?: boolean;
  /** Hide the "%" next to the value (when the value already is a percent). */
  hidePct?: boolean;
}

export function BarRow({
  label,
  value,
  pct,
  color = "hsl(var(--primary))",
  dot = false,
  hidePct = false,
}: BarRowProps) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-2.5 gap-y-1">
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
        {dot && (
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="whitespace-nowrap text-right font-mono text-[12.5px] font-medium tabular-nums text-ink">
        {value}
        {!hidePct && (
          <span className="ml-1.5 text-[11px] text-muted-foreground">
            {Math.round(width)}%
          </span>
        )}
      </div>
      <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

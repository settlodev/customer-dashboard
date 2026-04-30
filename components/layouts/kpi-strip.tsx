/**
 * KpiStrip — the hairline-bordered "summary metrics" row that sits at
 * the top of dashboard list / detail pages.
 *
 * Visual contract (matches the prototype's `.kpi-strip` rules):
 *   - bg-card with a single 1px hairline border + rounded-lg corner
 *   - children render in a 1–6 column grid; vertical dividers between
 *   - each <KpiCard> gets:
 *       • mono uppercase 10.5px label (with optional leading icon)
 *       • 22px display-weight tabular value, with an optional
 *         small-mono unit baseline-aligned next to it
 *       • mono delta line tinted pos/neg/neutral
 *       • optional 60×22 sparkline pinned bottom-right
 *
 * Reusable: drop it on any protected page that needs a summary row.
 *
 * Example:
 *
 *   <KpiStrip cols={4}>
 *     <KpiCard label="Inventory value" value="714,232,919" unit="TZS"
 *              delta="+4.2% wk" deltaTone="pos"
 *              spark={[40,42,48,45,52,58,62,64]} />
 *     ...
 *   </KpiStrip>
 */

import React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// KpiStrip — outer grid wrapper. Children should be <KpiCard>s.
// ─────────────────────────────────────────────────────────────────────

interface KpiStripProps {
  children: React.ReactNode;
  /** Desktop column count (≥ md). Mobile always falls back to 2 cols. */
  cols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

// Responsive ladder for each `cols` value. Always starts at 2 cards on
// mobile, then steps up. The 6-card variant snaps to a single row at
// `lg` (1024px) so laptops don't end up with a 2-row strip; below
// that it falls back to 3 cards × 2 rows, then 2 cards on mobile.
const COLS_MAP: Record<NonNullable<KpiStripProps["cols"]>, string> = {
  2: "",
  3: "md:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export function KpiStrip({
  children,
  cols = 4,
  className,
}: KpiStripProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-line",
        className,
      )}
    >
      {/*
       * Trick for clean dividers across any reflow: paint the wrapper
       * with `bg-line`, leave a 1px gap between grid cells, and let
       * each card paint `bg-card`. The "gaps" become hairlines and
       * the pattern survives wrapping (no orphan bottom-border on the
       * last row) without needing per-child nth-child rules.
       */}
      <div
        className={cn(
          "grid grid-cols-2 gap-px bg-line",
          COLS_MAP[cols],
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// KpiCard — single metric tile.
// ─────────────────────────────────────────────────────────────────────

export type KpiDeltaTone = "pos" | "neg" | "neutral";

export interface KpiCardProps {
  /** Optional leading icon, sits inline with the label. */
  icon?: React.ReactNode;
  /** Mono uppercase label (top of card). */
  label: React.ReactNode;
  /** Big tabular-numeric value. Pre-format strings (e.g. "12,847"). */
  value: React.ReactNode;
  /** Optional small mono unit next to the value (e.g. "TZS", "%"). */
  unit?: React.ReactNode;
  /** Optional mono delta line (e.g. "+4.2% wk", "−1.1% wk"). */
  delta?: React.ReactNode;
  /** Tints the delta line + chooses the delta arrow icon. */
  deltaTone?: KpiDeltaTone;
  /** Numeric series for the bottom-right sparkline. Skip to omit. */
  spark?: number[];
  /** CSS color string for the sparkline stroke. */
  sparkColor?: string;
  className?: string;
}

const DELTA_TONE_MAP: Record<KpiDeltaTone, string> = {
  pos: "text-pos",
  neg: "text-neg",
  neutral: "text-muted-foreground",
};

export function KpiCard({
  icon,
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  spark,
  sparkColor,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative bg-card px-4 py-4 md:px-5 md:pb-5 md:pt-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
        {icon && <span className="opacity-70">{icon}</span>}
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-baseline gap-1.5 text-[22px] font-semibold leading-none tracking-[-0.025em] text-ink tabular-nums">
        <span>{value}</span>
        {unit && (
          <span className="font-mono text-[11px] font-normal tracking-[0.02em] text-muted-foreground">
            {unit}
          </span>
        )}
      </div>

      {delta && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
            DELTA_TONE_MAP[deltaTone],
          )}
        >
          {deltaTone === "pos" && (
            <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
          )}
          {deltaTone === "neg" && (
            <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />
          )}
          {delta}
        </div>
      )}

      {spark && spark.length > 1 && (
        <KpiSparkline
          data={spark}
          color={sparkColor ?? toneSparkColor(deltaTone)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// KpiSparkline — tiny SVG line, no external dependency.
// Auto-scales to its data range and anchors bottom-right of the parent
// card (the parent must be `relative`, which `KpiCard` already is).
// ─────────────────────────────────────────────────────────────────────

interface KpiSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function KpiSparkline({
  data,
  color = "hsl(var(--primary))",
  width = 60,
  height = 22,
  className,
}: KpiSparklineProps) {
  if (!data?.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pathSegments = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const d = `M ${pathSegments.join(" L ")}`;

  return (
    <svg
      className={cn(
        "pointer-events-none absolute bottom-3 right-3 opacity-85",
        className,
      )}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={d} stroke={color} strokeWidth={1.2} fill="none" />
    </svg>
  );
}

function toneSparkColor(tone: KpiDeltaTone): string {
  switch (tone) {
    case "pos":
      return "hsl(var(--pos))";
    case "neg":
      return "hsl(var(--neg))";
    default:
      return "hsl(var(--primary))";
  }
}

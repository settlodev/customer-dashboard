import React from "react";
import { cn } from "@/lib/utils";

/**
 * MetricCard — a headline KPI tile for the dashboard's top row (MRR, ARR,
 * GMV, NRR). Larger and more prominent than the compact <KpiCard> strip:
 * leading icon + mono label, a 30px display value with currency prefix and
 * a muted magnitude suffix, then a footer with a tinted delta chip and
 * either an inline sparkline or a mono foot-note.
 */

export type DeltaTone = "up" | "down" | "flat";

const DELTA_TONE: Record<DeltaTone, string> = {
  up: "bg-pos-tint text-pos",
  down: "bg-neg-tint text-neg",
  flat: "bg-black/[0.04] text-ink-3 dark:bg-white/[0.06]",
};

const DELTA_GLYPH: Record<DeltaTone, string> = {
  up: "▲",
  down: "▼",
  flat: "→",
};

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  /** Small currency prefix shown before the value, e.g. "TZS". */
  currency?: string;
  /** Pre-formatted magnitude, e.g. "3.64" or "108". */
  value: string;
  /** Muted unit after the value, e.g. "M", "%". */
  suffix?: string;
  delta?: { value: string; tone: DeltaTone };
  /** Series for the inline footer sparkline (skip to show footNote instead). */
  spark?: number[];
  footNote?: string;
}

export function MetricCard({
  icon,
  label,
  currency,
  value,
  suffix,
  delta,
  spark,
  footNote,
}: MetricCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-card p-[18px]">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon && <span className="opacity-90">{icon}</span>}
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.09em]">
          {label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline text-[30px] font-bold leading-none tracking-[-0.03em] text-ink tabular-nums">
        {currency && (
          <span className="mr-1 text-[15px] font-semibold tracking-[-0.01em] text-ink-3">
            {currency}
          </span>
        )}
        <span>{value}</span>
        {suffix && <span className="font-semibold text-muted-foreground">{suffix}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2.5">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] font-mono text-[12px] font-semibold tabular-nums",
              DELTA_TONE[delta.tone],
            )}
          >
            <span className="text-[9px] leading-none">{DELTA_GLYPH[delta.tone]}</span>
            {delta.value}
          </span>
        )}
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} />
        ) : footNote ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {footNote}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Inline area sparkline (96×34) used in the metric-card footer. */
function Sparkline({ data }: { data: number[] }) {
  const width = 96;
  const height = 34;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");
  const area = `M ${line} L ${width},${height} L 0,${height} Z`;
  const gradId = `mc-spark-${data.length}-${Math.round(data[0])}`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="flex-shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={`M ${line}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

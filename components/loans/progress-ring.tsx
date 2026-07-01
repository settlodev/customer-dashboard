import { cn } from "@/lib/utils";

/**
 * Circular repayment-progress indicator. Track uses the warm canvas token,
 * the arc uses the positive/green token — both adapt to dark mode.
 */
export function ProgressRing({
  pct,
  label = "Repaid",
  size = 132,
  stroke = 11,
  className,
}: {
  pct: number;
  label?: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(pct)));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--canvas))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--pos))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[26px] font-bold leading-none tracking-tight text-ink">
          {clamped}%
        </div>
        <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

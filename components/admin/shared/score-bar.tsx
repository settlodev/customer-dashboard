import { cn } from "@/lib/utils";

/**
 * One 0-100 sub-score as a labelled bar. Shared by the business-detail and
 * location-detail health cards: the two grains run the identical model with
 * identical weights (V081), so a location's 40 next to its business's 75 is a
 * meaningful comparison only if they are also drawn the same way.
 *
 * `null` means the nightly model hasn't scored this entity yet — rendered as an
 * empty track and an em dash, never as a zero, which would read as "scored, and
 * terrible".
 */
export function ScoreBar({
  name,
  score,
}: {
  name: string;
  score: number | null;
}) {
  const v = score == null ? null : Math.round(score);
  const color =
    v == null
      ? "transparent"
      : v < 30
        ? "hsl(var(--neg))"
        : v < 60
          ? "hsl(var(--warn))"
          : "hsl(var(--pos))";
  return (
    <div className="grid grid-cols-[80px_1fr_32px] items-center gap-3 py-2 sm:grid-cols-[96px_1fr_34px]">
      <div className="text-[13px] text-ink-2">{name}</div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div
          className="h-full rounded-full"
          style={{ width: `${v ?? 0}%`, backgroundColor: color }}
        />
      </div>
      <div
        className={cn(
          "text-right font-mono text-[12px] font-semibold tabular-nums",
          v == null && "font-medium text-muted-2",
        )}
      >
        {v == null ? "—" : v}
      </div>
    </div>
  );
}

/** The five components of the health model, in the order both cards show them. */
export function HealthScoreBars({
  health,
}: {
  health: {
    revenue_score?: number | null;
    engagement_score?: number | null;
    growth_score?: number | null;
    retention_score?: number | null;
    operational_score?: number | null;
  } | null;
}) {
  return (
    <div className="flex flex-col">
      <ScoreBar name="Revenue" score={health?.revenue_score ?? null} />
      <ScoreBar name="Engagement" score={health?.engagement_score ?? null} />
      <ScoreBar name="Growth" score={health?.growth_score ?? null} />
      <ScoreBar name="Retention" score={health?.retention_score ?? null} />
      <ScoreBar name="Operational" score={health?.operational_score ?? null} />
    </div>
  );
}

/** "Low" / "Medium" / "High" churn, with the tone the number deserves. */
export function churnBand(probability: number | null | undefined): {
  label: string;
  color: string;
} {
  if (probability == null) return { label: "—", color: "var(--muted-2)" };
  if (probability < 0.33) return { label: "Low", color: "hsl(var(--pos))" };
  if (probability < 0.66) return { label: "Medium", color: "hsl(var(--warn))" };
  return { label: "High", color: "hsl(var(--neg))" };
}

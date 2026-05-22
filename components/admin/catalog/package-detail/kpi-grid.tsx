import {
  Activity,
  CircleDollarSign,
  Repeat,
  TrendingUp,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";

import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { StubBadge } from "@/components/admin/catalog/package-detail/stub-badge";
import { PackageAnalytics } from "@/types/admin/billing";

interface KpiGridProps {
  analytics: PackageAnalytics;
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toLocaleString();
}

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString();
}

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  return (value * 100).toFixed(digits);
}

/**
 * Build a delta line ("+12.4% vs prev") + tone for a KPI card.
 * `lowerIsBetter` flips the tone — churn going down is a win, not a
 * loss. When the comparison value is null/zero we suppress the line
 * altogether so the card doesn't claim a meaningless "∞%" jump.
 */
function buildDelta(
  current: number | null | undefined,
  previous: number | null | undefined,
  options: { lowerIsBetter?: boolean; isPercent?: boolean } = {},
): { line: string; tone: "pos" | "neg" | "neutral" } | null {
  if (current == null || previous == null) return null;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return {
      line: "new metric",
      tone: "neutral",
    };
  }
  const diff = current - previous;
  const pct = (diff / Math.abs(previous)) * 100;
  const direction = diff === 0 ? "neutral" : diff > 0 ? "up" : "down";
  let tone: "pos" | "neg" | "neutral";
  if (direction === "neutral") tone = "neutral";
  else if (options.lowerIsBetter) tone = direction === "up" ? "neg" : "pos";
  else tone = direction === "up" ? "pos" : "neg";

  if (options.isPercent) {
    const ppDiff = (current - previous) * 100;
    return {
      line: `${ppDiff >= 0 ? "+" : ""}${ppDiff.toFixed(2)}pp vs prev`,
      tone,
    };
  }
  return {
    line: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs prev`,
    tone,
  };
}

export function KpiGrid({ analytics }: KpiGridProps) {
  const cmp = analytics.comparison;

  const activeDelta = buildDelta(
    analytics.activeSubscribers,
    cmp?.activeSubscribers,
  );
  const newDelta = buildDelta(
    analytics.newSubscribers,
    cmp?.newSubscribers,
  );
  const churnedDelta = buildDelta(
    analytics.churnedSubscribers,
    cmp?.churnedSubscribers,
    { lowerIsBetter: true },
  );
  const mrrDelta = buildDelta(
    analytics.mrrContribution,
    cmp?.mrrContribution,
  );
  const revenueDelta = buildDelta(
    analytics.periodRevenue,
    cmp?.periodRevenue,
  );
  const arpuDelta = buildDelta(analytics.arpu, cmp?.arpu);
  const churnRateDelta = buildDelta(
    analytics.churnRate,
    cmp?.churnRate,
    { lowerIsBetter: true, isPercent: true },
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
          Key metrics
        </h2>
        {!analytics.isLive && <StubBadge />}
      </div>
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Users className="h-3.5 w-3.5" />}
          label="Active subscribers"
          value={formatCount(analytics.activeSubscribers)}
          delta={activeDelta?.line}
          deltaTone={activeDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<UserPlus className="h-3.5 w-3.5" />}
          label="New (in period)"
          value={formatCount(analytics.newSubscribers)}
          delta={newDelta?.line}
          deltaTone={newDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<UserMinus className="h-3.5 w-3.5" />}
          label="Churned (in period)"
          value={formatCount(analytics.churnedSubscribers)}
          delta={churnedDelta?.line}
          deltaTone={churnedDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Churn rate"
          value={formatPercent(analytics.churnRate)}
          unit="%"
          delta={churnRateDelta?.line}
          deltaTone={churnRateDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          label="MRR contribution"
          value={formatMoney(analytics.mrrContribution)}
          unit={<span className="text-[10px] uppercase">/ mo</span>}
          delta={mrrDelta?.line}
          deltaTone={mrrDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<CircleDollarSign className="h-3.5 w-3.5" />}
          label="Period revenue"
          value={formatMoney(analytics.periodRevenue)}
          delta={revenueDelta?.line}
          deltaTone={revenueDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<Activity className="h-3.5 w-3.5" />}
          label="ARPU"
          value={formatMoney(analytics.arpu)}
          unit={<span className="text-[10px] uppercase">/ mo</span>}
          delta={arpuDelta?.line}
          deltaTone={arpuDelta?.tone ?? "neutral"}
        />
        <KpiCard
          icon={<Repeat className="h-3.5 w-3.5" />}
          label="Trial → paid"
          value={formatPercent(analytics.conversionRate, 1)}
          unit="%"
        />
      </KpiStrip>
    </div>
  );
}

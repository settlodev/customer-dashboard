import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import {
  BusinessHealthSnapshot,
  BusinessLifecycleSnapshot,
} from "@/types/admin/business-intel";

interface BusinessCreditPanelProps {
  health: BusinessHealthSnapshot | null;
  lifecycle: BusinessLifecycleSnapshot | null;
  errors: {
    health: string | null;
    lifecycle: string | null;
  };
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Math.round(value).toLocaleString();
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(0)}%`;
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const LIFECYCLE_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  BUSINESS_CREATED: {
    label: "Created",
    className: "border-muted bg-muted text-muted-foreground",
  },
  FIRST_ORDER: {
    label: "First order",
    className:
      "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
  },
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
  },
  PAYING: {
    label: "Paying",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20",
  },
  CHURNED: {
    label: "Churned",
    className:
      "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
  },
};

function healthToneFor(score: number | null | undefined) {
  if (score === null || score === undefined) return "neutral" as const;
  if (score >= 70) return "pos" as const;
  if (score >= 40) return "neutral" as const;
  return "neg" as const;
}

function churnToneFor(probability: number | null | undefined) {
  if (probability === null || probability === undefined) return "neutral" as const;
  if (probability >= 0.7) return "neg" as const;
  if (probability >= 0.4) return "neutral" as const;
  return "pos" as const;
}

function idleToneFor(days: number | null | undefined) {
  if (days === null || days === undefined) return "neutral" as const;
  if (days <= 7) return "pos" as const;
  if (days <= 30) return "neutral" as const;
  return "neg" as const;
}

/**
 * Derive a coarse credit-readiness verdict from the available signals.
 * Not a model — just an at-a-glance summary that picks the strongest
 * positive or negative signal so staff can triage quickly.
 */
function deriveVerdict(
  health: BusinessHealthSnapshot | null,
  lifecycle: BusinessLifecycleSnapshot | null,
): {
  label: string;
  tone: "good" | "watch" | "high-risk" | "unknown";
  message: string;
} {
  const score = health?.health_score ?? null;
  const churn = health?.churn_probability ?? null;
  const idleDays = lifecycle?.days_since_last_order ?? null;
  const isChurned = lifecycle?.is_churned === 1;
  const stage = lifecycle?.lifecycle_stage ?? null;

  if (isChurned || (idleDays !== null && idleDays >= 60)) {
    return {
      label: "High risk",
      tone: "high-risk",
      message:
        idleDays !== null
          ? `No orders in ${idleDays} days. Treat any credit request with caution.`
          : "Marked as churned in the lifecycle rollup.",
    };
  }

  if (
    (score !== null && score < 40) ||
    (churn !== null && churn >= 0.7) ||
    (idleDays !== null && idleDays >= 30)
  ) {
    return {
      label: "Watch",
      tone: "watch",
      message:
        "Multiple low-confidence signals. Verify recent activity before extending credit.",
    };
  }

  if (
    (score !== null && score >= 70) ||
    stage === "PAYING" ||
    (idleDays !== null && idleDays <= 7 && stage === "ACTIVE")
  ) {
    return {
      label: "Healthy",
      tone: "good",
      message:
        "Strong recent activity, low churn risk, and good engagement. Reasonable credit candidate.",
    };
  }

  return {
    label: "Unclear",
    tone: "unknown",
    message:
      "Not enough data to characterise this business yet. Default to manual review.",
  };
}

export function BusinessCreditPanel({
  health,
  lifecycle,
  errors,
}: BusinessCreditPanelProps) {
  const verdict = deriveVerdict(health, lifecycle);
  const idleDays = lifecycle?.days_since_last_order ?? null;
  const lifecycleStage = lifecycle?.lifecycle_stage ?? null;

  const verdictBadge =
    verdict.tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
      : verdict.tone === "watch"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
        : verdict.tone === "high-risk"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
          : "border-muted bg-muted text-muted-foreground";

  const verdictIcon =
    verdict.tone === "good" ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    ) : verdict.tone === "watch" ? (
      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
    ) : verdict.tone === "high-risk" ? (
      <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
    ) : (
      <Activity className="h-5 w-5 text-muted-foreground" />
    );

  return (
    <div className="space-y-4">
      {/* Verdict header */}
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{verdictIcon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Credit-readiness signal
              </h3>
              <Badge variant="outline" className={verdictBadge}>
                {verdict.label}
              </Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {verdict.message}
            </p>
            {(errors.health || errors.lifecycle) && (
              <p className="mt-2 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                Some signals couldn’t be loaded —{" "}
                {[errors.health, errors.lifecycle].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Signals strip */}
      <KpiStrip cols={4}>
        <KpiCard
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Health score"
          value={
            health?.health_score !== null && health?.health_score !== undefined
              ? `${Math.round(health.health_score)}`
              : "—"
          }
          unit="/100"
          deltaTone={healthToneFor(health?.health_score)}
          delta={
            health?.growth_trajectory
              ? `${health.growth_trajectory.toLowerCase()}`
              : undefined
          }
        />
        <KpiCard
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          label="Churn risk"
          value={formatPercent(health?.churn_probability)}
          deltaTone={churnToneFor(health?.churn_probability)}
          delta={
            health?.churn_probability !== null && health?.churn_probability !== undefined
              ? health.churn_probability >= 0.7
                ? "high"
                : health.churn_probability >= 0.4
                  ? "medium"
                  : "low"
              : undefined
          }
        />
        <KpiCard
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Days since order"
          value={idleDays !== null ? `${idleDays}` : "—"}
          unit="d"
          deltaTone={idleToneFor(idleDays)}
          delta={formatRelative(lifecycle?.last_order_at)}
        />
        <KpiCard
          icon={
            (lifecycle?.is_churned ?? 0) === 1 ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <TrendingUp className="h-3.5 w-3.5" />
            )
          }
          label="Lifecycle"
          value={
            lifecycleStage ? (
              <Badge
                variant="outline"
                className={
                  (LIFECYCLE_BADGE[lifecycleStage] ?? LIFECYCLE_BADGE.BUSINESS_CREATED)
                    .className
                }
              >
                {(LIFECYCLE_BADGE[lifecycleStage] ?? { label: lifecycleStage })
                  .label}
              </Badge>
            ) : (
              "—"
            )
          }
          delta={lifecycle?.current_package_name ?? undefined}
          deltaTone="neutral"
        />
      </KpiStrip>

      {/* Sub-score breakdown + lifetime */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-line bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-ink">
            Health sub-scores
          </h4>
          {errors.health ? (
            <p className="text-sm text-destructive">{errors.health}</p>
          ) : !health ? (
            <p className="text-sm text-muted-foreground">
              No health snapshot yet.
            </p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              <ScoreRow label="Revenue" value={health.revenue_score} />
              <ScoreRow label="Engagement" value={health.engagement_score} />
              <ScoreRow label="Growth" value={health.growth_score} />
              <ScoreRow label="Retention" value={health.retention_score} />
              <ScoreRow label="Operational" value={health.operational_score} />
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-line bg-card p-5">
          <h4 className="mb-3 text-sm font-semibold text-ink">
            Lifetime + first-touch
          </h4>
          {errors.lifecycle ? (
            <p className="text-sm text-destructive">{errors.lifecycle}</p>
          ) : !lifecycle ? (
            <p className="text-sm text-muted-foreground">
              No lifecycle snapshot for this business yet (rollup rebuilds
              nightly).
            </p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              <FactRow
                label="Lifetime orders"
                value={formatNumber(lifecycle.total_orders)}
              />
              <FactRow
                label="Lifetime revenue"
                value={formatMoney(lifecycle.total_revenue)}
              />
              <FactRow
                label="First product"
                value={formatRelative(lifecycle.first_product_at)}
              />
              <FactRow
                label="First order"
                value={formatRelative(lifecycle.first_order_at)}
              />
              <FactRow
                label="First paid order"
                value={formatRelative(lifecycle.first_paid_order_at)}
              />
              <FactRow
                label="Last active"
                value={formatRelative(lifecycle.last_active_at)}
              />
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const tone =
    value === null || value === undefined
      ? "bg-muted"
      : value >= 70
        ? "bg-emerald-500"
        : value >= 40
          ? "bg-amber-400"
          : "bg-rose-500";
  const pct =
    value === null || value === undefined
      ? 0
      : Math.max(0, Math.min(100, value));
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-ink">
          {value === null || value === undefined ? "—" : Math.round(value)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

function FactRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums text-ink">{value ?? "—"}</span>
    </li>
  );
}

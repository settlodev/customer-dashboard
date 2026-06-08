import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Repeat,
  Tablet,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { KpiStrip } from "@/components/layouts/kpi-strip";
import { SectionCard } from "@/components/admin/shared/section-card";
import { MetricCard } from "@/components/admin/shared/metric-card";
import { BarList, BarRow } from "@/components/admin/shared/bar-list";
import { Monogram } from "@/components/admin/shared/monogram";
import { RevenueChartCard } from "@/components/admin/dashboard/revenue-chart-card";
import { OnboardingFunnelCard } from "@/components/admin/dashboard/onboarding-funnel-card";
import { TopBusinessesCard } from "@/components/admin/dashboard/top-businesses-card";
import { ActivityFeedCard } from "@/components/admin/dashboard/activity-feed-card";
import {
  BillingSummary,
  DashboardOverview,
  PlatformHealthItem,
  StatStripItem,
  SupportSummaryItem,
  TrialPipelineItem,
} from "@/types/admin/dashboard";

const HEADLINE_ICON: Record<string, LucideIcon> = {
  mrr: CircleDollarSign,
  arr: CalendarClock,
  gmv: TrendingUp,
  nrr: Repeat,
};

export function AdminDashboardView({ data }: { data: DashboardOverview }) {
  const stub = !data.isLive;
  return (
    <div className="space-y-4">
      {/* Headline KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.headline.map((m) => {
          const Icon = HEADLINE_ICON[m.key];
          return (
            <MetricCard
              key={m.key}
              icon={Icon ? <Icon className="h-[15px] w-[15px]" /> : undefined}
              label={m.label}
              currency={m.currency}
              value={m.value}
              suffix={m.suffix}
              delta={m.delta}
              spark={m.spark}
              footNote={m.footNote}
            />
          );
        })}
      </section>

      {/* Account → business → location stat strip */}
      <KpiStrip cols={6}>
        {data.stats.map((s) => (
          <StatCell key={s.label} item={s} />
        ))}
      </KpiStrip>

      {/* Onboarding funnel */}
      <OnboardingFunnelCard funnel={data.funnel} stub={stub} />

      {/* Revenue + plan mix */}
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <RevenueChartCard series={data.revenue} stub={stub} />
        <PlanMixCard
          caption={data.planMix.caption}
          items={data.planMix.items}
          trials={data.trials}
          stub={stub}
        />
      </section>

      {/* Region · billing · platform */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          title="Locations by region"
          subtitle={data.regions.caption}
          stub={stub}
        >
          <BarList>
            {data.regions.items.map((r) => (
              <BarRow key={r.name} label={r.name} value={r.count} pct={r.pct} />
            ))}
          </BarList>
        </SectionCard>

        <BillingCard billing={data.billing} stub={stub} />

        <PlatformHealthCard
          health={data.platformHealth}
          support={data.support}
          stub={stub}
        />
      </section>

      {/* Top businesses + activity */}
      <section className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <TopBusinessesCard rows={data.topBusinesses} stub={stub} />
        <ActivityFeedCard items={data.activity} stub={stub} />
      </section>
    </div>
  );
}

// ── Stat strip cell ──────────────────────────────────────────────────
function StatCell({ item }: { item: StatStripItem }) {
  return (
    <div className="bg-card px-4 py-4 md:px-5">
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {item.label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[21px] font-bold leading-none tracking-[-0.02em] text-ink tabular-nums">
          {item.value}
        </span>
        {item.sub && (
          <span
            className={cn(
              "font-mono text-[11px] font-medium",
              item.subTone === "pos" ? "text-pos" : "text-muted-foreground",
            )}
          >
            {item.sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Plan mix + trial pipeline ────────────────────────────────────────
const TRIAL_TONE: Record<TrialPipelineItem["tone"], string> = {
  pos: "bg-pos-tint text-pos",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
};

function PlanMixCard({
  caption,
  items,
  trials,
  stub,
}: {
  caption: string;
  items: DashboardOverview["planMix"]["items"];
  trials: TrialPipelineItem[];
  stub?: boolean;
}) {
  return (
    <SectionCard
      title="Plan mix"
      subtitle={caption}
      linkLabel="Packages"
      linkHref="/packages"
      stub={stub}
    >
      <BarList>
        {items.map((p) => (
          <BarRow
            key={p.tier}
            dot
            color={p.color}
            label={
              <>
                {p.label}
                <span className="ml-1 font-mono text-[11px] text-muted-2">
                  · {p.locations} loc
                </span>
              </>
            }
            value={p.mrrLabel}
            pct={p.pct}
          />
        ))}
      </BarList>

      <div className="mb-1 mt-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Trial pipeline · {trials.length} open
      </div>
      {trials.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
        >
          <div className="flex items-center gap-2.5">
            <Monogram name={t.name} color={t.avatarColor} size="sm" />
            <div>
              <div className="text-[13px] font-medium text-ink">{t.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {t.meta}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-[3px] font-mono text-[11.5px] font-semibold",
              TRIAL_TONE[t.tone],
            )}
          >
            {t.daysLabel}
          </span>
        </div>
      ))}
    </SectionCard>
  );
}

// ── Billing & collections ────────────────────────────────────────────
const BILLING_VALUE_TONE = {
  warn: "text-warn",
  neg: "text-neg",
  pos: "text-ink",
  muted: "text-muted-2",
} as const;

function BillingCard({
  billing,
  stub,
}: {
  billing: BillingSummary;
  stub?: boolean;
}) {
  return (
    <SectionCard
      title="Billing & collections"
      subtitle="This month · TZS"
      linkLabel="Refunds"
      linkHref="/refunds"
      stub={stub}
    >
      <div className="mb-0.5 flex items-baseline gap-2">
        <span className="text-[13px] font-semibold text-ink-3">TZS</span>
        <span className="text-[26px] font-bold tracking-[-0.02em] text-ink tabular-nums">
          {billing.collectedLabel}
        </span>
      </div>
      <p className="mb-3.5 font-mono text-[11px] text-muted-foreground">
        {billing.collectedCaption}
      </p>
      {billing.lines.map((line) => (
        <div
          key={line.label}
          className="flex items-center justify-between border-t border-line py-2.5"
        >
          <div className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ backgroundColor: line.dotColor }}
            />
            {line.label}
          </div>
          <div
            className={cn(
              "font-mono text-[12.5px] font-semibold tabular-nums",
              BILLING_VALUE_TONE[line.tone],
            )}
          >
            {line.value}
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

// ── Platform health + support ────────────────────────────────────────
const HEALTH_ICON: Record<
  PlatformHealthItem["kind"],
  { icon: LucideIcon; className: string }
> = {
  uptime: { icon: CheckCircle2, className: "bg-pos-tint text-pos" },
  latency: { icon: Clock, className: "bg-pos-tint text-pos" },
  transactions: { icon: TrendingUp, className: "bg-primary/12 text-[#C25E26]" },
  terminals: { icon: Tablet, className: "bg-[#2563EB]/10 text-[#2563EB]" },
};

function PlatformHealthCard({
  health,
  support,
  stub,
}: {
  health: PlatformHealthItem[];
  support: SupportSummaryItem[];
  stub?: boolean;
}) {
  return (
    <SectionCard title="Platform health" subtitle="Live · last 24h" stub={stub}>
      {health.map((h) => {
        const { icon: Icon, className } = HEALTH_ICON[h.kind];
        return (
          <div
            key={h.kind}
            className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
          >
            <div className="flex items-center gap-2.5 text-[13px] text-ink-2">
              <span
                className={cn(
                  "grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg",
                  className,
                )}
              >
                <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
              </span>
              {h.label}
            </div>
            <div
              className={cn(
                "flex items-center font-mono text-[12.5px] font-semibold tabular-nums",
                h.valueTone === "pos" ? "text-pos" : "text-ink",
              )}
            >
              {h.healthDot && (
                <span
                  className="mr-1.5 h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: h.healthDot }}
                />
              )}
              {h.value}
            </div>
          </div>
        );
      })}

      {support.length > 0 && (
        <>
          <div className="mb-1 mt-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Support &amp; success
          </div>
          {support.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
            >
              <span className="text-[13px] text-ink-2">{s.label}</span>
              <span
                className={cn(
                  "font-mono text-[12.5px] font-semibold tabular-nums",
                  s.valueTone === "pos" ? "text-pos" : "text-ink",
                )}
              >
                {s.value}
              </span>
            </div>
          ))}
        </>
      )}
    </SectionCard>
  );
}

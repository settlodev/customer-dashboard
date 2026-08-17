"use client";

import { useState } from "react";
import {
  Activity as ActivityIcon,
  Award,
  Briefcase,
  CalendarDays,
  Clock,
  Coins,
  Flame,
  IdCard,
  Layers,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Shield,
  ShoppingCart,
  Sparkles,
  StickyNote,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  EmptyState,
  FactGrid,
  HeroCard,
  HeroChip,
  HeroLabel,
  HeroMeter,
  HeroValue,
  PanelCard,
  RailCard,
  SegTabs,
  StatusTag,
  fact,
  type Fact,
  type SegTab,
} from "@/components/layouts/order-detail";
import { Badge } from "@/components/ui/badge";
import type { Staff, StaffDetail, StaffXpTransaction } from "@/types/staff";
import { StaffAccessPanel } from "./staff-access-panel";

export interface StaffSalesMetrics {
  rangeLabel: string;
  orders: number;
  openOrders: number;
  closedOrders: number;
  unpaidOrders: number;
  grossSales: number;
  netSales: number | null;
  grossProfit: number | null;
  itemsSold: number | null;
  ordersCompleted: number | null;
  rank: number | null;
  peers: number;
  sharePct: number | null;
}

interface Props {
  staff: Staff;
  detail: StaffDetail | null;
  initialTab?: string;
  salesContent: React.ReactNode;
  auditContent: React.ReactNode;
  metrics: StaffSalesMetrics;
  currency: string;
  tenureLabel?: string | null;
}

type TabKey =
  | "overview"
  | "sales"
  | "access"
  | "performance"
  | "schedule"
  | "audit";

const formatNumber = (value: number | null | undefined, fractionDigits = 0) => {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
};

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatDate = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return DATE_FMT.format(d);
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${DATE_FMT.format(d)}, ${TIME_FMT.format(d)}`;
};

const titleCase = (s?: string | null) =>
  s
    ? s
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function StaffDetailView({
  staff,
  detail,
  initialTab,
  salesContent,
  auditContent,
  metrics,
  currency,
  tenureLabel,
}: Props) {
  const gamification = detail?.gamification;
  const attendance = detail?.attendance;

  const scheduleCount =
    (attendance?.recentSchedules?.length ?? 0) +
    (attendance?.recentTimesheetEntries?.length ?? 0);
  const showPerformance = !!gamification?.enabled;
  const showSchedule = scheduleCount > 0;

  const tabs: SegTab<TabKey>[] = [
    { id: "overview", label: "Overview", icon: User },
    {
      id: "sales",
      label: "Sales",
      icon: ShoppingCart,
      count: metrics.orders || undefined,
    },
    { id: "access", label: "Access", icon: Shield },
    ...(showPerformance
      ? [{ id: "performance" as const, label: "Performance", icon: Trophy }]
      : []),
    ...(showSchedule
      ? [
          {
            id: "schedule" as const,
            label: "Schedule",
            icon: CalendarDays,
            count: scheduleCount,
          },
        ]
      : []),
    { id: "audit", label: "Activity", icon: ActivityIcon },
  ];

  const [tab, setTab] = useState<TabKey>(() => {
    const requested = initialTab === "history" ? "performance" : initialTab;
    return tabs.some((t) => t.id === requested)
      ? (requested as TabKey)
      : "overview";
  });

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3.5 lg:sticky lg:top-4">
        <SalesHero metrics={metrics} currency={currency} />
        <RailCard
          icon={<Sparkles className="h-3.5 w-3.5" />}
          title="Profitability"
        >
          <ProfitSplit metrics={metrics} />
        </RailCard>
        <RailCard
          icon={<Coins className="h-3.5 w-3.5" />}
          title="Sales breakdown"
        >
          <SalesLedger metrics={metrics} />
        </RailCard>
      </aside>

      <main className="flex min-w-0 flex-col gap-3.5">
        <SegTabs tabs={tabs} active={tab} onSelect={setTab} />
        <div>
          {tab === "overview" && (
            <OverviewPanel staff={staff} tenureLabel={tenureLabel} />
          )}
          {tab === "sales" && salesContent}
          {tab === "access" && <StaffAccessPanel staff={staff} />}
          {tab === "performance" && (
            <PerformancePanel gamification={gamification} />
          )}
          {tab === "schedule" && <SchedulePanel attendance={attendance} />}
          {tab === "audit" && auditContent}
        </div>
      </main>
    </div>
  );
}

function SalesHero({
  metrics,
  currency,
}: {
  metrics: StaffSalesMetrics;
  currency: string;
}) {
  const hasRollup = metrics.netSales != null;
  const headline = hasRollup
    ? (metrics.netSales as number)
    : metrics.grossSales;
  const orders = metrics.ordersCompleted ?? metrics.closedOrders;
  const hasActivity = headline > 0 || metrics.orders > 0;

  return (
    <HeroCard>
      <div className="flex items-center justify-between gap-3">
        <HeroLabel>{hasRollup ? "Net sales" : "Gross sales"}</HeroLabel>
        {metrics.rank != null ? (
          <HeroChip tone="brand" icon={<Trophy className="h-3 w-3" />}>
            #{metrics.rank} of {metrics.peers} by sales
          </HeroChip>
        ) : (
          hasActivity && <HeroChip>{metrics.orders} orders</HeroChip>
        )}
      </div>
      <HeroValue value={formatNumber(headline)} unit={currency} />

      <div className="mt-1.5 font-mono text-[10.5px] text-white/50">
        {metrics.rangeLabel}
      </div>

      {hasActivity ? (
        metrics.sharePct != null ? (
          <HeroMeter
            pct={metrics.sharePct}
            color="#12B981"
            left={`${formatNumber(metrics.sharePct, 1)}% of location`}
            right={`${formatNumber(orders)} order${orders === 1 ? "" : "s"}`}
          />
        ) : (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[10.5px] text-white/70">
            <span className="font-semibold text-white">
              {formatNumber(metrics.orders)} orders
            </span>
            <span className="font-semibold text-white">
              {formatNumber(metrics.closedOrders)} closed
            </span>
            {metrics.openOrders > 0 && (
              <span className="font-semibold text-white">
                {formatNumber(metrics.openOrders)} open
              </span>
            )}
          </div>
        )
      ) : (
        <div className="mt-4 text-[12.5px] font-medium text-white/60">
          No sales recorded in this range.
        </div>
      )}
    </HeroCard>
  );
}

function ProfitSplit({ metrics }: { metrics: StaffSalesMetrics }) {
  const net = metrics.netSales ?? 0;
  const profit = metrics.grossProfit ?? 0;

  if (metrics.netSales == null) {
    return (
      <p className="py-1 font-mono text-[11.5px] text-muted-foreground">
        Profitability needs the analytics service — unavailable for this
        location or hidden by your permissions.
      </p>
    );
  }

  if (net <= 0) {
    return (
      <p className="py-1 font-mono text-[11.5px] text-muted-foreground">
        No sales in this range, so there is nothing to split.
      </p>
    );
  }

  const cost = Math.max(0, net - profit);
  const base = cost + Math.max(0, profit);
  const costPct = clamp(base > 0 ? (cost / base) * 100 : 0);
  const profitPct = clamp(100 - costPct);
  const margin = net > 0 ? (profit / net) * 100 : null;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Cost vs profit
        </span>
        {margin != null && (
          <span
            className={cn(
              "text-[13px] font-bold tabular-nums",
              margin >= 0 ? "text-pos" : "text-neg",
            )}
          >
            {formatNumber(margin, 1)}% margin
          </span>
        )}
      </div>
      <div className="flex h-[26px] overflow-hidden rounded-md bg-canvas">
        <span
          className="flex items-center overflow-hidden whitespace-nowrap px-2.5 font-mono text-[10.5px] font-semibold text-white"
          style={{ width: `${costPct}%`, background: "#8A8A85" }}
        >
          Cost
        </span>
        <span
          className="flex items-center overflow-hidden whitespace-nowrap px-2.5 font-mono text-[10.5px] font-semibold text-white"
          style={{ width: `${profitPct}%`, background: "#0E8B5F" }}
        >
          Profit
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        <LegendItem color="#8A8A85" label="Cost" value={formatNumber(cost)} />
        <LegendItem
          color="#0E8B5F"
          label="Gross profit"
          value={formatNumber(profit)}
        />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
        style={{ background: color }}
      />
      {label} <b className="font-semibold tabular-nums text-ink">{value}</b>
    </div>
  );
}

function LRow({
  label,
  value,
  tone,
  strong,
  dim,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "pos" | "neg";
  strong?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 py-2.5 text-[13px]",
        strong
          ? "mt-0.5 border-t border-line-2 pt-3"
          : "border-b border-dashed border-line last:border-b-0",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2",
          dim
            ? "text-muted-2"
            : strong
              ? "font-semibold text-ink"
              : "text-ink-3",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums font-semibold",
          strong && "text-[16px] font-bold",
          tone === "pos"
            ? "text-pos"
            : tone === "neg"
              ? "text-neg"
              : dim
                ? "font-medium text-muted-2"
                : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SalesLedger({ metrics }: { metrics: StaffSalesMetrics }) {
  const orders = metrics.ordersCompleted ?? metrics.closedOrders;
  const basis = metrics.netSales ?? metrics.grossSales;
  const avg = orders > 0 ? basis / orders : 0;

  return (
    <div className="flex flex-col">
      <LRow
        label="Gross sales"
        value={metrics.grossSales > 0 ? formatNumber(metrics.grossSales) : "—"}
        dim={metrics.grossSales === 0}
      />
      {metrics.netSales != null && (
        <LRow label="Net sales" value={formatNumber(metrics.netSales)} strong />
      )}
      {metrics.grossProfit != null && (
        <LRow
          label="Gross profit"
          value={formatNumber(metrics.grossProfit)}
          tone={metrics.grossProfit > 0 ? "pos" : undefined}
          dim={metrics.grossProfit === 0}
        />
      )}
      {metrics.itemsSold != null && (
        <LRow
          label="Items sold"
          value={metrics.itemsSold > 0 ? formatNumber(metrics.itemsSold) : "—"}
          dim={metrics.itemsSold === 0}
        />
      )}
      <LRow
        label="Orders closed"
        value={orders > 0 ? formatNumber(orders) : "—"}
        dim={orders === 0}
      />
      <LRow
        label="Still open"
        value={metrics.openOrders > 0 ? formatNumber(metrics.openOrders) : "—"}
        dim={metrics.openOrders === 0}
      />
      <LRow
        label="Unpaid orders"
        value={
          metrics.unpaidOrders > 0 ? formatNumber(metrics.unpaidOrders) : "—"
        }
        tone={metrics.unpaidOrders > 0 ? "neg" : undefined}
        dim={metrics.unpaidOrders === 0}
      />
      <LRow
        label="Average order"
        value={avg > 0 ? formatNumber(avg) : "—"}
        dim={avg === 0}
        strong={avg > 0}
      />
    </div>
  );
}

// ─── overview ────────────────────────────────────────────────────────

function OverviewPanel({
  staff,
  tenureLabel,
}: {
  staff: Staff;
  tenureLabel?: string | null;
}) {
  const departmentNames =
    staff.departments && staff.departments.length > 0
      ? staff.departments.map((d) => d.name).join(", ")
      : staff.departmentName;

  const personal: Fact[] = [
    fact("Phone", staff.phoneNumber, <Phone className="h-3 w-3" />, {
      mono: true,
    }),
    fact("Email", staff.email, <Mail className="h-3 w-3" />, { mono: true }),
    fact("Gender", titleCase(staff.gender), <User className="h-3 w-3" />),
    fact(
      "Date of birth",
      formatDate(staff.dateOfBirth),
      <CalendarDays className="h-3 w-3" />,
    ),
    fact("Nationality", staff.nationalityName, <MapPin className="h-3 w-3" />),
    fact("Address", staff.address, <MapPin className="h-3 w-3" />),
  ];

  const employment: Fact[] = [
    fact("Job title", staff.jobTitle, <Briefcase className="h-3 w-3" />),
    fact("Employee #", staff.employeeNumber, <IdCard className="h-3 w-3" />, {
      mono: true,
    }),
    fact("Department", departmentNames, <Layers className="h-3 w-3" />),
    staff.roles?.length
      ? {
          label: "Roles",
          icon: <Award className="h-3 w-3" />,
          badge: (
            <span className="inline-flex flex-wrap items-center justify-end gap-1">
              {staff.roles.slice(0, 4).map((r) => (
                <Badge key={r.id} variant="soft" className="text-[10.5px]">
                  {r.name}
                </Badge>
              ))}
              {staff.roles.length > 4 && (
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  +{staff.roles.length - 4}
                </span>
              )}
            </span>
          ),
        }
      : fact("Roles", null, <Award className="h-3 w-3" />),
    fact(
      "Joined",
      staff.joiningDate
        ? `${formatDate(staff.joiningDate)}${tenureLabel ? ` · ${tenureLabel}` : ""}`
        : null,
      <CalendarDays className="h-3 w-3" />,
    ),
    fact("Identifier", staff.identifier, <IdCard className="h-3 w-3" />, {
      mono: true,
    }),
    fact(
      "Added on",
      formatDate(staff.createdAt),
      <Clock className="h-3 w-3" />,
    ),
    fact(
      "Last updated",
      formatDateTime(staff.updatedAt),
      <Clock className="h-3 w-3" />,
      { mono: true },
    ),
  ];

  const hasEmergency =
    !!staff.emergencyName ||
    !!staff.emergencyNumber ||
    !!staff.emergencyRelationship;

  return (
    <div className="space-y-3.5">
      <PanelCard
        icon={<Briefcase className="h-3.5 w-3.5" />}
        title="Employment"
      >
        <FactGrid rows={employment} cols={2} />
      </PanelCard>

      <PanelCard
        icon={<User className="h-3.5 w-3.5" />}
        title="Personal details"
      >
        <FactGrid rows={personal} cols={2} />
      </PanelCard>

      {hasEmergency && (
        <PanelCard
          icon={<Users className="h-3.5 w-3.5" />}
          title="Emergency contact"
        >
          <FactGrid
            rows={[
              fact("Name", staff.emergencyName, <User className="h-3 w-3" />),
              fact(
                "Phone",
                staff.emergencyNumber,
                <Phone className="h-3 w-3" />,
                { mono: true },
              ),
              fact(
                "Relationship",
                staff.emergencyRelationship,
                <Users className="h-3 w-3" />,
              ),
            ]}
            cols={2}
          />
        </PanelCard>
      )}

      {staff.notes && (
        <PanelCard icon={<StickyNote className="h-3.5 w-3.5" />} title="Notes">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
            {staff.notes}
          </p>
        </PanelCard>
      )}
    </div>
  );
}

// ─── performance (gamification) ──────────────────────────────────────

function PerformancePanel({
  gamification,
}: {
  gamification: StaffDetail["gamification"] | undefined;
}) {
  if (!gamification?.enabled) {
    return (
      <PanelCard icon={<Trophy className="h-3.5 w-3.5" />} title="Performance">
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title="Gamification is off"
          sub="Turn on points and challenges for this location to track XP, levels and streaks."
        />
      </PanelCard>
    );
  }

  const totalXp = gamification.totalXp ?? 0;
  const xpToNext = gamification.xpToNextLevel ?? 0;
  const levelProgress =
    totalXp + xpToNext > 0
      ? Math.round((totalXp / (totalXp + xpToNext)) * 100)
      : 0;

  const challenges = gamification.activeChallenges ?? [];
  const xp = gamification.recentXpTransactions ?? [];

  const stats: Fact[] = [
    fact("Total XP", formatNumber(totalXp), <Sparkles className="h-3 w-3" />),
    fact(
      "Streak",
      gamification.currentStreak > 0
        ? `${gamification.currentStreak} day${gamification.currentStreak === 1 ? "" : "s"}`
        : null,
      <Flame className="h-3 w-3" />,
    ),
    fact(
      "Longest streak",
      gamification.longestStreak > 0
        ? `${gamification.longestStreak} days`
        : null,
      <Flame className="h-3 w-3" />,
    ),
    fact(
      "Leaderboard",
      gamification.leaderboardRank > 0
        ? `#${gamification.leaderboardRank}`
        : null,
      <Target className="h-3 w-3" />,
    ),
    fact(
      "Orders today",
      gamification.ordersToday > 0
        ? formatNumber(gamification.ordersToday)
        : null,
      <Receipt className="h-3 w-3" />,
    ),
  ];

  return (
    <div className="space-y-3.5">
      <PanelCard
        icon={<Trophy className="h-3.5 w-3.5" />}
        title={`Level ${gamification.currentLevel} · ${gamification.levelName}`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            <span>Progress to next level</span>
            <span className="tabular-nums">{levelProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${clamp(levelProgress)}%` }}
            />
          </div>
          <p className="text-[12px] text-muted-foreground">
            {formatNumber(xpToNext)} XP to next level
          </p>
        </div>
        <div className="mt-3.5">
          <FactGrid rows={stats} cols={2} />
        </div>
      </PanelCard>

      <PanelCard
        icon={<Target className="h-3.5 w-3.5" />}
        title="Active challenges"
        count={challenges.length || undefined}
      >
        {challenges.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {challenges.map((c) => {
              const pct = clamp(c.progressPercentage);
              return (
                <div
                  key={c.challengeId}
                  className="space-y-2 rounded-lg border border-line bg-canvas p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-ink">
                      {c.challengeName}
                    </span>
                    {c.completed && <StatusTag tone="pos">Done</StatusTag>}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>{c.distanceMessage}</span>
                    <span className="font-mono tabular-nums">
                      {formatNumber(c.currentValue)} /{" "}
                      {formatNumber(c.targetValue)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="h-5 w-5" />}
            title="No active challenges"
            sub="Challenges assigned to this staff member will show their progress here."
          />
        )}
      </PanelCard>

      <PanelCard
        icon={<Sparkles className="h-3.5 w-3.5" />}
        title="XP activity"
        count={xp.length || undefined}
        pad0={xp.length > 0}
      >
        {xp.length ? (
          <XpTable rows={xp} />
        ) : (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="No XP yet"
            sub="Activity populates as this staff member completes orders and tasks."
          />
        )}
      </PanelCard>
    </div>
  );
}

function XpTable({ rows }: { rows: StaffXpTransaction[] }) {
  return (
    <div className="max-h-[560px] overflow-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            <Th>When</Th>
            <Th>Source</Th>
            <Th>Description</Th>
            <Th right>XP</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((t) => (
            <tr key={t.id}>
              <td className="whitespace-nowrap px-3.5 py-3 font-mono text-[11px] text-muted-foreground">
                {formatDateTime(t.createdAt) ?? "—"}
              </td>
              <td className="px-3.5 py-3">
                <StatusTag tone="muted">{t.xpSource}</StatusTag>
              </td>
              <td className="px-3.5 py-3 text-[12.5px] text-ink-3">
                {t.description || "—"}
              </td>
              <td
                className={cn(
                  "px-3.5 py-3 text-right font-semibold tabular-nums",
                  t.xpAmount >= 0 ? "text-pos" : "text-neg",
                )}
              >
                {t.xpAmount >= 0 ? "+" : ""}
                {formatNumber(t.xpAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── schedule / attendance ───────────────────────────────────────────

function SchedulePanel({
  attendance,
}: {
  attendance: StaffDetail["attendance"] | undefined;
}) {
  const schedules = attendance?.recentSchedules ?? [];
  const timesheets = attendance?.recentTimesheetEntries ?? [];

  return (
    <div className="space-y-3.5">
      <PanelCard
        icon={<CalendarDays className="h-3.5 w-3.5" />}
        title="Recent shifts"
        count={schedules.length || undefined}
        pad0={schedules.length > 0}
      >
        {schedules.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Shift</Th>
                  <Th right>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {schedules.slice(0, 8).map((s, i) => {
                  const row = s as Record<string, unknown>;
                  const date =
                    (row.scheduleDate as string | undefined) ??
                    (row.date as string | undefined) ??
                    null;
                  const shiftName =
                    (row.shiftName as string | undefined) ??
                    (row.shiftTemplateName as string | undefined) ??
                    "—";
                  const status =
                    (row.status as string | undefined) ?? "Scheduled";
                  return (
                    <tr key={(row.id as string | undefined) ?? i}>
                      <td className="px-3.5 py-3 font-mono text-[11.5px] tabular-nums text-ink-3">
                        {formatDate(date) ?? "—"}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-ink">
                        {shiftName}
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        <StatusTag tone="muted">{titleCase(status)}</StatusTag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No shifts scheduled"
            sub="Rostered shifts for this staff member will appear here."
          />
        )}
      </PanelCard>

      <PanelCard
        icon={<Clock className="h-3.5 w-3.5" />}
        title="Recent timesheet"
        count={timesheets.length || undefined}
        pad0={timesheets.length > 0}
      >
        {timesheets.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <Th>Clock in</Th>
                  <Th>Clock out</Th>
                  <Th right>Hours</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {timesheets.slice(0, 8).map((t, i) => {
                  const row = t as Record<string, unknown>;
                  const inAt =
                    (row.clockInTime as string | undefined) ??
                    (row.clockIn as string | undefined) ??
                    null;
                  const outAt =
                    (row.clockOutTime as string | undefined) ??
                    (row.clockOut as string | undefined) ??
                    null;
                  const hours =
                    (row.hoursWorked as number | undefined) ??
                    (row.totalHours as number | undefined);
                  return (
                    <tr key={(row.id as string | undefined) ?? i}>
                      <td className="px-3.5 py-3 font-mono text-[11.5px] tabular-nums text-ink-3">
                        {formatDateTime(inAt) ?? "—"}
                      </td>
                      <td className="px-3.5 py-3 font-mono text-[11.5px] tabular-nums text-ink-3">
                        {formatDateTime(outAt) ?? (
                          <span className="text-warn">Still clocked in</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right font-semibold tabular-nums text-ink">
                        {hours != null ? formatNumber(hours, 2) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Clock className="h-5 w-5" />}
            title="No timesheet entries"
            sub="Clock-in and clock-out records will appear here."
          />
        )}
      </PanelCard>
    </div>
  );
}

// ─── shared table header ─────────────────────────────────────────────

function Th({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-line bg-canvas px-3.5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground",
        right ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

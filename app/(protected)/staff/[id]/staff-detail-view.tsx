"use client";

import { useState } from "react";
import {
  Award,
  Briefcase,
  CalendarDays,
  Clock,
  Flame,
  History as HistoryIcon,
  IdCard,
  Layers,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiStrip, KpiCard } from "@/components/layouts/kpi-strip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Staff, StaffDetail, StaffXpTransaction } from "@/types/staff";

interface Props {
  staff: Staff;
  detail: StaffDetail | null;
}

const TABS = [
  { key: "overview", label: "Overview", icon: User },
  { key: "access", label: "Access & PIN", icon: Shield },
  { key: "performance", label: "Performance", icon: Trophy },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "history", label: "Activity", icon: HistoryIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function StaffDetailView({ staff, detail }: Props) {
  const [tab, setTab] = useState<TabKey>("overview");

  const gamification = detail?.gamification;
  const loyalty = detail?.loyalty;
  const attendance = detail?.attendance;

  const xpToNext = gamification?.xpToNextLevel ?? 0;
  const totalXp = gamification?.totalXp ?? 0;
  const levelProgress =
    totalXp + xpToNext > 0
      ? Math.round((totalXp / (totalXp + xpToNext)) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Summary KPIs ──────────────────────────────────────── */}
      <KpiStrip cols={6}>
        <KpiCard
          icon={<Star className="h-3 w-3" />}
          label="Loyalty"
          value={
            loyalty
              ? loyalty.points.toLocaleString()
              : "—"
          }
          unit={loyalty ? "pts" : undefined}
          delta={
            loyalty && loyalty.minimumRedeemablePoints > 0
              ? loyalty.redeemable
                ? "Redeemable"
                : `Need ${(loyalty.minimumRedeemablePoints - loyalty.points).toLocaleString()} more`
              : undefined
          }
          deltaTone={
            loyalty?.redeemable ? "pos" : loyalty ? "neutral" : "neutral"
          }
        />
        <KpiCard
          icon={<Sparkles className="h-3 w-3" />}
          label="Total XP"
          value={
            gamification?.enabled ? totalXp.toLocaleString() : "—"
          }
        />
        <KpiCard
          icon={<Trophy className="h-3 w-3" />}
          label="Level"
          value={
            gamification?.enabled
              ? `${gamification.currentLevel}`
              : "—"
          }
          delta={gamification?.enabled ? gamification.levelName : undefined}
          deltaTone="neutral"
        />
        <KpiCard
          icon={<Flame className="h-3 w-3" />}
          label="Streak"
          value={
            gamification?.enabled
              ? gamification.currentStreak.toString()
              : "—"
          }
          unit={gamification?.enabled ? "days" : undefined}
          delta={
            gamification?.enabled && gamification.longestStreak > 0
              ? `Best ${gamification.longestStreak}`
              : undefined
          }
          deltaTone={
            gamification?.enabled &&
            gamification.currentStreak >= gamification.longestStreak
              ? "pos"
              : "neutral"
          }
        />
        <KpiCard
          icon={<Target className="h-3 w-3" />}
          label="Rank"
          value={
            gamification?.enabled && gamification.leaderboardRank > 0
              ? `#${gamification.leaderboardRank}`
              : "—"
          }
        />
        <KpiCard
          icon={<ShoppingCart className="h-3 w-3" />}
          label="Orders today"
          value={
            gamification?.enabled
              ? gamification.ordersToday.toLocaleString()
              : "—"
          }
        />
      </KpiStrip>

      {/* ── Tabs (segmented underline — matches product detail) ── */}
      <div className="overflow-x-auto rounded-xl border border-line bg-card">
        <div className="flex min-w-max gap-0 border-b border-line bg-surface px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            let badge: string | null = null;
            if (t.key === "performance" && gamification?.enabled) {
              const challenges = gamification.activeChallenges?.length ?? 0;
              if (challenges > 0) badge = String(challenges);
            }
            if (t.key === "schedule") {
              const ct =
                (attendance?.recentSchedules?.length ?? 0) +
                (attendance?.recentTimesheetEntries?.length ?? 0);
              if (ct > 0) badge = String(ct);
            }
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={isActive}
                className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-[12.5px] font-medium transition-colors ${
                  isActive
                    ? "border-primary text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink-2"
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                {t.label}
                {badge && (
                  <span
                    className={`rounded-[3px] px-1.5 font-mono text-[9.5px] tracking-[0.02em] ${
                      isActive
                        ? "border border-line bg-card text-ink-3"
                        : "bg-canvas text-muted-foreground"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────── */}
      {tab === "overview" && <OverviewTab staff={staff} />}
      {tab === "access" && <AccessTab staff={staff} />}
      {tab === "performance" && (
        <PerformanceTab
          gamification={gamification}
          levelProgress={levelProgress}
        />
      )}
      {tab === "schedule" && <ScheduleTab attendance={attendance} />}
      {tab === "history" && (
        <HistoryTab xp={gamification?.recentXpTransactions ?? []} />
      )}
    </div>
  );
}

// ── Overview ────────────────────────────────────────────────────────

function OverviewTab({ staff }: { staff: Staff }) {
  const departmentNames =
    staff.departments && staff.departments.length > 0
      ? staff.departments.map((d) => d.name).join(", ")
      : staff.departmentName;
  const roleNames =
    staff.roles && staff.roles.length > 0
      ? staff.roles.map((r) => r.name).join(", ")
      : null;

  return (
    <div className="space-y-6">
      {/* Personal + work info */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <User className="h-4 w-4 text-muted-foreground" />
            Profile
          </h3>

          <div className="overflow-hidden rounded-lg border border-line bg-line">
            <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
              <DetailRow icon={Phone} label="Phone" value={staff.phoneNumber} />
              <DetailRow icon={Mail} label="Email" value={staff.email} />
              <DetailRow label="Gender" value={staff.gender} />
              <DetailRow
                icon={CalendarDays}
                label="Date of birth"
                value={
                  staff.dateOfBirth
                    ? new Date(staff.dateOfBirth).toLocaleDateString()
                    : null
                }
              />
              <DetailRow
                label="Nationality"
                value={staff.nationalityName}
              />
              <DetailRow icon={MapPin} label="Address" value={staff.address} />

              <DetailRow
                icon={Briefcase}
                label="Job title"
                value={staff.jobTitle}
              />
              <DetailRow
                icon={IdCard}
                label="Employee #"
                value={staff.employeeNumber}
              />
              <DetailRow
                icon={Layers}
                label="Department"
                value={departmentNames}
              />
              <DetailRow
                icon={Award}
                label="Roles"
                value={
                  roleNames ? (
                    <span className="inline-flex flex-wrap items-center justify-end gap-1">
                      {staff.roles.slice(0, 4).map((r) => (
                        <Badge
                          key={r.id}
                          variant="soft"
                          className="text-[10.5px]"
                        >
                          {r.name}
                        </Badge>
                      ))}
                      {staff.roles.length > 4 && (
                        <span className="font-mono text-[10.5px] text-muted-foreground">
                          +{staff.roles.length - 4}
                        </span>
                      )}
                    </span>
                  ) : null
                }
              />
              <DetailRow
                icon={CalendarDays}
                label="Joining date"
                value={
                  staff.joiningDate
                    ? new Date(staff.joiningDate).toLocaleDateString()
                    : null
                }
              />
              <DetailRow
                icon={IdCard}
                label="Identifier"
                value={
                  staff.identifier ? (
                    <span className="font-mono text-[11px] tracking-[0.02em]">
                      {staff.identifier}
                    </span>
                  ) : null
                }
              />
            </dl>
          </div>

          {(staff.emergencyName ||
            staff.emergencyNumber ||
            staff.emergencyRelationship) && (
            <>
              <h3 className="mt-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-muted-foreground" />
                Emergency contact
              </h3>
              <div className="overflow-hidden rounded-lg border border-line bg-line">
                <dl className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2">
                  <DetailRow label="Name" value={staff.emergencyName} />
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={staff.emergencyNumber}
                  />
                  <DetailRow
                    label="Relationship"
                    value={staff.emergencyRelationship}
                  />
                </dl>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Access & PIN ────────────────────────────────────────────────────

function AccessTab({ staff }: { staff: Staff }) {
  const accessItems: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    body: string;
    enabled: boolean;
    extra?: React.ReactNode;
  }> = [
    {
      icon: Shield,
      title: "Dashboard access",
      body: staff.dashboardAccess
        ? "Can sign in and use the merchant dashboard."
        : "No dashboard sign-in. Grant access from the menu above.",
      enabled: staff.dashboardAccess,
      extra: staff.email ? (
        <DetailKey label="Login email" value={staff.email} />
      ) : null,
    },
    {
      icon: User,
      title: "POS access",
      body: staff.posAccess
        ? "Can log in at paired POS terminals."
        : "Cannot log in at POS terminals.",
      enabled: staff.posAccess,
      extra: staff.posAccess ? (
        <div className="space-y-1.5">
          <DetailKey label="PIN" value={staff.hasPin ? "Set" : "Not set"} />
          {staff.pinUpdatedAt && (
            <DetailKey
              label="Last updated"
              value={new Date(staff.pinUpdatedAt).toLocaleString()}
            />
          )}
        </div>
      ) : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {accessItems.map((it) => {
        const Icon = it.icon;
        return (
          <Card key={it.title}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    it.enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-line bg-canvas text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">{it.title}</h4>
                    <Badge variant={it.enabled ? "pos" : "soft"}>
                      {it.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {it.body}
                  </p>
                </div>
              </div>
              {it.extra}
            </CardContent>
          </Card>
        );
      })}

    </div>
  );
}

// ── Performance ─────────────────────────────────────────────────────

function PerformanceTab({
  gamification,
  levelProgress,
}: {
  gamification: StaffDetail["gamification"] | undefined;
  levelProgress: number;
}) {
  if (!gamification?.enabled) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Gamification is disabled for this location, or this staff member
            has no XP yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              Level {gamification.currentLevel} ·{" "}
              <span className="text-muted-foreground">
                {gamification.levelName}
              </span>
            </h3>
            {gamification.badgeIcon && (
              <span className="text-2xl leading-none">
                {gamification.badgeIcon}
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-mono uppercase tracking-wide">
                Progress to next level
              </span>
              <span className="font-mono">{levelProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {gamification.xpToNextLevel.toLocaleString()} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {gamification.activeChallenges?.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Active challenges
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {gamification.activeChallenges.map((c) => {
                const pct = Math.min(100, Math.max(0, c.progressPercentage));
                return (
                  <div
                    key={c.challengeId}
                    className="space-y-2 rounded-lg border border-line bg-card p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {c.challengeName}
                      </span>
                      {c.completed && (
                        <Badge variant="pos" className="text-[10.5px]">
                          Done
                        </Badge>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>{c.distanceMessage}</span>
                      <span className="font-mono tabular-nums">
                        {c.currentValue.toLocaleString()} /{" "}
                        {c.targetValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Schedule / Attendance ──────────────────────────────────────────

function ScheduleTab({
  attendance,
}: {
  attendance: StaffDetail["attendance"] | undefined;
}) {
  const schedules = attendance?.recentSchedules ?? [];
  const timesheets = attendance?.recentTimesheetEntries ?? [];

  if (schedules.length === 0 && timesheets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No recent shifts or timesheet entries.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {schedules.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Recent schedules
            </h3>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.slice(0, 8).map((s, i) => {
                    const row = s as Record<string, unknown>;
                    const date =
                      (row.scheduleDate as string | undefined) ??
                      (row.date as string | undefined) ??
                      "";
                    const shiftName =
                      (row.shiftName as string | undefined) ??
                      (row.shiftTemplateName as string | undefined) ??
                      "—";
                    const status =
                      (row.status as string | undefined) ?? "Scheduled";
                    return (
                      <TableRow key={(row.id as string | undefined) ?? i}>
                        <TableCell className="font-mono text-[12px] tabular-nums">
                          {date
                            ? new Date(date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>{shiftName}</TableCell>
                        <TableCell>
                          <Badge variant="soft" className="text-[10.5px]">
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {timesheets.length > 0 && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent timesheet
            </h3>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clock in</TableHead>
                    <TableHead>Clock out</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableRow key={(row.id as string | undefined) ?? i}>
                        <TableCell className="font-mono text-[12px] tabular-nums">
                          {inAt ? new Date(inAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] tabular-nums">
                          {outAt ? new Date(outAt).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {hours != null ? hours.toFixed(2) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Activity history (XP transactions) ─────────────────────────────

function HistoryTab({ xp }: { xp: StaffXpTransaction[] }) {
  if (xp.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HistoryIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No XP transactions yet. Activity will populate as the staff member
            completes orders and tasks.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <HistoryIcon className="h-4 w-4 text-muted-foreground" />
          Recent XP activity
        </h3>
        <div className="max-h-[600px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {xp.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="soft" className="text-[10.5px]">
                      {t.xpSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.description || "—"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium tabular-nums ${
                      t.xpAmount >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.xpAmount >= 0 ? "+" : ""}
                    {t.xpAmount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const isEmpty =
    value == null || (typeof value === "string" && value.trim() === "");
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:shrink-0">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-sm font-medium text-ink sm:text-right">
        {isEmpty ? <span className="text-muted-foreground">—</span> : value}
      </dd>
    </div>
  );
}

function DetailKey({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-canvas px-3 py-2">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

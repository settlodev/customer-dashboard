import { redirect } from "next/navigation";
import { Building2, Briefcase, UserCheck, Users } from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { KpiCard, KpiStrip } from "@/components/layouts/kpi-strip";
import { getPlatformStats } from "@/lib/actions/admin/accounts";
import { getStaffAuthToken } from "@/lib/auth-utils";
import type { PlatformStatsResponse } from "@/types/admin/account";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Admin Dashboard",
};

const STATS_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "BOARD_MEMBER",
  "SALES_TEAM",
];

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function formatPercent(numerator: number, denominator: number): string {
  if (!denominator) return "—";
  const pct = (numerator / denominator) * 100;
  return `${pct.toFixed(1)}%`;
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default async function AdminDashboardPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canViewStats = role ? STATS_ROLES.includes(role) : false;

  let stats: PlatformStatsResponse | null = null;
  let statsError: string | null = null;

  if (canViewStats) {
    try {
      stats = await getPlatformStats();
    } catch (error: any) {
      statsError =
        error?.message ?? "Failed to load platform stats. Please try again.";
    }
  }

  const subtitle = token?.email
    ? `Signed in as ${token.email}${role ? ` · ${role.replace(/_/g, " ")}` : ""}`
    : "Settlo internal staff portal";

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader title="Admin Dashboard" subtitle={subtitle} />
        <PageBody>
          {!canViewStats ? (
            <p className="font-mono text-[13px] text-muted-foreground">
              Platform metrics are visible to System Admins, Super Admins, Board
              Members, and Sales Team.
            </p>
          ) : statsError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {statsError}
            </p>
          ) : stats ? (
            <>
              <KpiStrip cols={4}>
                <KpiCard
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Total accounts"
                  value={formatNumber(stats.totalAccounts)}
                  delta={`${formatNumber(stats.activeAccounts)} active`}
                  deltaTone="neutral"
                />
                <KpiCard
                  icon={<UserCheck className="h-3.5 w-3.5" />}
                  label="Active rate"
                  value={formatPercent(
                    stats.activeAccounts,
                    stats.totalAccounts,
                  )}
                  delta={`${formatNumber(
                    stats.totalAccounts - stats.activeAccounts,
                  )} inactive`}
                  deltaTone="neutral"
                />
                <KpiCard
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Businesses"
                  value={formatNumber(stats.totalBusinesses)}
                />
                <KpiCard
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Staff seats"
                  value={formatNumber(stats.totalStaff)}
                  delta={`${formatNumber(stats.activeStaff)} active`}
                  deltaTone="neutral"
                />
              </KpiStrip>
              <p className="text-right font-mono text-[11px] text-muted-foreground">
                Snapshot · {formatTimestamp(stats.generatedAt)}
              </p>
            </>
          ) : null}

          <div className="rounded-lg border border-dashed border-line bg-card/40 p-6">
            <h2 className="text-sm font-semibold text-ink">Coming soon</h2>
            <p className="mt-1 font-mono text-[12px] text-muted-foreground">
              MRR, ARR, churn cohorts, and active-business trends ship once the
              backend analytics endpoints are available.
            </p>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

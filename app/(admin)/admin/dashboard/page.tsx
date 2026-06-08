import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AdminDashboardView } from "@/components/admin/dashboard/admin-dashboard-view";
import {
  DashboardPeriodToggle,
  SystemsStatusPill,
} from "@/components/admin/dashboard/dashboard-period-toggle";
import { getDashboardOverview } from "@/lib/actions/admin/dashboard-overview";
import { getStaffAuthToken } from "@/lib/auth-utils";
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

  const subtitle = token?.email
    ? `Signed in as ${token.email}${role ? ` · ${role.replace(/_/g, " ")}` : ""}`
    : "Settlo internal staff portal";

  if (!canViewStats) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Admin Dashboard" subtitle={subtitle} />
          <PageBody>
            <p className="rounded-2xl border border-dashed border-line bg-card/40 p-6 font-mono text-[13px] text-muted-foreground">
              The platform overview is visible to System Admins, Super Admins,
              Board Members, and the Sales Team.
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const overview = await getDashboardOverview();

  return (
    <AdminShell token={token}>
      <PageShell maxWidth="wide">
        <PageHeader
          title="Admin Dashboard"
          subtitle={subtitle}
          actions={
            <>
              <SystemsStatusPill />
              <DashboardPeriodToggle />
            </>
          }
        />
        <PageBody>
          <AdminDashboardView data={overview} />
          <p className="text-center font-mono text-[11px] text-muted-2">
            Snapshot · {formatTimestamp(overview.generatedAt)} · figures refresh
            every 15 min
          </p>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

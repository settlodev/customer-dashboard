import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AdminDashboardView } from "@/components/admin/dashboard/admin-dashboard-view";
import { SystemsStatusPill } from "@/components/admin/dashboard/dashboard-period-toggle";
import { DateFilterBar } from "@/components/admin/catalog/package-detail/date-filter-bar";
import {
  OperationsBand,
  type OperationMetric,
  type OperationsData,
} from "@/components/admin/dashboard/operations-band";
import { getDashboardOverview } from "@/lib/actions/admin/dashboard-overview";
import {
  getPlatformAccounts,
  getPlatformOrders,
  getPlatformStockMovement,
  type StaffScope,
} from "@/lib/actions/admin/platform-metrics";
import { getMyInternalStaffProfile } from "@/lib/actions/admin/accounts";
import {
  parseComparison,
  parseRange,
  resolveComparisonRange,
} from "@/lib/admin/period-range";
import { getStaffAuthToken } from "@/lib/auth-utils";
import type { PackageDateRange } from "@/types/admin/billing";
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

interface AdminDashboardPageProps {
  searchParams: Promise<{ from?: string; to?: string; compare?: string }>;
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

/** Run one operations metric for the current + comparison windows. */
async function loadMetric<T>(
  current: Promise<T>,
  comparison: Promise<T> | null,
): Promise<OperationMetric<T>> {
  const [cur, prev] = await Promise.allSettled([
    current,
    comparison ?? Promise.resolve(null),
  ]);
  return {
    value: cur.status === "fulfilled" ? cur.value : null,
    prev: prev.status === "fulfilled" ? prev.value : null,
    error: cur.status === "rejected",
  };
}

async function loadOperations(
  range: PackageDateRange,
  comparison: PackageDateRange | null,
  scope?: StaffScope,
): Promise<OperationsData> {
  const [orders, accounts, stock] = await Promise.all([
    loadMetric(
      getPlatformOrders(range.from, range.to, scope),
      comparison
        ? getPlatformOrders(comparison.from, comparison.to, scope)
        : null,
    ),
    loadMetric(
      getPlatformAccounts(range.from, range.to, scope),
      comparison
        ? getPlatformAccounts(comparison.from, comparison.to, scope)
        : null,
    ),
    loadMetric(
      getPlatformStockMovement(range.from, range.to, scope),
      comparison
        ? getPlatformStockMovement(comparison.from, comparison.to, scope)
        : null,
    ),
  ]);
  return { orders, accounts, stock };
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
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

  // Sales/support staff see metrics for only their assigned accounts. Admins /
  // board are unrestricted. (Only SALES reaches here; support isn't in STATS_ROLES.)
  const me = await getMyInternalStaffProfile();
  const scope: StaffScope | undefined =
    me?.assignableAs === "SALES"
      ? { assignedSalesStaffId: me.id }
      : me?.assignableAs === "SUPPORT"
        ? { assignedSupportStaffId: me.id }
        : undefined;
  const isScoped = scope !== undefined;

  const { from, to, compare } = await searchParams;
  const range = parseRange(from, to);
  const comparisonMode = parseComparison(compare);
  const comparisonRange = resolveComparisonRange(range, comparisonMode);

  // The platform-wide SaaS snapshot (MRR/funnel/plans/etc.) has no per-account
  // dimension, so a scoped rep sees only their accounts' operations band.
  const [overview, operations] = await Promise.all([
    isScoped ? Promise.resolve(null) : getDashboardOverview(),
    loadOperations(range, comparisonRange, scope),
  ]);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Admin Dashboard"
          subtitle={
            isScoped ? `${subtitle} · your assigned accounts` : subtitle
          }
          actions={<SystemsStatusPill />}
        />
        <PageBody>
          {/* Period-filtered operations metrics (orders / accounts / stock). */}
          <DateFilterBar
            range={range}
            comparisonMode={comparisonMode}
            comparisonRange={comparisonRange}
          />
          <OperationsBand data={operations} range={range} />

          {/* Live platform snapshot (not period-scoped) — admins/board only. */}
          {overview && (
            <>
              <AdminDashboardView data={overview} />
              <p className="text-center font-mono text-[11px] text-muted-2">
                Snapshot · {formatTimestamp(overview.generatedAt)} · figures
                refresh every 15 min
              </p>
            </>
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

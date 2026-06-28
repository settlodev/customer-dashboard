import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import { PageBody, PageHeader, PageShell } from "@/components/layouts/page-shell";
import { StuckWritesView } from "@/components/admin/stuck-writes/stuck-writes-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  listDeadLetters,
  listPendingApprovals,
} from "@/lib/actions/admin/stuck-writes";
import { getPlatformLocations } from "@/lib/actions/admin/platform-metrics";
import type { DeadLetterPage, RepairCommandPage } from "@/types/admin/stuck-writes";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

// Force dynamic so every filter change re-runs this Server Component with the new params.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Stuck Writes",
};

interface StuckWritesPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    deviceId?: string;
    orderId?: string;
    locationId?: string;
    classification?: string;
    moneyOp?: string;
    from?: string;
    to?: string;
    tab?: string;
  }>;
}

function dayBounds(from: string | undefined, to: string | undefined) {
  const isDay = (s: string | undefined): s is string =>
    !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const fromIso = isDay(from) ? `${from}T00:00:00Z` : undefined;
  let toIso: string | undefined;
  if (isDay(to)) {
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    toIso = d.toISOString();
  }
  return { fromIso, toIso };
}

const EMPTY_APPROVAL_PAGE: RepairCommandPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 0,
};

export default async function StuckWritesPage({
  searchParams,
}: StuckWritesPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canRead = hasInternalPermission(token, PERM.ACTIVITY_LOG_READ);
  const canExecute = hasInternalPermission(token, PERM.REPAIR_EXECUTE);
  const canApprove = hasInternalPermission(token, PERM.REPAIR_APPROVE);

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Stuck Writes"
            subtitle="You don't have permission to view dead-lettered mutations."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  const pageOneIndexed = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, parseInt(params.limit ?? "20", 10) || 20);
  const deviceId = params.deviceId?.trim() || undefined;
  const orderId = params.orderId?.trim() || undefined;
  const locationId = params.locationId || undefined;
  const classification = params.classification || undefined;
  const moneyOp =
    params.moneyOp === "true"
      ? true
      : params.moneyOp === "false"
        ? false
        : undefined;
  const { fromIso, toIso } = dayBounds(params.from, params.to);
  const tab = params.tab ?? "mutations";

  let deadLetters: DeadLetterPage | null = null;
  let approvals: RepairCommandPage = EMPTY_APPROVAL_PAGE;
  let locations: PlatformLocationRow[] = [];
  let loadError: string | null = null;

  try {
    [deadLetters, approvals, locations] = await Promise.all([
      listDeadLetters({
        page: backendPage,
        size,
        deviceId,
        order: orderId,
        locationId,
        classification,
        moneyOp,
        from: fromIso,
        to: toIso,
      }),
      // Always fetch approvals to show badge count even on the mutations tab.
      canApprove
        ? listPendingApprovals({ status: "REQUESTED", size: 100 })
        : Promise.resolve(EMPTY_APPROVAL_PAGE),
      getPlatformLocations({ size: 200 })
        .then((p) => p.content)
        .catch(() => []),
    ]);
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load data. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Stuck Writes"
          subtitle="Dead-lettered device mutations — diagnose and remotely repair stuck POS offline queues."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <StuckWritesView
              initialDeadLetters={deadLetters!}
              initialApprovals={approvals}
              locations={locations}
              canExecute={canExecute}
              canApprove={canApprove}
              operatorId={token.userId}
              initialClassification={classification ?? ""}
              initialLocationId={locationId ?? ""}
              initialDeviceId={params.deviceId ?? null}
              initialOrderId={params.orderId ?? null}
              initialMoneyOp={params.moneyOp ?? ""}
              initialFrom={params.from ?? null}
              initialTo={params.to ?? null}
              defaultPageSize={size}
              initialTab={tab}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { ActivityLogView } from "@/components/admin/activity-log-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listClientActivity } from "@/lib/actions/admin/activity-log";
import { getPlatformLocations } from "@/lib/actions/admin/platform-metrics";
import { ClientActivityPage } from "@/types/admin/activity-log";
import { PlatformLocationRow } from "@/types/admin/platform-metrics";

// Driven entirely by URL search params — page/limit, search, and the
// location/event/date/device/staff filters. Force dynamic rendering so every
// param change re-runs this Server Component with the *new* params (otherwise
// Next's Router Cache serves a prefetched, param-less copy and the filters
// silently no-op even though the URL updates).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Activity Log",
};

interface ActivityLogPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    locationId?: string;
    deviceId?: string;
    staffId?: string;
    eventType?: string;
    from?: string;
    to?: string;
  }>;
}

function dayBounds(from: string | undefined, to: string | undefined) {
  const isDay = (s: string | undefined): s is string =>
    !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const fromIso = isDay(from) ? `${from}T00:00:00Z` : undefined;
  // Upper bound is exclusive — push one day past `to` so the picked end-day
  // is included.
  let toIso: string | undefined;
  if (isDay(to)) {
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    toIso = d.toISOString();
  }
  return { fromIso, toIso };
}

export default async function AdminActivityLogPage({
  searchParams,
}: ActivityLogPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  if (!hasInternalPermission(token, PERM.ACTIVITY_LOG_READ)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Activity Log"
            subtitle="You don't have permission to view client activity."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  // DataTable uses 1-indexed `?page=` in the URL; the OMS endpoint expects
  // 0-indexed. Centralise the conversion here (same convention as accounts).
  const pageOneIndexed = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);
  const search = params.search?.trim() || undefined;
  const locationId = params.locationId || undefined;
  const deviceId = params.deviceId?.trim() || undefined;
  const staffId = params.staffId?.trim() || undefined;
  const eventType = params.eventType || undefined;
  const { fromIso, toIso } = dayBounds(params.from, params.to);

  let pageData: ClientActivityPage | null = null;
  let locations: PlatformLocationRow[] = [];
  let loadError: string | null = null;
  try {
    [pageData, locations] = await Promise.all([
      listClientActivity({
        page: backendPage,
        size,
        search,
        locationId,
        deviceId,
        staffId,
        eventType,
        from: fromIso,
        to: toIso,
      }),
      // Names for the location picker; best-effort so a Reports hiccup
      // never takes the activity log down.
      getPlatformLocations({ size: 200 })
        .then((p) => p.content)
        .catch(() => []),
    ]);
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load activity log. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Activity Log"
          subtitle="Browse the client-activity audit stream across every device and location. Trace a sale by order number or UUID."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <ActivityLogView
              initialPage={pageData!}
              locations={locations}
              initialEventType={eventType ?? "all"}
              initialLocationId={locationId ?? "all"}
              initialDeviceId={params.deviceId ?? null}
              initialStaffId={params.staffId ?? null}
              initialFrom={params.from ?? null}
              initialTo={params.to ?? null}
              initialSearch={params.search ?? null}
              defaultPageSize={size}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

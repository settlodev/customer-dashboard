import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { LocationsSubscriptionsView } from "@/components/admin/locations/locations-subscriptions-view";
import { SyncAllCatalogsButton } from "@/components/admin/locations/sync-all-catalogs-button";
import {
  getPlatformLocations,
  type StaffScope,
} from "@/lib/actions/admin/platform-metrics";
import { getMyInternalStaffProfile } from "@/lib/actions/admin/accounts";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import type { PlatformLocationsPage } from "@/types/admin/platform-metrics";

export const metadata = {
  title: "Locations & subscriptions",
};

interface LocationsPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdminLocationsPage({
  searchParams,
}: LocationsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const isSuperAdmin = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  const canRead = hasInternalPermission(token, PERM.BUSINESS_ANALYTICS_READ);
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Locations & subscriptions"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;
  // DataTable uses 1-indexed `?page=` in the URL; the backend is 0-indexed.
  const pageOneIndexed = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "20", 10) || 20);
  const search = params.search?.trim() || undefined;
  const status = params.status?.trim() || undefined;

  // Sales/support staff see only locations under accounts assigned to them.
  const me = await getMyInternalStaffProfile();
  const scope: StaffScope | undefined =
    me?.assignableAs === "SALES"
      ? { assignedSalesStaffId: me.id }
      : me?.assignableAs === "SUPPORT"
        ? { assignedSupportStaffId: me.id }
        : undefined;

  let pageData: PlatformLocationsPage | null = null;
  let loadError: string | null = null;
  try {
    pageData = await getPlatformLocations(
      {
        page: backendPage,
        size,
        search,
        status,
      },
      scope,
    );
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load locations.";
  }

  const subtitle = pageData
    ? `${pageData.totalElements.toLocaleString()} active location${
        pageData.totalElements === 1 ? "" : "s"
      } · each location has its own subscription`
    : "Locations across all businesses with their subscription status.";

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Locations & subscriptions"
          subtitle={subtitle}
          actions={isSuperAdmin ? <SyncAllCatalogsButton /> : undefined}
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <LocationsSubscriptionsView page={pageData!} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

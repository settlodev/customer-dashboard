import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { GatewayRequestsView } from "@/components/admin/gateway-requests/gateway-requests-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listGatewayRequests } from "@/lib/actions/admin/gateway-requests";
import {
  EMPTY_GATEWAY_REQUEST_FILTERS,
  GATEWAY_REQUEST_FILTER_KEYS,
  type GatewayRequestFilterValues,
  type GatewayRequestPage,
} from "@/types/admin/gateway-requests";

// Driven entirely by URL search params for the filters — page/limit stay
// local to the DataTable's own live-tail buffer when no filter is active
// (see GatewayRequestsView), and switch to server-side paging the moment a
// filter param shows up. Force dynamic so every param change re-runs this
// Server Component with the new params.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gateway Requests",
};

const PAGE_SIZE = 20;

interface GatewayRequestsPageProps {
  searchParams: Promise<{ page?: string; limit?: string } & Partial<
    Record<(typeof GATEWAY_REQUEST_FILTER_KEYS)[number], string>
  >>;
}

export default async function GatewayRequestsPage({
  searchParams,
}: GatewayRequestsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  if (!hasInternalPermission(token, PERM.ACTIVITY_LOG_READ)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Gateway Requests"
            subtitle="You don't have permission to view the gateway request tail."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const params = await searchParams;

  const filters: GatewayRequestFilterValues = { ...EMPTY_GATEWAY_REQUEST_FILTERS };
  for (const key of GATEWAY_REQUEST_FILTER_KEYS) {
    filters[key] = params[key]?.trim() ?? "";
  }
  const filtersActive = GATEWAY_REQUEST_FILTER_KEYS.some((key) => filters[key]);

  // DataTable uses 1-indexed `?page=` in the URL; the backend expects
  // 0-indexed (same convention as activity-log/accounts).
  const pageOneIndexed = Math.max(
    1,
    Number.parseInt(params.page ?? "1", 10) || 1,
  );
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "", 10) || PAGE_SIZE);

  const upstreamStatusCode = filters.upstreamStatusCode
    ? Number.parseInt(filters.upstreamStatusCode, 10)
    : undefined;
  const hasUpstreamError =
    filters.hasUpstreamError === "true"
      ? true
      : filters.hasUpstreamError === "false"
        ? false
        : undefined;

  let initialPage: GatewayRequestPage = { content: [], totalElements: 0 };
  let loadError: string | null = null;
  try {
    initialPage = await listGatewayRequests({
      // Live-tail mode (no filters) always starts from the first page —
      // only a filtered query honours `?page`.
      page: filtersActive ? backendPage : 0,
      size,
      upstreamServerName: filters.upstreamServerName || undefined,
      httpMethod: filters.httpMethod || undefined,
      upstreamStatusCode: Number.isFinite(upstreamStatusCode)
        ? upstreamStatusCode
        : undefined,
      hasUpstreamError,
    });
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load gateway requests. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Gateway Requests"
          subtitle="Live tail of raw HTTP requests passing through the API gateway, across every upstream service. Apply a filter to search the full history instead."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <GatewayRequestsView
              initialPage={initialPage}
              pageSize={size}
              filtersActive={filtersActive}
              initialFilters={filters}
              page={backendPage}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

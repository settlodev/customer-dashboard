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
import type { GatewayRequestPage } from "@/types/admin/gateway-requests";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gateway Requests",
};

const PAGE_SIZE = 20;

export default async function GatewayRequestsPage() {
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

  let initialPage: GatewayRequestPage = { content: [], totalElements: 0 };
  let loadError: string | null = null;
  try {
    initialPage = await listGatewayRequests({ page: 0, size: PAGE_SIZE });
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load gateway requests. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Gateway Requests"
          subtitle="Live tail of raw HTTP requests passing through the API gateway, across every upstream service."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <GatewayRequestsView
              initialPage={initialPage}
              pageSize={PAGE_SIZE}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

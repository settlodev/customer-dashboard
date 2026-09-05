import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import { PageBody, PageHeader, PageShell } from "@/components/layouts/page-shell";
import { RegistrationStatusCheckView } from "@/components/admin/efd-vfd/registration-status-check-view";
import { VfdRegistrationsListView } from "@/components/admin/efd-vfd/vfd-registrations-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  getVfdRegistrationStatusCounts,
  listVfdRegistrations,
} from "@/lib/actions/admin/vfd-registrations";
import type {
  AdminVfdRegistrationPage,
  VfdRegistrationStatusCounts,
} from "@/types/admin/vfd-registration";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "EFD / VFD",
};

interface EfdVfdPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
  }>;
}

const STATUS_PARAM_TO_EXTERNAL_STATUS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
};

export default async function EfdVfdPage({ searchParams }: EfdVfdPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canTrigger = hasInternalPermission(token, PERM.VFD_TRIGGER);
  const canRead = hasInternalPermission(token, PERM.VFD_READ);

  const params = await searchParams;
  // DataTable uses 1-indexed `?page=` in the URL; the backend is 0-indexed.
  const pageOneIndexed = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const backendPage = pageOneIndexed - 1;
  const size = Math.max(1, Number.parseInt(params.limit ?? "10", 10) || 10);
  const statusParam = params.status;
  const externalStatus = statusParam
    ? STATUS_PARAM_TO_EXTERNAL_STATUS[statusParam]
    : undefined;

  let pageData: AdminVfdRegistrationPage | null = null;
  let counts: VfdRegistrationStatusCounts = { total: 0, pending: 0, active: 0 };
  let loadError: string | null = null;
  if (canRead) {
    try {
      [pageData, counts] = await Promise.all([
        listVfdRegistrations({ page: backendPage, size, status: externalStatus }),
        getVfdRegistrationStatusCounts(),
      ]);
    } catch (error: any) {
      loadError = error?.message ?? "Failed to load VFD registrations.";
    }
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="EFD / VFD"
          subtitle="Tools for the DIRM virtual fiscal device integration."
        />
        <PageBody>
          <div className="space-y-8">
            <RegistrationStatusCheckView canExecute={canTrigger} />

            {canRead ? (
              loadError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {loadError}
                </p>
              ) : (
                <VfdRegistrationsListView
                  initialPage={pageData!}
                  counts={counts}
                  initialStatus={statusParam ?? "all"}
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                You don&apos;t have permission to view customer VFD registrations.
              </p>
            )}
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AppVersionView } from "@/components/admin/app-version/app-version-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listAppVersionGates } from "@/lib/actions/admin/app-version";
import type { AppVersionGateRow } from "@/types/admin/app-version";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "App Version Gate",
};

export default async function AppVersionPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canManage = hasInternalPermission(token, PERM.APP_VERSION_MANAGE);
  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="App Version Gate"
            subtitle="You do not have permission to manage the app version gate."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let rows: AppVersionGateRow[] = [];
  let loadError: string | null = null;
  try {
    rows = await listAppVersionGates();
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load the version gates.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="App Version Gate"
          subtitle="The minimum app version POS devices are held to. Raising the floor blocks every device below it on its next check; deleting the row releases them all."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <AppVersionView rows={rows} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import { PageBody, PageHeader, PageShell } from "@/components/layouts/page-shell";
import { ReparentedDuplicatesView } from "@/components/admin/data-repair/reparented-duplicates-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { getPlatformLocations } from "@/lib/actions/admin/platform-metrics";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data Repair",
};

export default async function DataRepairPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  // Viewing + scanning is a read-only inspection, gated on the same permission
  // as the other operations tools. The destructive PURGE additionally needs
  // repair-execute, enforced both here (the button) and by the Reports service.
  const canRead = hasInternalPermission(token, PERM.ACTIVITY_LOG_READ);
  const canExecute = hasInternalPermission(token, PERM.REPAIR_EXECUTE);

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Data Repair"
            subtitle="You don't have permission to view data-repair tools."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const locations = await getPlatformLocations({ size: 200 })
    .then((p) => p.content)
    .catch(() => []);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Data Repair"
          subtitle="Settlo-internal backfills that repair analytics facts in place."
        />
        <PageBody>
          <ReparentedDuplicatesView locations={locations} canExecute={canExecute} />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import { PageBody, PageHeader, PageShell } from "@/components/layouts/page-shell";
import { RegistrationStatusCheckView } from "@/components/admin/efd-vfd/registration-status-check-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "EFD / VFD",
};

export default async function EfdVfdPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canExecute = hasInternalPermission(token, PERM.VFD_TRIGGER);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="EFD / VFD"
          subtitle="Tools for the DIRM virtual fiscal device integration."
        />
        <PageBody>
          <div className="space-y-8">
            <RegistrationStatusCheckView canExecute={canExecute} />
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

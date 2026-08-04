import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { MasterKeyView } from "@/components/admin/master-key/master-key-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Impersonation Master Key",
};

export default async function MasterKeyPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  // UX gate only — the auth service re-checks the same permission on both
  // endpoints, so a hand-crafted request gets 403 regardless of what renders.
  const canManage = hasInternalPermission(token, PERM.USERS_IMPERSONATE_STAFF);
  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Impersonation Master Key"
            subtitle="You do not have permission to read the impersonation master key."
          />
        </PageShell>
      </AdminShell>
    );
  }

  // Note there is no data fetch here. Reading the key writes a MASTER_KEY_VIEWED
  // audit row, so fetching it during render would stamp the trail on every
  // navigation. MasterKeyView reads it only when the operator clicks.
  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Impersonation Master Key"
          subtitle="The second factor for logging in as a staff member. It rotates automatically every day, and every read is recorded against your account."
        />
        <PageBody>
          <MasterKeyView />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

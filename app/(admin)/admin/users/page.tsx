import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { InternalUsersView } from "@/components/admin/internal-users-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  listInternalRoles,
  listInternalStaffProfiles,
  listInternalUsers,
} from "@/lib/actions/admin/internal-users";
import {
  InternalUserResponse,
  RolePermissionsResponse,
} from "@/types/admin/internal-user";
import { InternalStaffSummary } from "@/types/admin/internal-staff";

export const metadata = {
  title: "Internal Users",
};

export default async function AdminInternalUsersPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const isAuthorized = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  const canMutate = hasInternalPermission(token, PERM.USERS_MANAGE_INTERNAL);

  if (!isAuthorized) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Internal Users"
            subtitle="You don't have permission to view this page."
          />
          <PageBody>
            <p className="font-mono text-[13px] text-muted-foreground">
              Internal user management is restricted to System Admins and Super
              Admins.
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  let users: InternalUserResponse[] = [];
  let roles: RolePermissionsResponse[] = [];
  let profiles: InternalStaffSummary[] = [];
  let loadError: string | null = null;

  try {
    [users, roles] = await Promise.all([
      listInternalUsers(),
      listInternalRoles(),
    ]);
  } catch (error: any) {
    loadError =
      error?.message ?? "Failed to load internal users. Please try again.";
  }

  // Non-fatal: the rich profiles (names + HRM details) overlay the Auth list.
  // If the Accounts call fails, the page still renders with names as "—".
  try {
    profiles = await listInternalStaffProfiles();
  } catch {
    profiles = [];
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Internal Users"
          subtitle="Manage Settlo staff with access to this portal."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <InternalUsersView
              users={users}
              roles={roles}
              profiles={profiles}
              canMutate={canMutate}
              currentUserId={token.userId}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

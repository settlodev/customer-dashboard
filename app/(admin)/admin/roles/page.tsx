import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { RolesView } from "@/components/admin/roles-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  listInternalRoleDefinitions,
  listPermissionCatalog,
} from "@/lib/actions/admin/internal-roles";
import { InternalRoleResponse } from "@/types/admin/internal-role";

export const metadata = {
  title: "Roles",
};

export default async function AdminRolesPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const isAuthorized = hasInternalPermission(token, PERM.ROLES_MANAGE);

  if (!isAuthorized) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Roles"
            subtitle="You don't have permission to view this page."
          />
          <PageBody>
            <p className="font-mono text-[13px] text-muted-foreground">
              Role management is restricted to System Admins and Super Admins.
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  let roles: InternalRoleResponse[] = [];
  let permissionCatalog: string[] = [];
  let loadError: string | null = null;

  try {
    [roles, permissionCatalog] = await Promise.all([
      listInternalRoleDefinitions(),
      listPermissionCatalog(),
    ]);
  } catch (error: any) {
    loadError = error?.message ?? "Failed to load roles. Please try again.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Roles"
          subtitle="Define internal staff roles, their permissions, and account-assignment capability."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <RolesView
              roles={roles}
              permissionCatalog={permissionCatalog}
              canManage={isAuthorized}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

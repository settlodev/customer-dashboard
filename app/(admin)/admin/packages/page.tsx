import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { PackagesListView } from "@/components/admin/catalog/packages-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listPackages } from "@/lib/actions/admin/billing";
import type { PackageResponse } from "@/types/admin/billing";

export const metadata = {
  title: "Packages",
};

export default async function AdminPackagesPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Packages"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let packages: PackageResponse[] = [];
  let loadError: string | null = null;
  try {
    packages = await listPackages();
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load packages.";
  }

  // Sort: active first, then by entity type, then by price ascending — so
  // the most relevant rows are at the top whatever the catalog size.
  packages.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.entityType !== b.entityType)
      return a.entityType.localeCompare(b.entityType);
    return a.basePrice - b.basePrice;
  });

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Packages"
          subtitle="Subscription plans available to businesses. Edit prices to update future renewals; existing subscriptions keep their original terms."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <PackagesListView packages={packages} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

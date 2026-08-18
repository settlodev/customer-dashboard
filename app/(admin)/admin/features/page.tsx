import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { FeaturesView } from "@/components/admin/catalog/features-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listFeatures, listPackages } from "@/lib/actions/admin/billing";
import type {
  FeatureResponse,
  PackageResponse,
} from "@/types/admin/billing";

export const metadata = {
  title: "Features",
};

export default async function AdminFeaturesPage() {
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
            title="Features"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let features: FeatureResponse[] = [];
  let packages: PackageResponse[] = [];
  let loadError: string | null = null;
  try {
    [features, packages] = await Promise.all([listFeatures(), listPackages()]);
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load catalog data.";
  }

  // Active first, then by type, then alphabetical — keeps the most
  // relevant rows visible without a paging UI.
  features.sort((a, b) => {
    const aActive = a.isActive !== false;
    const bActive = b.isActive !== false;
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (a.featureType !== b.featureType)
      return a.featureType.localeCompare(b.featureType);
    return a.name.localeCompare(b.name);
  });

  packages.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Features & entitlements"
          subtitle="Define entitlement keys the rest of the platform checks, and decide which packages ship with which features."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <FeaturesView features={features} packages={packages} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

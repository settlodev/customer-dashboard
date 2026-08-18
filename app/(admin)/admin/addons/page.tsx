import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AddonsListView } from "@/components/admin/catalog/addons-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listAddons, listFeatures } from "@/lib/actions/admin/billing";
import type { AddonResponse, FeatureResponse } from "@/types/admin/billing";

export const metadata = {
  title: "Addons",
};

export default async function AdminAddonsPage() {
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
            title="Addons"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let addons: AddonResponse[] = [];
  let loadError: string | null = null;
  try {
    addons = await listAddons();
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load addons.";
  }

  // Soft-fail: the feature catalog only drives the "limits lifted" picker, so it must
  // never take the addon list down with it.
  let features: FeatureResponse[] = [];
  try {
    features = await listFeatures();
  } catch {
    features = [];
  }

  addons.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    if (a.entityType !== b.entityType)
      return a.entityType.localeCompare(b.entityType);
    return a.price - b.price;
  });

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Addons"
          subtitle="Optional paid extras that attach to subscription items. Used by Support staff via the billing screen."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <AddonsListView addons={addons} features={features} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { WhitelabelPricingView } from "@/components/admin/catalog/whitelabel-pricing-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listAddons, listPackages } from "@/lib/actions/admin/billing";
import { listWhitelabels } from "@/lib/actions/admin/whitelabels";
import type {
  AddonResponse,
  PackageResponse,
  WhitelabelSummary,
} from "@/types/admin/billing";

export const metadata = {
  title: "Whitelabel pricing",
};

interface WhitelabelPricingPageProps {
  searchParams: Promise<{ whitelabelId?: string }>;
}

export default async function AdminWhitelabelPricingPage({
  searchParams,
}: WhitelabelPricingPageProps) {
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
            title="Whitelabel pricing"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let whitelabels: WhitelabelSummary[] = [];
  let packages: PackageResponse[] = [];
  let addons: AddonResponse[] = [];
  let loadError: string | null = null;
  try {
    [whitelabels, packages, addons] = await Promise.all([
      listWhitelabels(),
      listPackages(),
      listAddons(),
    ]);
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load pricing data.";
  }

  whitelabels.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  packages = packages.filter((p) => p.isActive);
  packages.sort((a, b) => {
    if (a.entityType !== b.entityType)
      return a.entityType.localeCompare(b.entityType);
    return a.basePrice - b.basePrice;
  });
  addons = addons.filter((a) => a.isActive);
  addons.sort((a, b) => {
    if (a.entityType !== b.entityType)
      return a.entityType.localeCompare(b.entityType);
    return a.price - b.price;
  });

  const params = await searchParams;
  const initialWhitelabelId =
    params.whitelabelId &&
    whitelabels.some((w) => w.id === params.whitelabelId)
      ? params.whitelabelId
      : whitelabels[0]?.id ?? null;

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Whitelabel pricing"
          subtitle="Override package and addon prices for a specific whitelabel. Customers on the whitelabel see the override; everyone else stays on the base price."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <WhitelabelPricingView
              whitelabels={whitelabels}
              packages={packages}
              addons={addons}
              initialWhitelabelId={initialWhitelabelId}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

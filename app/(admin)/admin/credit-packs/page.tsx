import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { CreditPacksView } from "@/components/admin/catalog/credit-packs-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import {
  listCreditPacks,
  listCreditTypes,
  listPackages,
} from "@/lib/actions/admin/billing";
import type {
  CreditPackResponse,
  CreditTypeResponse,
  PackageResponse,
} from "@/types/admin/billing";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Credit packs",
};

const CATALOG_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPER_ADMIN"];

export default async function AdminCreditPacksPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canManage = role ? CATALOG_ROLES.includes(role) : false;
  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Credit packs"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let packs: CreditPackResponse[] = [];
  let creditTypes: CreditTypeResponse[] = [];
  let packages: PackageResponse[] = [];
  let loadError: string | null = null;
  try {
    [packs, creditTypes, packages] = await Promise.all([
      listCreditPacks(),
      listCreditTypes(),
      listPackages(),
    ]);
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load credits catalog.";
  }

  packs.sort((a, b) => {
    if (a.creditTypeName && b.creditTypeName && a.creditTypeName !== b.creditTypeName) {
      return a.creditTypeName.localeCompare(b.creditTypeName);
    }
    return a.creditAmount - b.creditAmount;
  });
  creditTypes.sort((a, b) => a.name.localeCompare(b.name));
  packages.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Credits"
          subtitle="Manage on-demand credit packs and configure how many credits each subscription tier includes every month."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <CreditPacksView
              packs={packs}
              creditTypes={creditTypes}
              packages={packages}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { CouponsListView } from "@/components/admin/catalog/coupons-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { listCoupons } from "@/lib/actions/admin/billing";
import type { CouponResponse } from "@/types/admin/billing";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Coupons",
};

const CATALOG_ROLES: InternalRole[] = ["SYSTEM_ADMIN", "SUPER_ADMIN"];

export default async function AdminCouponsPage() {
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
            title="Coupons"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let coupons: CouponResponse[] = [];
  let loadError: string | null = null;
  try {
    coupons = await listCoupons();
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load coupons.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Coupons"
          subtitle="Redeemable codes customers enter at checkout. Backend already lowers and validates the code on redemption."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <CouponsListView coupons={coupons} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { SupplierStatusBadge } from "@/components/admin/settlo-suppliers/supplier-status-badge";
import { SupplierProfileCard } from "@/components/admin/settlo-suppliers/supplier-profile-card";
import { SupplierDecisionPanel } from "@/components/admin/settlo-suppliers/supplier-decision-panel";
import { PaymentAccountsCard } from "@/components/admin/settlo-suppliers/payment-accounts-card";
import { FinancingCard } from "@/components/admin/settlo-suppliers/financing-card";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { getSettloSupplier } from "@/lib/actions/admin/settlo-suppliers";
import type { AdminSettloSupplier } from "@/types/admin/settlo-suppliers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Supplier detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSettloSupplierDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.ACCOUNTS_READ_ALL)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Supplier detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);

  let supplier: AdminSettloSupplier | null = null;
  try {
    supplier = await getSettloSupplier(id);
  } catch {
    supplier = null;
  }
  if (!supplier) notFound();

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Settlo suppliers", href: "/settlo-suppliers" },
            { title: supplier.name },
          ]}
        />
        <PageHeader
          title={supplier.name}
          subtitle="Settlo supplier directory entry."
          titleAccessory={
            <SupplierStatusBadge status={supplier.verificationStatus} />
          }
        />
        <PageBody>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Profile + Task 5 mount points */}
            <div className="space-y-4 lg:col-span-2">
              <SupplierProfileCard supplier={supplier} canManage={canManage} />

              <PaymentAccountsCard supplier={supplier} canManage={canManage} />
            </div>

            {/* Decision panel */}
            <div className="space-y-4 lg:col-span-1">
              <SupplierDecisionPanel supplier={supplier} canManage={canManage} />

              <FinancingCard supplier={supplier} canManage={canManage} />
            </div>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

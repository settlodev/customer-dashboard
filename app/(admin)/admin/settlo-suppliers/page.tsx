import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { SettloSuppliersView } from "@/components/admin/settlo-suppliers/settlo-suppliers-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { listSettloSuppliers } from "@/lib/actions/admin/settlo-suppliers";
import {
  SUPPLIER_STATUS_LABELS,
  type AdminSettloSupplier,
  type SettloSupplierVerificationStatus,
} from "@/types/admin/settlo-suppliers";

// Driven by `?status=`; force dynamic rendering so a tab change always
// re-runs this Server Component with the new param instead of serving a
// prefetched, param-less copy from the Router Cache.
export const dynamic = "force-dynamic";
export const metadata = { title: "Settlo suppliers" };

const STATUS_TABS: SettloSupplierVerificationStatus[] = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminSettloSuppliersPage({
  searchParams,
}: PageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) redirect("/login");

  if (!hasInternalPermission(token, PERM.ACCOUNTS_READ_ALL)) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Settlo suppliers"
            subtitle="You don't have permission to view the supplier directory."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);

  const { status: statusParam } = await searchParams;
  const raw = statusParam?.toUpperCase();
  const activeStatus =
    raw && STATUS_TABS.includes(raw as SettloSupplierVerificationStatus)
      ? (raw as SettloSupplierVerificationStatus)
      : undefined;

  let suppliers: AdminSettloSupplier[] = [];
  let loadError: string | null = null;
  try {
    suppliers = await listSettloSuppliers(activeStatus);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load suppliers.";
  }

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Settlo suppliers"
          subtitle="Directory of suppliers marketplace orders can be financed and disbursed against."
        />
        <PageBody>
          {/* Status filter */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href="/settlo-suppliers"
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                !activeStatus
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-card text-ink-3 hover:bg-canvas hover:text-ink",
              )}
            >
              All
            </Link>
            {STATUS_TABS.map((status) => {
              const isActive = activeStatus === status;
              return (
                <Link
                  key={status}
                  href={`/settlo-suppliers?status=${status}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-card text-ink-3 hover:bg-canvas hover:text-ink",
                  )}
                >
                  {SUPPLIER_STATUS_LABELS[status]}
                </Link>
              );
            })}
          </div>

          {loadError ? (
            <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <div className="mt-4">
              <SettloSuppliersView suppliers={suppliers} canManage={canManage} />
            </div>
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

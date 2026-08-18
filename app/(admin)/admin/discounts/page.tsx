import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { DiscountsListView } from "@/components/admin/catalog/discounts-list-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import { listAllDiscounts } from "@/lib/actions/admin/billing";
import type { DiscountResponse } from "@/types/admin/billing";

export const metadata = {
  title: "Discounts",
};

export default async function AdminDiscountsPage() {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canRead = hasInternalPermission(token, PERM.SUPPORT_TICKETS_MANAGE);
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Discounts"
            subtitle="Restricted to support and admin roles."
          />
        </PageShell>
      </AdminShell>
    );
  }

  let discounts: DiscountResponse[] = [];
  let loadError: string | null = null;
  try {
    discounts = await listAllDiscounts();
  } catch (err: any) {
    loadError = err?.message ?? "Failed to load discounts.";
  }

  // Active first, then alphabetical — matches what support staff scan
  // for when picking which discount to apply.
  discounts.sort((a, b) => {
    const aActive = a.isActive ?? a.active ?? true;
    const bActive = b.isActive ?? b.active ?? true;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="Discounts"
          subtitle="Reusable discount definitions. Support staff apply them to individual subscriptions from the billing screen."
        />
        <PageBody>
          {loadError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {loadError}
            </p>
          ) : (
            <DiscountsListView discounts={discounts} />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

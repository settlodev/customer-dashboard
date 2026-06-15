import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { EntityDetailView } from "@/components/admin/entity-detail/entity-detail-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAdminWarehouseDetail } from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import { getEntityStockSummary } from "@/lib/actions/admin/business-operations";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Warehouse detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface WarehouseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? READ_ROLES.includes(role) : false;
  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Warehouse detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canBilling = role === "SYSTEM_ADMIN" || role === "SUPPORT_AGENT";
  const { id } = await params;

  let warehouse: Awaited<ReturnType<typeof getAdminWarehouseDetail>>;
  try {
    warehouse = await getAdminWarehouseDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Warehouse detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load warehouse."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const businessId = warehouse.businessId;
  const subscription = canBilling
    ? await getBusinessSubscription(businessId).catch(() => null)
    : null;
  const item = subscription?.items.find((i) => i.entityId === id) ?? null;
  const stock = await getEntityStockSummary("WAREHOUSE", id).catch(() => null);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: warehouse.businessName ?? "Business", href: `/businesses/${businessId}` },
            { title: warehouse.name },
          ]}
        />
        <PageHeader
          title={warehouse.name}
          subtitle={[warehouse.code, warehouse.businessName].filter(Boolean).join(" · ") || undefined}
        />
        <PageBody>
          <EntityDetailView
            entityType="WAREHOUSE"
            businessId={businessId}
            subscriptionId={subscription?.id ?? null}
            item={item}
            ordersRow={null}
            rangeLabel=""
            canBilling={canBilling}
            stock={stock}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

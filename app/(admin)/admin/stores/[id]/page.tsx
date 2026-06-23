import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { EntityDetailView } from "@/components/admin/entity-detail/entity-detail-view";
import { EditStoreButton } from "@/components/admin/entity-detail/edit-store-dialog";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAdminStoreDetail } from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import { getEntityStockSummary } from "@/lib/actions/admin/business-operations";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Store detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface StoreDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreDetailPage({
  params,
}: StoreDetailPageProps) {
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
            title="Store detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canBilling = role === "SYSTEM_ADMIN" || role === "SUPPORT_AGENT";
  const canEdit = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  const { id } = await params;

  let store: Awaited<ReturnType<typeof getAdminStoreDetail>>;
  try {
    store = await getAdminStoreDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Store detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load store."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const businessId = store.businessId;
  const subscription = canBilling
    ? await getBusinessSubscription(businessId).catch(() => null)
    : null;
  const item = subscription?.items.find((i) => i.entityId === id) ?? null;
  const stock = await getEntityStockSummary("STORE", id).catch(() => null);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: store.businessName ?? "Business", href: `/businesses/${businessId}` },
            { title: store.name },
          ]}
        />
        <PageHeader
          title={store.name}
          subtitle={[store.locationName, store.businessName].filter(Boolean).join(" · ") || undefined}
          actions={canEdit ? <EditStoreButton store={store} /> : undefined}
        />
        <PageBody>
          <EntityDetailView
            entityType="STORE"
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

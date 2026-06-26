import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { EntityDetailView } from "@/components/admin/entity-detail/entity-detail-view";
import { EditLocationButton } from "@/components/admin/entity-detail/edit-location-dialog";
import { getStaffAuthToken } from "@/lib/auth-utils";
import { getAdminLocationDetail } from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import {
  getBusinessLocationBreakdown,
  getDefaultIntelRange,
} from "@/lib/actions/admin/business-intel";
import { getEntityStockSummary } from "@/lib/actions/admin/business-operations";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Location detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface LocationDetailPageProps {
  params: Promise<{ id: string }>;
}

function shortDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
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
            title="Location detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canBilling = role === "SYSTEM_ADMIN" || role === "SUPPORT_AGENT";
  const canEdit = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";
  // SYSTEM_ADMIN maps to billing's ROLE_SYSTEM_ADMIN (system_admin claim) — the only
  // caller allowed to override-extend a paid/used entity's trial.
  const isSuperAdmin = role === "SYSTEM_ADMIN";
  const { id } = await params;

  let location: Awaited<ReturnType<typeof getAdminLocationDetail>>;
  try {
    location = await getAdminLocationDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Location detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load location."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const businessId = location.businessId;
  const { startDate, endDate } = await getDefaultIntelRange(30);

  const results = await Promise.allSettled([
    canBilling ? getBusinessSubscription(businessId) : Promise.resolve(null),
    getBusinessLocationBreakdown(businessId, startDate, endDate),
  ]);

  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const subscription = value(results[0]);
  const breakdown = value(results[1]) ?? [];
  const item = subscription?.items.find((i) => i.entityId === id) ?? null;
  const ordersRow = breakdown.find((r) => r.location_id === id) ?? null;
  const rangeLabel = `${shortDay(startDate)} → ${shortDay(endDate)}`;
  const stock = await getEntityStockSummary("LOCATION", id).catch(() => null);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Locations", href: "/locations" },
            { title: location.businessName ?? "Business", href: `/businesses/${businessId}` },
            { title: location.name },
          ]}
        />
        <PageHeader
          title={location.name}
          subtitle={
            [location.region, location.businessName].filter(Boolean).join(" · ") ||
            undefined
          }
          actions={canEdit ? <EditLocationButton location={location} /> : undefined}
        />
        <PageBody>
          <EntityDetailView
            entityType="LOCATION"
            businessId={businessId}
            subscriptionId={subscription?.id ?? null}
            item={item}
            ordersRow={ordersRow}
            rangeLabel={rangeLabel}
            canBilling={canBilling}
            isSuperAdmin={isSuperAdmin}
            stock={stock}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

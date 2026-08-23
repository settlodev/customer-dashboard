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
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  getAdminBusinessDetail,
  getAdminLocationDetail,
} from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import {
  getBusinessLocationBreakdown,
  getDefaultIntelRange,
  getLocationOverviewByFilter,
} from "@/lib/actions/admin/business-intel";
import { getEntityStockSummary } from "@/lib/actions/admin/business-operations";
import type { BusinessOverviewSnapshot } from "@/types/admin/business-intel";

export const metadata = {
  title: "Location detail",
};

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
  const canRead = hasInternalPermission(token, PERM.ACCOUNTS_READ);
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

  const canBilling = hasInternalPermission(token, PERM.SUPPORT_TICKETS_MANAGE);
  const canEdit = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
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

  // A location is what actually trades, so it gets the same three-window
  // scorecard the business detail shows. Each pull settles independently — a
  // failing analytics call renders an empty card, never a blank page.
  const results = await Promise.allSettled([
    canBilling ? getBusinessSubscription(businessId) : Promise.resolve(null),
    getBusinessLocationBreakdown(businessId, startDate, endDate),
    getLocationOverviewByFilter(id, "TODAY"),
    getLocationOverviewByFilter(id, "LAST_7_DAYS"),
    getLocationOverviewByFilter(id, "LAST_30_DAYS"),
    getAdminBusinessDetail(businessId),
  ]);

  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const subscription = value(results[0]);
  const breakdown = value(results[1]) ?? [];
  const overviewToday = value(results[2]) as BusinessOverviewSnapshot | null;
  const overview7d = value(results[3]) as BusinessOverviewSnapshot | null;
  const overview30d = value(results[4]) as BusinessOverviewSnapshot | null;
  const business = value(results[5]);
  const item =
    (subscription?.manageableItems ?? subscription?.items)?.find((i) => i.entityId === id) ?? null;
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
            billingExempt={subscription?.billingExempt === true}
            item={item}
            ordersRow={ordersRow}
            rangeLabel={rangeLabel}
            canBilling={canBilling}
            isSuperAdmin={isSuperAdmin}
            stock={stock}
            overviewToday={overviewToday}
            overview7d={overview7d}
            overview30d={overview30d}
            currency={business?.baseCurrency ?? undefined}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

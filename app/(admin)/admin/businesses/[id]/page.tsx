import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { BusinessDetailView } from "@/components/admin/business-detail/business-detail-view";
import { getStaffAuthToken } from "@/lib/auth-utils";
import {
  getAdminBusinessDetail,
  listAdminBusinessLocations,
  listAdminBusinessStores,
  listAdminBusinessWarehouses,
} from "@/lib/actions/admin/businesses";
import {
  getBusinessSubscription,
  listBusinessInvoices,
} from "@/lib/actions/admin/billing";
import {
  getBusinessCustomerSegments,
  getBusinessHealth,
  getBusinessLifecycle,
  getBusinessLocationBreakdown,
  getBusinessOverviewByFilter,
  getDefaultIntelRange,
} from "@/lib/actions/admin/business-intel";
import {
  getBusinessFinancialsSummary,
  getBusinessInventorySummary,
} from "@/lib/actions/admin/business-operations";
import { listBusinessNotes } from "@/lib/actions/admin/business-notes";
import type {
  AdminBusinessDetail,
  AdminLocationListItem,
  AdminStoreListItem,
  AdminWarehouseListItem,
} from "@/types/admin/business";
import type {
  InvoicePage,
  SubscriptionResponse,
} from "@/types/admin/billing";
import type {
  BusinessCustomerSegmentRow,
  BusinessHealthSnapshot,
  BusinessLifecycleSnapshot,
  BusinessLocationBreakdownRow,
  BusinessOverviewSnapshot,
} from "@/types/admin/business-intel";
import type {
  AdminBusinessFinancialsSummary,
  AdminBusinessInventorySummary,
} from "@/types/admin/business-operations";
import type { BusinessNotePage } from "@/types/admin/business-note";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Business detail",
};

const READ_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "SUPPORT_AGENT",
];

interface BusinessDetailPageProps {
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

export default async function AdminBusinessDetailPage({
  params,
}: BusinessDetailPageProps) {
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
            title="Business detail"
            subtitle="You don't have permission to view this page."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const canBilling = role === "SYSTEM_ADMIN" || role === "SUPPORT_AGENT";
  const { id } = await params;

  let business: AdminBusinessDetail;
  try {
    business = await getAdminBusinessDetail(id);
  } catch (error: any) {
    if (error?.code === "NOT_FOUND" || error?.status === 404) {
      notFound();
    }
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader title="Business detail" />
          <PageBody>
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error?.message ?? "Failed to load business."}
            </p>
          </PageBody>
        </PageShell>
      </AdminShell>
    );
  }

  const { startDate, endDate } = await getDefaultIntelRange(30);

  // Parallel-fetch everything the staff needs in one view. Billing pulls
  // are gated to `canBilling`; analytics pulls run for all read-roles (the
  // Reports access guard bypasses for INTERNAL_* roles). Each settles
  // independently so one failing section never blanks the page.
  const results = await Promise.allSettled([
    listAdminBusinessLocations(id),
    canBilling ? getBusinessSubscription(id) : Promise.resolve(null),
    canBilling ? listBusinessInvoices(id, 0, 10) : Promise.resolve(null),
    getBusinessOverviewByFilter(id, "TODAY"),
    getBusinessOverviewByFilter(id, "LAST_7_DAYS"),
    getBusinessOverviewByFilter(id, "LAST_30_DAYS"),
    getBusinessHealth(id),
    getBusinessLifecycle(id),
    getBusinessLocationBreakdown(id, startDate, endDate),
    getBusinessCustomerSegments(id),
    getBusinessInventorySummary(id),
    getBusinessFinancialsSummary(id, startDate, endDate),
    listBusinessNotes(id, 0, 50),
    listAdminBusinessWarehouses(id),
    listAdminBusinessStores(id),
  ]);

  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;

  const locations = (value(results[0]) ?? []) as AdminLocationListItem[];
  const subscription = value(results[1]) as SubscriptionResponse | null;
  const invoices = value(results[2]) as InvoicePage | null;
  const overviewToday = value(results[3]) as BusinessOverviewSnapshot | null;
  const overview7d = value(results[4]) as BusinessOverviewSnapshot | null;
  const overview30d = value(results[5]) as BusinessOverviewSnapshot | null;
  const health = value(results[6]) as BusinessHealthSnapshot | null;
  const lifecycle = value(results[7]) as BusinessLifecycleSnapshot | null;
  const locationBreakdown = (value(results[8]) ??
    []) as BusinessLocationBreakdownRow[];
  const customerSegments = (value(results[9]) ??
    []) as BusinessCustomerSegmentRow[];
  const inventory = value(results[10]) as AdminBusinessInventorySummary | null;
  const financials = value(results[11]) as AdminBusinessFinancialsSummary | null;
  const notesPage = value(results[12]) as BusinessNotePage | null;
  const warehouses = (value(results[13]) ?? []) as AdminWarehouseListItem[];
  const stores = (value(results[14]) ?? []) as AdminStoreListItem[];

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Businesses", href: "/businesses" },
            { title: business.name },
          ]}
        />
        <BusinessDetailView
          business={business}
          locations={locations}
          warehouses={warehouses}
          stores={stores}
          subscription={subscription}
          invoices={invoices}
          overviewToday={overviewToday}
          overview7d={overview7d}
          overview30d={overview30d}
          health={health}
          lifecycle={lifecycle}
          locationBreakdown={locationBreakdown}
          customerSegments={customerSegments}
          inventory={inventory}
          financials={financials}
          notesPage={notesPage}
          rangeLabel={`${shortDay(startDate)} → ${shortDay(endDate)}`}
          canBilling={canBilling}
          currentUserId={token.userId ?? null}
          currentUserRole={token.internalRole ?? null}
        />
      </PageShell>
    </AdminShell>
  );
}

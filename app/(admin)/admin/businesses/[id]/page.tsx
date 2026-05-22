import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  ExternalLink,
  MapPin,
} from "lucide-react";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BusinessCreditPanel } from "@/components/admin/business-credit-panel";
import { BusinessCustomerSegments } from "@/components/admin/business-customer-segments";
import { BusinessLocationPerformance } from "@/components/admin/business-location-performance";
import { BusinessLocationsPanel } from "@/components/admin/business-locations-panel";
import { BusinessNotesPanel } from "@/components/admin/business-notes-panel";
import { BusinessOperationsPanel } from "@/components/admin/business-operations-panel";
import { BusinessRevenuePanel } from "@/components/admin/business-revenue-panel";
import { BusinessSubscriptionPanel } from "@/components/admin/business-subscription-panel";
import { getStaffAuthToken } from "@/lib/auth-utils";
import {
  getAdminBusinessDetail,
  listAdminBusinessLocations,
} from "@/lib/actions/admin/businesses";
import {
  getBusinessSubscription,
  listBusinessActiveDiscounts,
  listBusinessInvoices,
} from "@/lib/actions/admin/billing";
import {
  getBusinessCustomerSegments,
  getBusinessHealth,
  getBusinessLifecycle,
  getBusinessLocationBreakdown,
  getBusinessOverview,
  getBusinessOverviewByFilter,
  getBusinessTrends,
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
} from "@/types/admin/business";
import type {
  InvoicePage,
  SubscriptionDiscountResponse,
  SubscriptionResponse,
} from "@/types/admin/billing";
import type {
  BusinessCustomerSegmentRow,
  BusinessDailyTrendRow,
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

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function Info({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono
            ? "break-all font-mono text-[12px] text-ink"
            : "break-words text-[13px] text-ink"
        }
      >
        {value ?? "—"}
      </p>
    </div>
  );
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
  // are gated to `canBilling`; analytics pulls run for all read-roles
  // since the Reports Service access guard bypasses for INTERNAL_* roles.
  const results = await Promise.allSettled([
    listAdminBusinessLocations(id),
    canBilling ? getBusinessSubscription(id) : Promise.resolve(null),
    canBilling
      ? listBusinessInvoices(id, 0, 10)
      : Promise.resolve(null),
    canBilling
      ? listBusinessActiveDiscounts(id)
      : Promise.resolve([] as SubscriptionDiscountResponse[]),
    // Reports Service per-business intel
    getBusinessOverview(id, startDate, endDate),
    getBusinessOverviewByFilter(id, "TODAY"),
    getBusinessOverviewByFilter(id, "LAST_7_DAYS"),
    getBusinessTrends(id, startDate, endDate),
    getBusinessHealth(id),
    getBusinessLifecycle(id),
    getBusinessLocationBreakdown(id, startDate, endDate),
    getBusinessCustomerSegments(id),
    // Inventory + accounting cross-tenant summaries
    getBusinessInventorySummary(id),
    getBusinessFinancialsSummary(id, startDate, endDate),
    // Staff case notes
    listBusinessNotes(id, 0, 50),
  ]);

  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;
  const errorMessage = (r: PromiseSettledResult<unknown>): string | null =>
    r.status === "rejected"
      ? r.reason instanceof Error
        ? r.reason.message
        : String(r.reason)
      : null;

  const locations = (value(results[0]) ?? []) as AdminLocationListItem[];
  const subscription = value(results[1]) as SubscriptionResponse | null;
  const invoices = value(results[2]) as InvoicePage | null;
  const activeDiscounts = (value(results[3]) ??
    []) as SubscriptionDiscountResponse[];

  const overview30d = value(results[4]) as BusinessOverviewSnapshot | null;
  const overviewToday = value(results[5]) as BusinessOverviewSnapshot | null;
  const overview7d = value(results[6]) as BusinessOverviewSnapshot | null;
  const trends30d = (value(results[7]) ?? []) as BusinessDailyTrendRow[];
  const health = value(results[8]) as BusinessHealthSnapshot | null;
  const lifecycle = value(results[9]) as BusinessLifecycleSnapshot | null;
  const locationBreakdown = (value(results[10]) ??
    []) as BusinessLocationBreakdownRow[];
  const customerSegments = (value(results[11]) ??
    []) as BusinessCustomerSegmentRow[];
  const inventorySummary = value(results[12]) as AdminBusinessInventorySummary | null;
  const financialsSummary = value(results[13]) as AdminBusinessFinancialsSummary | null;
  const notesPage = value(results[14]) as BusinessNotePage | null;

  const locationsError = errorMessage(results[0]);
  const subscriptionError = errorMessage(results[1]);
  const invoicesError = errorMessage(results[2]);
  const discountsError = errorMessage(results[3]);
  const overview30dError = errorMessage(results[4]);
  const overviewTodayError = errorMessage(results[5]);
  const overview7dError = errorMessage(results[6]);
  const trends30dError = errorMessage(results[7]);
  const healthError = errorMessage(results[8]);
  const lifecycleError = errorMessage(results[9]);
  const locationBreakdownError = errorMessage(results[10]);
  const customerSegmentsError = errorMessage(results[11]);
  const inventoryError = errorMessage(results[12]);
  const financialsError = errorMessage(results[13]);
  const notesError = errorMessage(results[14]);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Businesses", href: "/businesses" },
            { title: business.name },
          ]}
        />
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              {business.name}
              <Badge
                variant="outline"
                className={
                  business.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                }
              >
                {business.active ? "Active" : "Inactive"}
              </Badge>
            </span>
          }
          subtitle={
            <span className="font-mono text-[12px]">
              {business.identifier} · {business.slug} · {business.baseCurrency}
            </span>
          }
          actions={
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/businesses">
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back
                </Link>
              </Button>
              {canBilling && (
                <Button asChild size="sm">
                  <Link href={`/businesses/${business.id}/billing`}>
                    <CreditCard className="mr-1.5 h-4 w-4" />
                    Manage billing
                  </Link>
                </Button>
              )}
            </>
          }
        />

        <PageBody>
          {/* Credit-readiness signal (health + lifecycle) */}
          <BusinessCreditPanel
            health={health}
            lifecycle={lifecycle}
            errors={{
              health: healthError,
              lifecycle: lifecycleError,
            }}
          />

          {/* Staff case notes */}
          <BusinessNotesPanel
            businessId={business.id}
            initialPage={notesPage}
            error={notesError}
            currentUserId={token.userId ?? null}
            currentUserRole={token.internalRole ?? null}
          />

          {/* Inventory + financial operations (credit-scoring signals) */}
          <BusinessOperationsPanel
            inventory={inventorySummary}
            financials={financialsSummary}
            currency={business.baseCurrency}
            errors={{
              inventory: inventoryError,
              financials: financialsError,
            }}
          />

          {/* Revenue + trend chart */}
          <BusinessRevenuePanel
            overview30d={overview30d}
            overviewToday={overviewToday}
            overview7d={overview7d}
            trends30d={trends30d}
            errors={{
              overview30d: overview30dError,
              overviewToday: overviewTodayError,
              overview7d: overview7dError,
              trends30d: trends30dError,
            }}
            currency={business.baseCurrency}
          />

          {/* Per-location performance breakdown */}
          <BusinessLocationPerformance
            rows={locationBreakdown}
            currency={business.baseCurrency}
            error={locationBreakdownError}
          />

          {/* Customer segments (RFM) */}
          <BusinessCustomerSegments
            segments={customerSegments}
            currency={business.baseCurrency}
            error={customerSegmentsError}
          />

          {/* Owner / Account */}
          <div className="rounded-lg border border-line bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Owning account</h3>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/accounts/${business.accountId}`}>
                  Full account
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Info
                label="Owner"
                value={business.accountFullName}
                mono={false}
              />
              <Info label="Email" value={business.accountEmail} />
              <Info label="Phone" value={business.accountPhoneNumber} />
              <Info label="Account #" value={business.accountNumber} />
              <Info
                label="Account status"
                value={
                  <Badge
                    variant="outline"
                    className={
                      business.accountActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                        : "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                    }
                  >
                    {business.accountActive ? "Active" : "Inactive"}
                  </Badge>
                }
              />
              <Info label="Account ID" value={business.accountId} mono />
            </div>
          </div>

          {/* Subscription + invoices */}
          {canBilling && (
            <BusinessSubscriptionPanel
              businessId={business.id}
              subscription={subscription}
              invoices={invoices}
              activeDiscounts={activeDiscounts}
              errors={{
                subscription: subscriptionError,
                invoices: invoicesError,
                discounts: discountsError,
              }}
            />
          )}

          {/* Locations */}
          <BusinessLocationsPanel
            locations={locations}
            error={locationsError}
            activeCount={business.activeLocationCount}
            totalCount={business.locationCount}
          />

          {/* Business profile */}
          <div className="grid gap-6 rounded-lg border border-line bg-card p-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <Info label="Name" value={business.name} mono={false} />
                <Info label="Identifier" value={business.identifier} />
                <Info label="Slug" value={business.slug} />
                <Info label="Base currency" value={business.baseCurrency} />
                <Info label="Phone" value={business.phoneNumber} />
                <Info label="Email" value={business.email} />
                <Info label="Website" value={business.website} mono={false} />
              </div>
              {business.description && (
                <Info
                  label="Description"
                  value={business.description}
                  mono={false}
                />
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-ink">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  Address & country
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Info
                  label="Country"
                  value={
                    business.countryName ?? business.countryCode ?? "—"
                  }
                  mono={false}
                />
                <Info label="Region" value={business.region} mono={false} />
                <Info label="District" value={business.district} mono={false} />
                <Info label="Ward" value={business.ward} mono={false} />
                <Info label="Postal code" value={business.postalCode} />
                <Info label="Address" value={business.address} mono={false} />
              </div>

              <h3 className="pt-2 text-sm font-semibold text-ink">Timestamps</h3>
              <div className="grid grid-cols-2 gap-4">
                <Info label="Created" value={formatDate(business.createdAt)} />
                <Info label="Updated" value={formatDate(business.updatedAt)} />
              </div>
            </div>
          </div>
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

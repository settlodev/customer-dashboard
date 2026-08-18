import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { Badge } from "@/components/ui/badge";
import {
  StatusBreakdownPanel,
  WhitelabelBreakdownPanel,
} from "@/components/admin/catalog/package-detail/breakdown-panels";
import { ComparisonChart } from "@/components/admin/catalog/package-detail/comparison-chart";
import { DateFilterBar } from "@/components/admin/catalog/package-detail/date-filter-bar";
import { ForecastCard } from "@/components/admin/catalog/package-detail/forecast-card";
import { KpiGrid } from "@/components/admin/catalog/package-detail/kpi-grid";
import { PackageDetailActions } from "@/components/admin/catalog/package-detail/package-detail-actions";
import {
  PackageCreditsPanel,
  PackageFeaturesPanel,
  PackageWhitelabelPanel,
} from "@/components/admin/catalog/package-detail/package-overview-panels";
import {
  PackageAddonsPanel,
  PackageHistoryPanel,
  PackageMetadataPanel,
  PricePositionPanel,
  PricingBillingPanel,
} from "@/components/admin/catalog/package-detail/package-billing-panels";
import { PackageSubscribersTable } from "@/components/admin/catalog/package-detail/package-subscribers-table";

import { getStaffAuthToken } from "@/lib/auth-utils";
import { hasInternalPermission, PERM } from "@/lib/admin/permissions";
import {
  getBillingConfig,
  getPackage,
  getPackageBreakdown,
  getPackageHistory,
  listAddons,
  listPackageFeatures,
  listPackageIncludedCredits,
  listPackages,
  listWhitelabelPackagePrices,
} from "@/lib/actions/admin/billing";
import {
  getPackageAnalytics,
  getPackageForecast,
  listPackageSubscribers,
} from "@/lib/actions/admin/package-analytics";
import { listWhitelabels } from "@/lib/actions/admin/whitelabels";
import {
  listInternalStaffProfiles,
  listInternalUsers,
} from "@/lib/actions/admin/internal-users";
import { buildActorNameMap } from "@/lib/admin/actor-names";
import type {
  PackageComparisonMode,
  PackageDateRange,
  PackageResponse,
  WhitelabelSummary,
} from "@/types/admin/billing";

interface PackageDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    compare?: string;
  }>;
}

export const metadata = {
  title: "Package detail",
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function defaultRange(): PackageDateRange {
  const to = todayIso();
  return { from: addDays(to, -29), to };
}

function parseRange(
  from: string | undefined,
  to: string | undefined,
): PackageDateRange {
  if (from && to && ISO_DAY.test(from) && ISO_DAY.test(to) && from <= to) {
    return { from, to };
  }
  return defaultRange();
}

function parseComparison(value: string | undefined): PackageComparisonMode {
  if (
    value === "previous_period" ||
    value === "previous_year" ||
    value === "none"
  ) {
    return value;
  }
  return "previous_period";
}

export default async function AdminPackageDetailPage({
  params,
  searchParams,
}: PackageDetailPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const canManage = hasInternalPermission(token, PERM.ACCOUNTS_MANAGE);
  if (!canManage) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Package detail"
            subtitle="Restricted to System Admins and Super Admins."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { id } = await params;
  const { from, to, compare } = await searchParams;
  const range = parseRange(from, to);
  const comparisonMode = parseComparison(compare);

  let pkg: PackageResponse;
  try {
    pkg = await getPackage(id);
  } catch {
    notFound();
  }

  const [
    features,
    credits,
    whitelabels,
    analytics,
    forecast,
    breakdown,
    billingConfig,
    history,
    subscribers,
    allPackages,
    addons,
    internalUsers,
    staffProfiles,
  ] = await Promise.all([
    safeList(() => listPackageFeatures(id)),
    safeList(() => listPackageIncludedCredits(id)),
    safeList(() => listWhitelabels()),
    getPackageAnalytics(id, pkg.basePrice, range, comparisonMode),
    getPackageForecast(id, pkg.basePrice, "linear", 90),
    safeOne(() => getPackageBreakdown(id)),
    safeOne(() => getBillingConfig()),
    safeList(() => getPackageHistory(id)),
    listPackageSubscribers(id),
    safeList(() => listPackages(pkg.entityType)),
    safeList(() => listAddons()),
    safeList(() => listInternalUsers()),
    safeList(() => listInternalStaffProfiles()),
  ]);

  const overrides = await collectWhitelabelOverrides(id, whitelabels);
  const actorNames = buildActorNameMap(internalUsers, staffProfiles);

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Packages", href: "/packages" },
            { title: pkg.name },
          ]}
        />

        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              {pkg.name}
              <Badge
                variant="outline"
                className={
                  pkg.isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                    : "border-muted bg-muted text-muted-foreground"
                }
              >
                {pkg.isActive ? "Active" : "Deactivated"}
              </Badge>
              <Badge
                variant="outline"
                className="border-muted bg-muted text-muted-foreground font-mono text-[10.5px]"
              >
                {pkg.entityType}
              </Badge>
            </span>
          }
          subtitle={pkg.description ?? "No description set."}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/packages"
                className="inline-flex items-center gap-1 font-mono text-[11.5px] text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                All packages
              </Link>
              <PackageDetailActions pkg={pkg} />
            </div>
          }
        />

        <PageBody>
          {/* Date + comparison filters */}
          <DateFilterBar
            range={analytics.range}
            comparisonMode={comparisonMode}
            comparisonRange={analytics.comparison?.range ?? null}
          />

          {/* KPI strip */}
          <KpiGrid analytics={analytics} />

          {/* Time-series charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ComparisonChart
              title="Active subscribers"
              hint="Daily snapshot across the selected range."
              primary={analytics.subscribersTimeline}
              comparison={analytics.comparison?.subscribersTimeline}
              isLive={analytics.isLive}
              variant="line"
              summaryStat="average"
            />
            <ComparisonChart
              title="Revenue"
              hint="Invoices billed under this package, by day."
              primary={analytics.revenueTimeline}
              comparison={analytics.comparison?.revenueTimeline}
              isLive={analytics.isLive}
              variant="area"
            />
          </div>

          {/* Breakdowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <StatusBreakdownPanel
              rows={analytics.byStatus}
              isLive={analytics.isLive}
            />
            <WhitelabelBreakdownPanel
              rows={analytics.byWhitelabel}
              isLive={analytics.isLive}
            />
          </div>

          {/* Pricing & billing (Billing service) */}
          <PricingBillingPanel
            pkg={pkg}
            breakdown={breakdown}
            config={billingConfig}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <PackageAddonsPanel addons={addons} entityType={pkg.entityType} />
            <PricePositionPanel packages={allPackages} current={pkg} />
          </div>

          {/* Subscribers on this plan (Reports service) */}
          <PackageSubscribersTable subscribers={subscribers} />

          {/* Catalog configuration */}
          <div className="grid gap-4 lg:grid-cols-3">
            <PackageFeaturesPanel mappings={features} />
            <PackageCreditsPanel credits={credits} />
            <PackageWhitelabelPanel
              basePrice={pkg.basePrice}
              overrides={overrides}
            />
          </div>

          {/* Metadata + change history (Billing service) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <PackageMetadataPanel
              pkg={pkg}
              history={history}
              actorNames={actorNames}
            />
            <PackageHistoryPanel history={history} actorNames={actorNames} />
          </div>

          {/* Forecast */}
          <ForecastCard
            packageId={pkg.id}
            basePrice={pkg.basePrice}
            initial={forecast}
          />
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

async function safeList<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

async function safeOne<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Resolve per-whitelabel overrides for a single package by fanning out
 * across every whitelabel and filtering each list response to the
 * matching package. The billing service doesn't (yet) expose a
 * "find every override for package X" endpoint — until it does, this
 * keeps the detail page working without a backend change. Failures
 * are swallowed per whitelabel so one bad tenant doesn't take the
 * whole panel down.
 */
async function collectWhitelabelOverrides(
  packageId: string,
  whitelabels: WhitelabelSummary[],
): Promise<{ whitelabel: WhitelabelSummary; price: number }[]> {
  const results = await Promise.all(
    whitelabels.map(async (w) => {
      try {
        const prices = await listWhitelabelPackagePrices(w.id);
        const match = prices.find((p) => p.packageId === packageId);
        if (!match) return null;
        return { whitelabel: w, price: match.basePrice };
      } catch {
        return null;
      }
    }),
  );
  return results.filter(
    (r): r is { whitelabel: WhitelabelSummary; price: number } => r !== null,
  );
}

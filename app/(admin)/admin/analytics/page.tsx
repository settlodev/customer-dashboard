import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layouts/admin-shell";
import {
  PageBody,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import { AnalyticsTabs } from "@/components/admin/analytics/analytics-tabs";
import { getStaffAuthToken } from "@/lib/auth-utils";
import {
  getActivationFunnel,
  getBillingRetentionCohorts,
  getChurnPredictions,
  getChurnSummary,
  getDefaultRange,
  getEngagement,
  getLatestEngagement,
  getLatestMrr,
  getMrrMovements,
  getRetentionCohorts,
  getTrialConversion,
} from "@/lib/actions/admin/analytics";
import type { InternalRole } from "@/types/types";

export const metadata = {
  title: "Analytics",
};

// SaaS analytics is platform-wide (no per-account dimension), so it's not shown
// to sales reps, whose admin views are scoped to their assigned accounts.
const STATS_ROLES: InternalRole[] = [
  "SYSTEM_ADMIN",
  "SUPER_ADMIN",
  "BOARD_MEMBER",
];

interface AnalyticsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const token = await getStaffAuthToken();
  if (!token?.accessToken) {
    redirect("/login");
  }

  const role = token.internalRole;
  const canRead = role ? STATS_ROLES.includes(role) : false;
  const canRecompute = role === "SYSTEM_ADMIN" || role === "SUPER_ADMIN";

  if (!canRead) {
    return (
      <AdminShell token={token}>
        <PageShell>
          <PageHeader
            title="Analytics"
            subtitle="You don't have permission to view SaaS analytics."
          />
        </PageShell>
      </AdminShell>
    );
  }

  const { startDate, endDate } = await getDefaultRange(180);
  const { tab } = await searchParams;

  const results = await Promise.allSettled([
    getMrrMovements(startDate, endDate),
    getLatestMrr(),
    getRetentionCohorts(12),
    getBillingRetentionCohorts(12),
    getChurnPredictions("HIGH", 100),
    getChurnSummary(),
    getEngagement(startDate, endDate),
    getLatestEngagement(),
    getActivationFunnel(12),
    getTrialConversion(),
  ]);

  const [
    mrrMovements,
    latestMrr,
    retentionCohorts,
    billingRetentionCohorts,
    churnPredictions,
    churnSummary,
    engagement,
    latestEngagement,
    activationCohorts,
    trialConversion,
  ] = results;

  const value = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === "fulfilled" ? r.value : null;
  const errorMessage = (
    r: PromiseSettledResult<unknown>,
  ): string | null =>
    r.status === "rejected"
      ? (r.reason instanceof Error ? r.reason.message : String(r.reason))
      : null;

  const errorMessages = results
    .map((r) => errorMessage(r))
    .filter((m): m is string => Boolean(m));
  const fatalError =
    errorMessages.length === results.length
      ? errorMessages[0] ?? "Failed to load analytics."
      : null;

  return (
    <AdminShell token={token}>
      <PageShell>
        <PageHeader
          title="SaaS Analytics"
          subtitle={`Platform-wide metrics from the Reports Service · ${startDate} → ${endDate}`}
        />
        <PageBody>
          {fatalError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {fatalError}
            </p>
          ) : (
            <AnalyticsTabs
              initialTab={tab}
              dateRange={{ startDate, endDate }}
              canRecompute={canRecompute}
              data={{
                mrrMovements: value(mrrMovements) ?? [],
                latestMrr: value(latestMrr),
                retentionCohorts: value(retentionCohorts) ?? [],
                billingRetentionCohorts: value(billingRetentionCohorts) ?? [],
                churnPredictions: value(churnPredictions) ?? [],
                churnSummary: value(churnSummary),
                engagement: value(engagement) ?? [],
                latestEngagement: value(latestEngagement),
                activationCohorts: value(activationCohorts) ?? [],
                trialConversion: value(trialConversion) ?? [],
              }}
              errors={{
                mrrMovements: errorMessage(mrrMovements),
                latestMrr: errorMessage(latestMrr),
                retentionCohorts: errorMessage(retentionCohorts),
                billingRetentionCohorts: errorMessage(billingRetentionCohorts),
                churnPredictions: errorMessage(churnPredictions),
                churnSummary: errorMessage(churnSummary),
                engagement: errorMessage(engagement),
                latestEngagement: errorMessage(latestEngagement),
                activationCohorts: errorMessage(activationCohorts),
                trialConversion: errorMessage(trialConversion),
              }}
            />
          )}
        </PageBody>
      </PageShell>
    </AdminShell>
  );
}

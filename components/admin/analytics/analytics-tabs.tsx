"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { MrrSection } from "@/components/admin/analytics/mrr-section";
import { RetentionSection } from "@/components/admin/analytics/retention-section";
import { ChurnSection } from "@/components/admin/analytics/churn-section";
import { EngagementSection } from "@/components/admin/analytics/engagement-section";

import {
  ActivationCohort,
  BillingRetentionCohortCell,
  ChurnPrediction,
  ChurnSummary,
  EngagementSnapshot,
  MrrMovement,
  RetentionCohortCell,
  TrialConversionRow,
} from "@/types/admin/analytics";

interface AnalyticsTabsProps {
  initialTab?: string;
  dateRange: { startDate: string; endDate: string };
  canRecompute: boolean;
  data: {
    mrrMovements: MrrMovement[];
    latestMrr: MrrMovement | null;
    retentionCohorts: RetentionCohortCell[];
    billingRetentionCohorts: BillingRetentionCohortCell[];
    churnPredictions: ChurnPrediction[];
    churnSummary: ChurnSummary | null;
    engagement: EngagementSnapshot[];
    latestEngagement: EngagementSnapshot | null;
    activationCohorts: ActivationCohort[];
    trialConversion: TrialConversionRow[];
  };
  errors: Record<string, string | null>;
}

function toBillingCohortCells(
  cells: BillingRetentionCohortCell[],
): RetentionCohortCell[] {
  return cells.map((c) => ({
    cohort_month: c.cohort_month,
    months_since_signup: c.months_since_signup,
    cohort_size: c.cohort_size,
    active_businesses: c.active_businesses,
    retention_rate: c.retention_rate,
    orders_in_period: c.invoices_in_period,
    revenue_in_period: c.revenue_in_period,
    arpa_in_period: c.arpa_in_period,
    computed_at: "",
    ver: 0,
  }));
}

const TABS = ["mrr", "retention", "churn", "engagement"] as const;
type TabKey = (typeof TABS)[number];

export function AnalyticsTabs({
  initialTab,
  dateRange,
  canRecompute,
  data,
  errors,
}: AnalyticsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: TabKey = TABS.includes(initialTab as TabKey)
    ? (initialTab as TabKey)
    : "mrr";

  const handleChange = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "mrr") next.delete("tab");
    else next.set("tab", value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleChange} className="space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto md:w-fit">
        <TabsTrigger value="mrr">MRR / ARR</TabsTrigger>
        <TabsTrigger value="retention">Retention</TabsTrigger>
        <TabsTrigger value="churn">Churn risk</TabsTrigger>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
      </TabsList>

      <TabsContent value="mrr" className="space-y-6">
        <MrrSection
          movements={data.mrrMovements}
          latest={data.latestMrr}
          dateRange={dateRange}
          canRecompute={canRecompute}
          error={errors.mrrMovements ?? errors.latestMrr}
        />
      </TabsContent>

      <TabsContent value="retention" className="space-y-6">
        <RetentionSection
          cohorts={data.retentionCohorts}
          canRecompute={canRecompute}
          error={errors.retentionCohorts}
        />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">
            Billing retention (paid invoices)
          </h3>
          <RetentionSection
            cohorts={toBillingCohortCells(data.billingRetentionCohorts)}
            canRecompute={false}
            error={errors.billingRetentionCohorts ?? null}
          />
        </div>
      </TabsContent>

      <TabsContent value="churn" className="space-y-6">
        <ChurnSection
          summary={data.churnSummary}
          predictions={data.churnPredictions}
          canRecompute={canRecompute}
          error={errors.churnSummary ?? errors.churnPredictions}
        />
      </TabsContent>

      <TabsContent value="engagement" className="space-y-6">
        <EngagementSection
          series={data.engagement}
          latest={data.latestEngagement}
          activationCohorts={data.activationCohorts}
          trialConversion={data.trialConversion}
          canRecompute={canRecompute}
          error={
            errors.engagement ??
            errors.activationCohorts ??
            errors.trialConversion
          }
        />
      </TabsContent>
    </Tabs>
  );
}

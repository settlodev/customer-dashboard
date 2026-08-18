import type { PlanTier } from "@/components/admin/shared/plan-badge";
import type { DeltaTone } from "@/components/admin/shared/metric-card";

/**
 * Shapes for the admin dashboard overview. The backend analytics endpoints
 * that feed most of these (revenue, GMV, billing, platform health, activity)
 * are not live yet — see `lib/actions/admin/dashboard-overview.ts`, which
 * returns a stubbed `DashboardOverview` with `isLive: false`. The account /
 * business / location counts are sourced from the real platform-stats
 * endpoint and overlaid on top of the stub in the page.
 */

export interface HeadlineMetric {
  key: string;
  label: string;
  /** Small currency prefix (e.g. "TZS"). */
  currency?: string;
  /** Pre-formatted magnitude, e.g. "3.64". */
  value: string;
  /** Muted unit after the value, e.g. "M", "%". */
  suffix?: string;
  delta?: { value: string; tone: DeltaTone };
  /** Series for the inline sparkline (mutually exclusive with footNote). */
  spark?: number[];
  footNote?: string;
}

export interface StatStripItem {
  label: string;
  value: string;
  /** Small trailing note, e.g. "+2 30d" or "0 churned". */
  sub?: string;
  subTone?: "pos" | "muted";
}

export interface FunnelStage {
  key: string;
  label: string;
  /** Optional small mono qualifier after the label, e.g. "· billable". */
  qualifier?: string;
  count: number;
  pct: number; // 0–100
  color: string; // CSS colour for the fill + dot
  note: string;
  noteTone: "warn" | "ok" | "dim";
}

export interface OnboardingFunnel {
  stages: FunnelStage[];
  /** One-line summary of stalled accounts under the funnel. */
  summary: string;
}

export type RevenueSeriesKey = "mrr" | "gmv" | "accounts";

export interface RevenueSeries {
  key: RevenueSeriesKey;
  label: string;
  currency?: string;
  /** Pre-formatted headline value, e.g. "3.64M". */
  headlineValue: string;
  delta: { value: string; tone: DeltaTone };
  caption: string;
  points: { label: string; value: number }[];
  valueKind: "currency" | "count";
}

export interface PlanMixItem {
  tier: PlanTier;
  label: string;
  /** Entity type (e.g. "LOCATION", "WAREHOUSE", "STORE"). */
  entityType: string;
  /** Businesses currently on this package. */
  businesses: number;
  /** Paying entities (ACTIVE/PAST_DUE). */
  activeCount: number;
  /** Total subscription items across all entities for this package. */
  itemCount: number;
  /** Pre-formatted MRR contribution, e.g. "TZS 1.50M". */
  mrrLabel: string;
  /** Share of the mix by business count (so bars are meaningful pre-revenue). */
  pct: number;
  color: string;
}

export interface TrialPipelineItem {
  id: string;
  name: string;
  meta: string;
  daysLabel: string;
  tone: "pos" | "warn" | "neg";
  avatarColor: string;
}

export interface RegionItem {
  name: string;
  count: number;
  pct: number;
}

export type BillingLineTone = "warn" | "neg" | "pos" | "muted";

export interface BillingSummary {
  collectedLabel: string;
  collectedCaption: string;
  lines: {
    label: string;
    value: string;
    tone: BillingLineTone;
    dotColor: string;
  }[];
}

export type PlatformHealthKind =
  | "uptime"
  | "latency"
  | "transactions"
  | "terminals";

export interface PlatformHealthItem {
  kind: PlatformHealthKind;
  label: string;
  value: string;
  /** Tint the value (e.g. "pos" for healthy). */
  valueTone?: "pos" | "default";
  /** Show a leading health dot of this colour next to the value. */
  healthDot?: string;
}

export interface SupportSummaryItem {
  label: string;
  value: string;
  valueTone?: "pos" | "default";
}

export type TopBusinessStatusTone = "pos" | "warn";

export interface TopBusinessRow {
  id: string;
  name: string;
  locations: string;
  region: string;
  tier: PlanTier;
  planLabel: string;
  gmvLabel: string;
  mrrLabel: string;
  statusLabel: string;
  statusTone: TopBusinessStatusTone;
  avatarColor: string;
}

export type ActivityKind =
  | "signup"
  | "upgrade"
  | "payment"
  | "business"
  | "failed"
  | "refund";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Bold lead entity rendered before the rest of the text. */
  lead?: string;
  text: string;
  time: string;
  amount?: string;
  amountTone?: "pos" | "neg" | "dim";
}

/**
 * Section keys that can independently fail to load. They mirror the backend
 * `errors[]` from the fault-isolated `/overview` endpoint; the UI renders a
 * "couldn't load" card for each one instead of fabricated data.
 */
export type DashboardSectionKey =
  | "revenue"
  | "stats"
  | "funnel"
  | "revenueSeries"
  | "planMix"
  | "trials"
  | "regions"
  | "billing"
  | "platform"
  | "topBusinesses"
  | "activity";

export interface DashboardOverview {
  /** Section keys that couldn't be loaded from the Reports Service. */
  errored: DashboardSectionKey[];
  generatedAt: string;
  headline: HeadlineMetric[];
  stats: StatStripItem[];
  funnel: OnboardingFunnel;
  revenue: RevenueSeries[];
  mrrByEntityType: { name: string; value: number }[];
  planMix: { caption: string; items: PlanMixItem[] };
  trials: TrialPipelineItem[];
  regions: { caption: string; items: RegionItem[] };
  billing: BillingSummary;
  platformHealth: PlatformHealthItem[];
  support: SupportSummaryItem[];
  topBusinesses: TopBusinessRow[];
  activity: ActivityItem[];
}

// ─────────────────────────────────────────────────────────────────────
// Backend contract — the raw JSON returned by the Reports Service
// `GET /api/v2/internal/metrics/dashboard/overview` endpoint. Mapped into
// the UI `DashboardOverview` above by `lib/actions/admin/dashboard-overview.ts`.
// Numbers come through as JSON numbers; dates as ISO strings.
// ─────────────────────────────────────────────────────────────────────

export interface DashboardOverviewResponse {
  generatedAt: string;
  /** Section names the backend couldn't compute (fault-isolated per section). */
  errors?: string[];
  revenue: {
    mrr: number;
    mrrPrev: number;
    arr: number;
    gmv: number;
    gmvPrev: number;
    nrr: number | null;
    payingCustomers: number;
    mrrByEntityType: { entity_type: string; mrr: number }[];
  };
  stats: {
    totalAccounts: number;
    activeAccounts: number;
    newAccounts30d: number;
    totalBusinesses: number;
    activeBusinesses: number;
    newBusinesses30d: number;
    totalLocations: number;
    activeLocations: number;
    payingLocations: number;
    newLocations30d: number;
    openTrials: number;
    trialConversionRate: number | null;
    arpl: number;
  };
  funnel: {
    accountsCreated: number;
    emailVerified: number;
    businessCreated: number;
    locationLive: number;
  };
  revenueSeries: {
    mrr: { month: string; mrr?: number; gmv?: number }[];
    gmv: { month: string; mrr?: number; gmv?: number }[];
    accounts: { month: string; c?: number }[];
  };
  planMix: {
    plan_name: string | null;
    entity_type: string;
    tier: string | null;
    business_count: number;
    item_count: number;
    active_count: number;
    mrr: number;
  }[];
  trials: {
    business_id: string;
    business_name: string | null;
    region: string | null;
    package_name: string | null;
    trial_end_date: string | null;
    days_left: number;
  }[];
  regions: { region: string; count: number }[];
  billing: {
    collected: number;
    collectionRate: number;
    outstanding: number;
    pastDue: number;
    pastDueCount: number;
    failedCount: number;
    refunds: number;
    refundCount: number;
    renewals7dCount: number;
  };
  platform: {
    transactionsToday: number;
    activeTerminals: number;
    totalTerminals: number;
  };
  topBusinesses: {
    business_id: string;
    business_name: string;
    region: string | null;
    current_package_name: string | null;
    total_revenue: number;
    total_orders: number;
    lifecycle_stage: string;
    days_since_last_order: number;
  }[];
  activity: {
    kind: string;
    business_id: string;
    business_name: string | null;
    ts: string;
    amount: number | null;
    event_type: string;
  }[];
}

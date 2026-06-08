import type { DefTone } from "@/components/admin/shared/def-list";
import type { PlanTier } from "@/components/admin/shared/plan-badge";

/**
 * Commercial / health / support context layered on top of the real account
 * record on the detail screen. The backend endpoints for subscription,
 * billing, engagement, support and the businesses→locations tree are not
 * wired yet, so `lib/actions/admin/account-insights.ts` returns a stubbed
 * `AccountInsights` (`isLive: false`). Identity, profile, geography and
 * timestamps still come from the real `AdminAccountDetail`.
 */

export interface AttentionBanner {
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface AccountLifecycle {
  /** e.g. "New customer". */
  stage: string;
  /** e.g. "Web signup · organic". */
  source: string;
  avatarLabel: string;
  avatarColor: string;
}

export interface AccountKpis {
  payingLocations: { count: number; setupNote?: string };
  subscriptionPlan: string;
  subscriptionStatus?: string;
  mrr: { currency: string; value: string };
  gmv: { currency: string; value: string; note?: string };
}

export interface AccountLocationNode {
  id: string;
  name: string;
  code: string;
  region: string;
  terminals: string;
  planTier: PlanTier;
  planLabel: string;
  trialLabel?: string;
}

export interface AccountBusinessNode {
  id: string;
  name: string;
  code: string;
  industry: string;
  locationCount: number;
  statusLabel: string;
  statusTone: "pos" | "warn" | "neg";
  avatarColor: string;
  locations: AccountLocationNode[];
}

/**
 * Account-level billing ROLLUP. An account is the human owner — it is not
 * billed. Each billable unit (location / warehouse / store) carries its own
 * subscription, and invoices are issued per business. So at the account
 * level we aggregate, never show a single plan. (Today only locations are
 * counted; warehouses + stores are added once Reports/Billing surface them.)
 */
export interface AccountBillingRollup {
  billableUnits: number;
  /** Breakdown of billable units by entity type. */
  byType: { locations: number; warehouses: number; stores: number };
  activeSubscriptions: number;
  openTrials: number;
  mrr: { currency: string; value: string };
  /** Distinct plans across the account's units, e.g. [{label:"Growth",count:2}]. */
  planMix: { label: string; count: number }[];
  lifetimeBilled: { value: string; tone: DefTone };
  outstanding: { value: string; tone: DefTone };
  paymentMethod: { value: string; tone: DefTone };
}

export interface EngagementHealth {
  onboarding: { value: string; tone: DefTone };
  lastActive: string;
  firstSale: { value: string; tone: DefTone };
  terminals: string;
  staffUsers: string;
  healthScore: { value: number; max: number; note: string };
}

export interface AccountNote {
  id: string;
  author: string;
  text: string;
  at: string;
}

export interface SupportSuccess {
  openTickets: string;
  lastContact: { value: string; tone: DefTone };
  csat: { value: string; tone: DefTone };
  welcomeCall: { value: string; tone: DefTone };
  notes: AccountNote[];
}

export interface AccountTimelineEntry {
  text: string;
  time: string;
  dotColor: string;
}

export interface AccountInsights {
  /** False while the data pipeline is stubbed. */
  isLive: boolean;
  attentionBanner: AttentionBanner | null;
  lifecycle: AccountLifecycle;
  kpis: AccountKpis;
  businesses: {
    count: number;
    locationCount: number;
    items: AccountBusinessNode[];
  };
  billing: AccountBillingRollup;
  engagement: EngagementHealth;
  support: SupportSuccess;
  timeline: AccountTimelineEntry[];
}

// ─────────────────────────────────────────────────────────────────────
// Backend contract — raw JSON from the Reports Service
// `GET /api/v2/internal/metrics/accounts/{accountId}/insights`. Mapped into
// `AccountInsights` by `lib/actions/admin/account-insights.ts`.
// ─────────────────────────────────────────────────────────────────────

export interface AccountInsightsResponse {
  businesses: {
    businessId: string;
    name: string;
    region: string | null;
    industry: string | null;
    statusLabel: string;
    locationCount: number;
    locations: {
      locationId: string;
      name: string;
      region: string | null;
      terminals: number;
      planName: string | null;
      status: string | null;
      trialEndDate: string | null;
    }[];
  }[];
  kpis: {
    totalLocations: number;
    payingLocations: number;
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    mrr: number;
    gmv: number;
  };
  subscription: {
    plan: string | null;
    status: string | null;
    mrr: number;
    trialConvertsDate: string | null;
    paymentMethodOnFile: boolean;
    lifetimeBilled: number;
    outstanding: number;
  };
  engagement: {
    onboardingMinutes: number | null;
    lastOrderDays: number | null;
    firstSale: boolean;
    activeTerminals: number;
    totalTerminals: number;
    staffUsers: number;
    healthScore: number | null;
  };
  lifecycle: {
    stage: string | null;
    referredByCode: string | null;
    whitelabel: string | null;
  };
  timeline: { type: string; at: string }[];
}

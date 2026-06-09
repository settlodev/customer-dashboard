"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import {
  ActivityItem,
  ActivityKind,
  BillingSummary,
  DashboardOverview,
  DashboardOverviewResponse,
  DashboardSectionKey,
  HeadlineMetric,
  OnboardingFunnel,
  PlanMixItem,
  PlatformHealthItem,
  RegionItem,
  RevenueSeries,
  StatStripItem,
  SupportSummaryItem,
  TopBusinessRow,
  TrialPipelineItem,
} from "@/types/admin/dashboard";
import {
  compactNumber,
  ratioPercent,
  timeSince,
} from "@/components/admin/shared/format";

const OVERVIEW_PATH = "/api/v2/internal/metrics/dashboard/overview";

const ALL_SECTIONS: DashboardSectionKey[] = [
  "revenue",
  "stats",
  "funnel",
  "revenueSeries",
  "planMix",
  "trials",
  "regions",
  "billing",
  "platform",
  "topBusinesses",
  "activity",
];

/**
 * Admin dashboard overview. Pulls the live aggregate from the Reports Service
 * (`GET /api/v2/internal/metrics/dashboard/overview`) and maps it into the UI
 * `DashboardOverview` shape. There is deliberately NO demo/dummy fallback: if
 * the whole call fails we return an empty overview with every section marked
 * errored, and the UI renders honest "couldn't load" cards rather than
 * fabricated figures. Per-section failures (the backend fault-isolates each
 * section) arrive in `res.errors` and are surfaced the same way.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    const res = await reportsInternalGet<DashboardOverviewResponse>(
      OVERVIEW_PATH,
    );
    return mapOverview(res);
  } catch (error: any) {
    // A 403 means REPORTS_INTERNAL_SECRET doesn't match the Reports Service's
    // INTERNAL_API_SECRET; a network error means it's unreachable; a 500 means
    // the endpoint itself threw. Log it, then render all sections as errored.
    console.error(
      `[admin/dashboard-overview] live Reports fetch failed (${OVERVIEW_PATH}) — rendering "couldn't load" cards:`,
      error?.code ? `${error.code} ${error.message ?? ""}`.trim() : error?.message ?? error,
    );
    return blankOverview(ALL_SECTIONS);
  }
}

/**
 * A type-valid, data-free overview. Used when the whole endpoint is
 * unreachable — every section listed in `errored` renders a "couldn't load"
 * card, and no fabricated numbers are shown.
 */
function blankOverview(errored: DashboardSectionKey[]): DashboardOverview {
  return {
    errored,
    generatedAt: new Date().toISOString(),
    headline: [],
    stats: [],
    funnel: { stages: [], summary: "" },
    revenue: [],
    planMix: { caption: "", items: [] },
    trials: [],
    regions: { caption: "", items: [] },
    billing: { collectedLabel: "—", collectedCaption: "", lines: [] },
    platformHealth: [],
    support: [],
    topBusinesses: [],
    activity: [],
  };
}

// ── Backend → UI mapping ─────────────────────────────────────────────

const INK = "hsl(var(--ink))";
const ORANGE = "hsl(var(--primary))";
const POS = "hsl(var(--pos))";
const MUTED = "hsl(var(--muted-2))";
const BLUE = "#2563EB";

const AVATAR_PALETTE = [
  "#2563EB", "#7C3AED", "#0E8B5F", "#C25E26", "#1E3A8A",
  "#B07A1E", "#0E7C7B", "#6B2D5C", "#C8442A", "#3B4CCC",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

type Tier = "starter" | "growth" | "pro" | "enterprise";

function tierOf(value: string | null | undefined): Tier {
  const v = (value ?? "").toLowerCase();
  if (v.includes("enterprise")) return "enterprise";
  if (v.includes("pro")) return "pro";
  if (v.includes("growth")) return "growth";
  return "starter";
}

function tierColor(tier: Tier): string {
  return tier === "enterprise"
    ? INK
    : tier === "pro"
      ? ORANGE
      : tier === "growth"
        ? BLUE
        : MUTED;
}

/** Split "3.64M" → { value: "3.64", suffix: "M" } for the metric cards. */
function compactParts(n: number): { value: string; suffix?: string } {
  const c = compactNumber(n);
  const m = /^(-?[\d.,]+)([KMB])?$/.exec(c);
  return m ? { value: m[1], suffix: m[2] || undefined } : { value: c };
}

/**
 * Coerce a possibly-missing value to a finite number. The Reports `/overview`
 * endpoint fault-isolates each section — a failed section returns an empty
 * default — so any scalar can be absent. This keeps `.toLocaleString()` / math
 * from throwing (which would bubble up and force the whole dashboard to the
 * demo-data fallback).
 */
function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function pctDelta(
  cur: number,
  prev: number,
): { value: string; tone: "up" | "down" } | undefined {
  if (!prev || prev <= 0) return undefined;
  const d = ((cur - prev) / prev) * 100;
  return { value: `${Math.abs(d).toFixed(1)}%`, tone: d >= 0 ? "up" : "down" };
}

function monthLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short" });
  } catch {
    return iso;
  }
}

function mapOverview(res: DashboardOverviewResponse): DashboardOverview {
  const { revenue: rev, stats: st, funnel: fn, billing: bl } = res;

  // Headline KPIs
  const mrrSpark = res.revenueSeries.mrr
    .map((r) => r.mrr ?? 0)
    .filter((v) => Number.isFinite(v));
  const gmvSpark = res.revenueSeries.gmv
    .map((r) => r.gmv ?? 0)
    .filter((v) => Number.isFinite(v));

  const headline: HeadlineMetric[] = [
    {
      key: "mrr",
      label: "MRR",
      currency: "TZS",
      ...compactParts(rev.mrr),
      delta: pctDelta(rev.mrr, rev.mrrPrev),
      spark: mrrSpark.length > 1 ? mrrSpark : undefined,
    },
    {
      key: "arr",
      label: "ARR (run-rate)",
      currency: "TZS",
      ...compactParts(rev.arr),
      footNote: "MRR × 12",
    },
    {
      key: "gmv",
      label: "GMV processed",
      currency: "TZS",
      ...compactParts(rev.gmv),
      delta: pctDelta(rev.gmv, rev.gmvPrev),
      spark: gmvSpark.length > 1 ? gmvSpark : undefined,
    },
    {
      key: "nrr",
      label: "Net revenue retention",
      value: rev.nrr != null ? String(Math.round(rev.nrr)) : "—",
      suffix: rev.nrr != null ? "%" : undefined,
      footNote: "expansion vs churn",
      delta:
        rev.nrr != null
          ? {
              value: `${Math.round(rev.nrr - 100)} pts`,
              tone: rev.nrr >= 100 ? "up" : "down",
            }
          : undefined,
    },
  ];

  // Stat strip
  const totalAccounts = num(st.totalAccounts);
  const activeAccounts = num(st.activeAccounts);
  const newAccounts30d = num(st.newAccounts30d);
  const newBusinesses30d = num(st.newBusinesses30d);
  const newLocations30d = num(st.newLocations30d);
  const inactiveAccounts = Math.max(0, totalAccounts - activeAccounts);
  const stats: StatStripItem[] = [
    {
      label: "Accounts",
      value: totalAccounts.toLocaleString(),
      sub: newAccounts30d > 0 ? `+${newAccounts30d} 30d` : `${activeAccounts} active`,
      subTone: newAccounts30d > 0 ? "pos" : "muted",
    },
    {
      label: "Businesses",
      value: num(st.totalBusinesses).toLocaleString(),
      sub: newBusinesses30d > 0 ? `+${newBusinesses30d} 30d` : undefined,
      subTone: "pos",
    },
    {
      label: "Paying locations",
      value: num(st.payingLocations).toLocaleString(),
      sub: newLocations30d > 0 ? `+${newLocations30d} 30d` : `${num(st.activeLocations)} active`,
      subTone: newLocations30d > 0 ? "pos" : "muted",
    },
    {
      label: "Active rate",
      value: ratioPercent(activeAccounts, totalAccounts, 0),
      sub: `${inactiveAccounts} inactive`,
      subTone: "muted",
    },
    {
      label: "Open trials",
      value: num(st.openTrials).toLocaleString(),
      sub:
        st.trialConversionRate != null
          ? `${Math.round(num(st.trialConversionRate))}% convert`
          : undefined,
      subTone: "muted",
    },
    {
      label: "ARPL",
      value: compactNumber(num(st.arpl)),
      sub: "TZS / location",
      subTone: "muted",
    },
  ];

  // Onboarding funnel
  const created = fn.accountsCreated || 1;
  const pct = (n: number) => Math.round((n / created) * 100);
  const gap = (from: number, to: number) => Math.max(0, from - to);
  const funnel: OnboardingFunnel = {
    stages: [
      {
        key: "account",
        label: "Account created",
        count: fn.accountsCreated,
        pct: 100,
        color: ORANGE,
        note: "all signups",
        noteTone: "dim",
      },
      {
        key: "email",
        label: "Email verified",
        count: fn.emailVerified,
        pct: pct(fn.emailVerified),
        color: "#E8954F",
        note: gap(fn.accountsCreated, fn.emailVerified) > 0
          ? `▼ ${gap(fn.accountsCreated, fn.emailVerified)} unverified`
          : "✓ all verified",
        noteTone: gap(fn.accountsCreated, fn.emailVerified) > 0 ? "warn" : "ok",
      },
      {
        key: "business",
        label: "Business created",
        count: fn.businessCreated,
        pct: pct(fn.businessCreated),
        color: "#EEB46B",
        note: gap(fn.emailVerified, fn.businessCreated) > 0
          ? `▼ ${gap(fn.emailVerified, fn.businessCreated)} no business`
          : "✓ on track",
        noteTone: gap(fn.emailVerified, fn.businessCreated) > 0 ? "warn" : "ok",
      },
      {
        key: "location",
        label: "Location live",
        qualifier: "· billable",
        count: fn.locationLive,
        pct: pct(fn.locationLive),
        color: POS,
        note: gap(fn.businessCreated, fn.locationLive) > 0
          ? `▼ ${gap(fn.businessCreated, fn.locationLive)} no location`
          : "✓ 0 pending",
        noteTone: gap(fn.businessCreated, fn.locationLive) > 0 ? "warn" : "ok",
      },
    ],
    summary: `${gap(fn.accountsCreated, fn.locationLive)} accounts stalled before going live — ${gap(fn.accountsCreated, fn.emailVerified)} haven't verified email, ${gap(fn.emailVerified, fn.businessCreated)} have no business yet`,
  };

  // Revenue series (MRR / GMV / cumulative accounts)
  const mrrPoints = res.revenueSeries.mrr.map((r) => ({
    label: monthLabel(r.month),
    value: r.mrr ?? 0,
  }));
  const gmvPoints = res.revenueSeries.gmv.map((r) => ({
    label: monthLabel(r.month),
    value: r.gmv ?? 0,
  }));
  let cumulative = 0;
  const accountPoints = res.revenueSeries.accounts.map((r) => {
    cumulative += r.c ?? 0;
    return { label: monthLabel(r.month), value: cumulative };
  });
  const flat = { value: "0%", tone: "flat" as const };
  const series: RevenueSeries[] = [
    {
      key: "mrr",
      label: "MRR",
      currency: "TZS",
      headlineValue: compactNumber(rev.mrr),
      delta: pctDelta(rev.mrr, rev.mrrPrev) ?? flat,
      caption: "Recurring revenue · last 12 months",
      valueKind: "currency",
      points: mrrPoints,
    },
    {
      key: "gmv",
      label: "GMV",
      currency: "TZS",
      headlineValue: compactNumber(rev.gmv),
      delta: pctDelta(rev.gmv, rev.gmvPrev) ?? flat,
      caption: "POS volume processed · last 12 months",
      valueKind: "currency",
      points: gmvPoints,
    },
    {
      key: "accounts",
      label: "Accounts",
      headlineValue: String(
        accountPoints.length
          ? accountPoints[accountPoints.length - 1].value
          : st.totalAccounts,
      ),
      delta: {
        value: `${st.newAccounts30d}`,
        tone: st.newAccounts30d >= 0 ? "up" : "down",
      },
      caption: "Cumulative registered accounts · last 12 months",
      valueKind: "count",
      points: accountPoints,
    },
  ];

  // Plan mix — per-package breakdown of current subscriptions. Bars are sized
  // by business share (meaningful even pre-revenue); active = paying (incl.
  // businesses that paid during their trial, which Billing flips to ACTIVE).
  const planRows = res.planMix ?? [];
  const totalPlanBiz = planRows.reduce((s, p) => s + num(p.business_count), 0);
  const totalActive = planRows.reduce((s, p) => s + num(p.active_count), 0);
  const totalTrial = planRows.reduce((s, p) => s + num(p.trial_count), 0);
  const totalPlanMrr = planRows.reduce((s, p) => s + num(p.mrr), 0);
  const planItems: PlanMixItem[] = planRows.map((p) => {
    const tier = tierOf(p.tier || p.plan_name);
    return {
      tier,
      label: p.plan_name ?? "Unknown",
      businesses: num(p.business_count),
      activeCount: num(p.active_count),
      trialCount: num(p.trial_count),
      mrrLabel: `TZS ${compactNumber(num(p.mrr))}`,
      pct: totalPlanBiz > 0 ? (num(p.business_count) / totalPlanBiz) * 100 : 0,
      color: tierColor(tier),
    };
  });
  const planMix = {
    caption: `${totalPlanBiz} ${totalPlanBiz === 1 ? "business" : "businesses"} · ${totalActive} active · ${totalTrial} trial · TZS ${compactNumber(totalPlanMrr)} MRR`,
    items: planItems,
  };

  // Trial pipeline
  const trials: TrialPipelineItem[] = res.trials.map((t) => ({
    id: t.business_id,
    name: t.business_name || "—",
    meta: `${t.package_name ?? "Trial"} trial · ${t.region ?? "—"}`,
    daysLabel: t.days_left <= 0 ? "Expires today" : `${t.days_left}d left`,
    tone: t.days_left > 3 ? "pos" : t.days_left >= 1 ? "warn" : "neg",
    avatarColor: avatarColor(t.business_id),
  }));

  // Regions
  const regionTotal = res.regions.reduce((s, r) => s + r.count, 0);
  const regions = {
    caption: `${regionTotal} locations · ${res.regions.length} regions`,
    items: res.regions.map<RegionItem>((r) => ({
      name: r.region,
      count: r.count,
      pct: regionTotal > 0 ? (r.count / regionTotal) * 100 : 0,
    })),
  };

  // Billing & collections
  const collRate = bl.collectionRate <= 1 ? bl.collectionRate * 100 : bl.collectionRate;
  const billing: BillingSummary = {
    collectedLabel: compactNumber(bl.collected),
    collectedCaption: `collected · ${Math.round(collRate)}% of billed`,
    lines: [
      {
        label: "Outstanding",
        value: `TZS ${compactNumber(bl.outstanding)}`,
        tone: "warn",
        dotColor: "hsl(var(--warn))",
      },
      {
        label: "Past due",
        value: `TZS ${compactNumber(bl.pastDue)} · ${bl.pastDueCount} loc`,
        tone: "neg",
        dotColor: "hsl(var(--neg))",
      },
      {
        label: "Renewals · next 7d",
        value: `${bl.renewals7dCount} loc`,
        tone: "pos",
        dotColor: "hsl(var(--pos))",
      },
      {
        label: "Refunds issued",
        value: `TZS ${compactNumber(bl.refunds)} · ${bl.refundCount}`,
        tone: "muted",
        dotColor: "hsl(var(--muted-2))",
      },
    ],
  };

  // Platform health — only the signals we can actually source.
  const platform = res.platform ?? ({} as DashboardOverviewResponse["platform"]);
  const platformHealth: PlatformHealthItem[] = [
    {
      kind: "transactions",
      label: "Transactions today",
      value: num(platform.transactionsToday).toLocaleString(),
    },
    {
      kind: "terminals",
      label: "Active terminals",
      value: `${num(platform.activeTerminals)} / ${num(platform.totalTerminals)}`,
    },
  ];
  const support: SupportSummaryItem[] = [];

  // Top businesses
  const topBusinesses: TopBusinessRow[] = res.topBusinesses.map((b) => {
    const tier = tierOf(b.current_package_name);
    const active = b.lifecycle_stage !== "CHURNED" && b.days_since_last_order <= 7;
    return {
      id: b.business_id,
      name: b.business_name || "—",
      locations: `${b.total_orders.toLocaleString()} orders`,
      region: b.region ?? "—",
      tier,
      planLabel: b.current_package_name ?? "—",
      gmvLabel: compactNumber(b.total_revenue),
      mrrLabel: "—",
      statusLabel:
        b.lifecycle_stage === "CHURNED" ? "Churned" : active ? "Active" : "Idle",
      statusTone: active ? "pos" : "warn",
      avatarColor: avatarColor(b.business_id),
    };
  });

  // Activity feed
  const activity: ActivityItem[] = res.activity.map((a, i) => {
    let kind: ActivityKind = "signup";
    let text = " started a subscription";
    let amount: string | undefined;
    let amountTone: "pos" | "neg" | "dim" | undefined;
    if (a.kind === "refund") {
      kind = "refund";
      text = " refund issued";
      if (a.amount) {
        amount = `−${compactNumber(a.amount)}`;
        amountTone = "dim";
      }
    } else if (a.kind === "invoice") {
      if (a.event_type === "INVOICE_PAID") {
        kind = "payment";
        text = " payment received";
        if (a.amount) amount = compactNumber(a.amount);
      } else {
        kind = "failed";
        text = " payment overdue";
        if (a.amount) {
          amount = `−${compactNumber(a.amount)}`;
          amountTone = "neg";
        }
      }
    } else if (a.event_type === "SUBSCRIPTION_UPDATED") {
      kind = "upgrade";
      text = " subscription updated";
      if (a.amount) {
        amount = `+${compactNumber(a.amount)}`;
        amountTone = "pos";
      }
    }
    return {
      id: `act-${i}`,
      kind,
      lead: a.business_name ?? undefined,
      text,
      time: timeSince(a.ts),
      amount,
      amountTone,
    };
  });

  return {
    errored: (res.errors ?? []).filter((e): e is DashboardSectionKey =>
      (ALL_SECTIONS as string[]).includes(e),
    ),
    generatedAt: res.generatedAt,
    headline,
    stats,
    funnel,
    revenue: series,
    planMix,
    trials,
    regions,
    billing,
    platformHealth,
    support,
    topBusinesses,
    activity,
  };
}

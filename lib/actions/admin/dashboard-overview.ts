"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import {
  ActivityItem,
  ActivityKind,
  BillingSummary,
  DashboardOverview,
  DashboardOverviewResponse,
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

/**
 * Admin dashboard overview. Pulls the live aggregate from the Reports
 * Service (`GET /api/v2/internal/metrics/dashboard/overview`) and maps it
 * into the UI `DashboardOverview` shape. Falls back to the placeholder
 * (with "Live data pending" badges) when the Reports Service isn't
 * reachable / configured yet, so the dashboard always renders.
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  try {
    const res = await reportsInternalGet<DashboardOverviewResponse>(
      OVERVIEW_PATH,
    );
    return mapOverview(res);
  } catch {
    return stubDashboardOverview();
  }
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
  const inactiveAccounts = Math.max(0, st.totalAccounts - st.activeAccounts);
  const stats: StatStripItem[] = [
    {
      label: "Accounts",
      value: st.totalAccounts.toLocaleString(),
      sub: st.newAccounts30d > 0 ? `+${st.newAccounts30d} 30d` : `${st.activeAccounts} active`,
      subTone: st.newAccounts30d > 0 ? "pos" : "muted",
    },
    {
      label: "Businesses",
      value: st.totalBusinesses.toLocaleString(),
      sub: st.newBusinesses30d > 0 ? `+${st.newBusinesses30d} 30d` : undefined,
      subTone: "pos",
    },
    {
      label: "Paying locations",
      value: st.payingLocations.toLocaleString(),
      sub: st.newLocations30d > 0 ? `+${st.newLocations30d} 30d` : `${st.activeLocations} active`,
      subTone: st.newLocations30d > 0 ? "pos" : "muted",
    },
    {
      label: "Active rate",
      value: ratioPercent(st.activeAccounts, st.totalAccounts, 0),
      sub: `${inactiveAccounts} inactive`,
      subTone: "muted",
    },
    {
      label: "Open trials",
      value: st.openTrials.toLocaleString(),
      sub:
        st.trialConversionRate != null
          ? `${Math.round(st.trialConversionRate)}% convert`
          : undefined,
      subTone: "muted",
    },
    {
      label: "ARPL",
      value: compactNumber(st.arpl),
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

  // Plan mix
  const totalPlanRevenue = res.planMix.reduce((s, p) => s + p.revenue, 0);
  const totalPlanLocations = res.planMix.reduce(
    (s, p) => s + (p.location_count || p.business_count),
    0,
  );
  const planItems: PlanMixItem[] = res.planMix.map((p) => {
    const tier = tierOf(p.tier || p.plan_name);
    return {
      tier,
      label: p.plan_name ?? "Unknown",
      locations: p.location_count || p.business_count,
      mrrLabel: `TZS ${compactNumber(p.revenue)}`,
      pct: totalPlanRevenue > 0 ? (p.revenue / totalPlanRevenue) * 100 : 0,
      color: tierColor(tier),
    };
  });
  const planMix = {
    caption: `${totalPlanLocations} locations · TZS ${compactNumber(totalPlanRevenue)} MRR`,
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
  const platformHealth: PlatformHealthItem[] = [
    {
      kind: "transactions",
      label: "Transactions today",
      value: res.platform.transactionsToday.toLocaleString(),
    },
    {
      kind: "terminals",
      label: "Active terminals",
      value: `${res.platform.activeTerminals} / ${res.platform.totalTerminals}`,
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
    isLive: true,
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

/**
 * Placeholder used when the Reports Service isn't reachable yet. Realistic
 * demo data sized to the platform's scale; `isLive: false` lights the
 * "Live data pending" badges so reviewers don't act on the numbers.
 */
async function stubDashboardOverview(): Promise<DashboardOverview> {
  const INK = "hsl(var(--ink))";
  const ORANGE = "hsl(var(--primary))";
  const POS = "hsl(var(--pos))";
  const MUTED = "hsl(var(--muted-2))";
  const BLUE = "#2563EB";

  return {
    isLive: false,
    generatedAt: new Date().toISOString(),

    headline: [
      {
        key: "mrr",
        label: "MRR",
        currency: "TZS",
        value: "3.64",
        suffix: "M",
        delta: { value: "6.4%", tone: "up" },
        spark: [12, 18, 24, 31, 38, 46, 55, 64, 73, 82, 91, 100],
      },
      {
        key: "arr",
        label: "ARR (run-rate)",
        currency: "TZS",
        value: "43.6",
        suffix: "M",
        delta: { value: "18.2% YoY", tone: "up" },
        footNote: "MRR × 12",
      },
      {
        key: "gmv",
        label: "GMV processed",
        currency: "TZS",
        value: "248.6",
        suffix: "M",
        delta: { value: "8.2%", tone: "up" },
        spark: [40, 35, 52, 46, 64, 60, 72, 70, 84, 88, 96, 100],
      },
      {
        key: "nrr",
        label: "Net revenue retention",
        value: "108",
        suffix: "%",
        delta: { value: "4 pts", tone: "up" },
        footNote: "expansion > churn",
      },
    ],

    stats: [
      { label: "Accounts", value: "15", sub: "+2 30d", subTone: "pos" },
      { label: "Businesses", value: "13", sub: "+1 30d", subTone: "pos" },
      { label: "Paying locations", value: "17", sub: "+3 30d", subTone: "pos" },
      { label: "Active rate", value: "100%", sub: "0 churned", subTone: "muted" },
      { label: "Open trials", value: "3", sub: "67% convert", subTone: "muted" },
      { label: "ARPL", value: "214K", sub: "TZS / location", subTone: "muted" },
    ],

    funnel: {
      stages: [
        {
          key: "account",
          label: "Account created",
          count: 15,
          pct: 100,
          color: ORANGE,
          note: "all signups",
          noteTone: "dim",
        },
        {
          key: "email",
          label: "Email verified",
          count: 13,
          pct: 87,
          color: "#E8954F",
          note: "▼ 2 unverified",
          noteTone: "warn",
        },
        {
          key: "business",
          label: "Business created",
          count: 12,
          pct: 80,
          color: "#EEB46B",
          note: "▼ 1 no business",
          noteTone: "warn",
        },
        {
          key: "location",
          label: "Location live",
          qualifier: "· billable",
          count: 12,
          pct: 80,
          color: POS,
          note: "✓ 0 pending",
          noteTone: "ok",
        },
      ],
      summary:
        "3 accounts stalled before going live — 2 haven't verified email, 1 has no business yet",
    },

    revenue: [
      {
        key: "mrr",
        label: "MRR",
        currency: "TZS",
        headlineValue: "3.64M",
        delta: { value: "6.4% vs May", tone: "up" },
        caption: "+TZS 2.46M added since Jul 2025 · 209% growth",
        valueKind: "currency",
        points: [
          { label: "Jul", value: 1_180_000 },
          { label: "Aug", value: 1_320_000 },
          { label: "Sep", value: 1_560_000 },
          { label: "Oct", value: 1_740_000 },
          { label: "Nov", value: 1_980_000 },
          { label: "Dec", value: 2_220_000 },
          { label: "Jan", value: 2_470_000 },
          { label: "Feb", value: 2_760_000 },
          { label: "Mar", value: 3_010_000 },
          { label: "Apr", value: 3_280_000 },
          { label: "May", value: 3_420_000 },
          { label: "Jun", value: 3_640_000 },
        ],
      },
      {
        key: "gmv",
        label: "GMV",
        currency: "TZS",
        headlineValue: "248.6M",
        delta: { value: "8.2% vs May", tone: "up" },
        caption: "POS volume flowing through Settlo · last 12 months",
        valueKind: "currency",
        points: [
          { label: "Jul", value: 96_000_000 },
          { label: "Aug", value: 112_000_000 },
          { label: "Sep", value: 134_000_000 },
          { label: "Oct", value: 151_000_000 },
          { label: "Nov", value: 168_000_000 },
          { label: "Dec", value: 205_000_000 },
          { label: "Jan", value: 188_000_000 },
          { label: "Feb", value: 201_000_000 },
          { label: "Mar", value: 219_000_000 },
          { label: "Apr", value: 233_000_000 },
          { label: "May", value: 241_000_000 },
          { label: "Jun", value: 248_600_000 },
        ],
      },
      {
        key: "accounts",
        label: "Accounts",
        headlineValue: "15",
        delta: { value: "2 vs May", tone: "up" },
        caption: "Cumulative registered accounts · last 12 months",
        valueKind: "count",
        points: [
          { label: "Jul", value: 4 },
          { label: "Aug", value: 5 },
          { label: "Sep", value: 6 },
          { label: "Oct", value: 8 },
          { label: "Nov", value: 9 },
          { label: "Dec", value: 10 },
          { label: "Jan", value: 11 },
          { label: "Feb", value: 12 },
          { label: "Mar", value: 12 },
          { label: "Apr", value: 13 },
          { label: "May", value: 13 },
          { label: "Jun", value: 15 },
        ],
      },
    ],

    planMix: {
      caption: "17 locations · TZS 3.64M MRR",
      items: [
        {
          tier: "enterprise",
          label: "Enterprise",
          locations: 2,
          mrrLabel: "TZS 1.50M",
          pct: 41,
          color: INK,
        },
        {
          tier: "pro",
          label: "Pro",
          locations: 3,
          mrrLabel: "TZS 1.05M",
          pct: 29,
          color: ORANGE,
        },
        {
          tier: "growth",
          label: "Growth",
          locations: 5,
          mrrLabel: "TZS 0.75M",
          pct: 20,
          color: BLUE,
        },
        {
          tier: "starter",
          label: "Starter",
          locations: 7,
          mrrLabel: "TZS 0.34M",
          pct: 9,
          color: MUTED,
        },
      ],
    },

    trials: [
      {
        id: "t1",
        name: "Mlimani Fresh Mart",
        meta: "Growth trial · Arusha",
        daysLabel: "4d left",
        tone: "pos",
        avatarColor: "#0E7C7B",
      },
      {
        id: "t2",
        name: "Bahari Hotel & Grill",
        meta: "Pro trial · Zanzibar",
        daysLabel: "2d left",
        tone: "warn",
        avatarColor: "#7C3AED",
      },
      {
        id: "t3",
        name: "Uhuru Duka",
        meta: "Starter trial · Dodoma",
        daysLabel: "Expires today",
        tone: "neg",
        avatarColor: "#C8442A",
      },
    ],

    regions: {
      caption: "17 locations · 5 regions",
      items: [
        { name: "Dar es Salaam", count: 9, pct: 53 },
        { name: "Arusha", count: 3, pct: 18 },
        { name: "Mwanza", count: 3, pct: 18 },
        { name: "Dodoma", count: 1, pct: 8 },
        { name: "Zanzibar", count: 1, pct: 8 },
      ],
    },

    billing: {
      collectedLabel: "3.41M",
      collectedCaption: "collected · 94% of billed",
      lines: [
        {
          label: "Outstanding",
          value: "TZS 420K · 2 loc",
          tone: "warn",
          dotColor: "hsl(var(--warn))",
        },
        {
          label: "Failed payments",
          value: "TZS 149K · 1 loc",
          tone: "neg",
          dotColor: "hsl(var(--neg))",
        },
        {
          label: "Renewals · next 7d",
          value: "TZS 1.10M · 4 loc",
          tone: "pos",
          dotColor: "hsl(var(--pos))",
        },
        {
          label: "Refunds issued",
          value: "TZS 49K · 1",
          tone: "muted",
          dotColor: "hsl(var(--muted-2))",
        },
      ],
    },

    platformHealth: [
      {
        kind: "uptime",
        label: "API uptime",
        value: "99.98%",
        healthDot: POS,
      },
      {
        kind: "latency",
        label: "p95 latency",
        value: "142 ms",
        healthDot: POS,
      },
      { kind: "transactions", label: "Transactions today", value: "1,284" },
      { kind: "terminals", label: "Active terminals", value: "29 / 31" },
    ],

    support: [
      { label: "Open tickets", value: "4 · 1 urgent" },
      { label: "Avg first response", value: "1h 12m" },
      { label: "CSAT (30d)", value: "96%", valueTone: "pos" },
    ],

    topBusinesses: [
      {
        id: "b1",
        name: "Coco Paaz",
        locations: "3 locations",
        region: "Dar es Salaam",
        tier: "enterprise",
        planLabel: "Enterprise",
        gmvLabel: "68.4M",
        mrrLabel: "750K",
        statusLabel: "Active",
        statusTone: "pos",
        avatarColor: "#C25E26",
      },
      {
        id: "b2",
        name: "Karanjas Juice Bar",
        locations: "2 locations",
        region: "Dar es Salaam",
        tier: "pro",
        planLabel: "Pro",
        gmvLabel: "41.2M",
        mrrLabel: "349K",
        statusLabel: "Active",
        statusTone: "pos",
        avatarColor: "#0E8B5F",
      },
      {
        id: "b3",
        name: "Serengeti Supermarket",
        locations: "1 location",
        region: "Mwanza",
        tier: "enterprise",
        planLabel: "Enterprise",
        gmvLabel: "37.8M",
        mrrLabel: "750K",
        statusLabel: "Active",
        statusTone: "pos",
        avatarColor: "#1E3A8A",
      },
      {
        id: "b4",
        name: "Kilimanjaro Coffee House",
        locations: "1 location",
        region: "Arusha",
        tier: "pro",
        planLabel: "Pro",
        gmvLabel: "22.5M",
        mrrLabel: "349K",
        statusLabel: "Active",
        statusTone: "pos",
        avatarColor: "#6B2D5C",
      },
      {
        id: "b5",
        name: "Mwanza Wholesalers",
        locations: "1 location",
        region: "Mwanza",
        tier: "growth",
        planLabel: "Growth",
        gmvLabel: "19.1M",
        mrrLabel: "149K",
        statusLabel: "Active",
        statusTone: "pos",
        avatarColor: "#2563EB",
      },
      {
        id: "b6",
        name: "Bahari Foods",
        locations: "1 location",
        region: "Zanzibar",
        tier: "growth",
        planLabel: "Growth",
        gmvLabel: "14.7M",
        mrrLabel: "149K",
        statusLabel: "Past due",
        statusTone: "warn",
        avatarColor: "#C4892B",
      },
    ],

    activity: [
      {
        id: "a1",
        kind: "signup",
        lead: "Bahari Foods",
        text: " signed up on the Growth plan",
        time: "2 hours ago · Zanzibar",
      },
      {
        id: "a2",
        kind: "upgrade",
        lead: "Karanjas Juice Bar",
        text: " upgraded Growth → Pro",
        time: "5 hours ago · +TZS 200K MRR",
        amount: "+200K",
        amountTone: "pos",
      },
      {
        id: "a3",
        kind: "payment",
        lead: "Coco Paaz",
        text: " payment received",
        time: "Yesterday · 4:12 PM",
        amount: "750K",
      },
      {
        id: "a4",
        kind: "business",
        lead: "Mlimani Fresh Mart",
        text: " — new business added to a trial",
        time: "Yesterday · Arusha",
      },
      {
        id: "a5",
        kind: "failed",
        lead: "Bahari Foods",
        text: " payment failed — retry scheduled",
        time: "Yesterday · TZS 149K",
        amount: "−149K",
        amountTone: "neg",
      },
      {
        id: "a6",
        kind: "refund",
        lead: "Uhuru Duka",
        text: " refund issued",
        time: "2 days ago · Starter",
        amount: "−49K",
        amountTone: "dim",
      },
    ],
  };
}

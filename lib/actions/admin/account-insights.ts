"use server";

import { reportsInternalGet } from "@/lib/reports-internal-client";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import {
  AccountInsights,
  AccountInsightsResponse,
  AttentionBanner,
} from "@/types/admin/account-insights";
import { SubscriptionResponse } from "@/types/admin/billing";
import {
  compactNumber,
  formatDateTime,
} from "@/components/admin/shared/format";

/**
 * Account-detail commercial / health / lifecycle insights. Pulls the live
 * aggregate from the Reports Service
 * (`GET /api/v2/internal/metrics/accounts/{id}/insights`) and maps it into
 * the UI `AccountInsights` shape. Falls back to the placeholder (with
 * "Live data pending" badges) when the Reports Service isn't reachable, so
 * the account-detail screen always renders.
 *
 * Identity, profile, geography, timestamps and staff assignment come from
 * the real `AdminAccountDetail` (Accounts Service) — only the panels below
 * are sourced here. "Support & success" has no ticketing backend yet, so it
 * renders "—".
 */
export async function getAccountInsights(
  accountId: string,
): Promise<AccountInsights> {
  try {
    const res = await reportsInternalGet<AccountInsightsResponse>(
      `/api/v2/internal/metrics/accounts/${accountId}/insights`,
    );
    // Join the per-unit billing rollup (locations + warehouses + stores,
    // each on its own plan) from the Billing Service. Falls back to the
    // Reports tree (location-only) when billing isn't readable.
    const billing = await aggregateBilling(
      res.businesses.map((b) => b.businessId),
    );
    return mapInsights(res, billing);
  } catch {
    return stubAccountInsights(accountId);
  }
}

// ── Backend → UI mapping ─────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#2563EB", "#7C3AED", "#0E8B5F", "#C25E26", "#1E3A8A",
  "#B07A1E", "#0E7C7B", "#6B2D5C", "#C8442A", "#3B4CCC",
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function tierOf(value: string | null | undefined): "starter" | "growth" | "pro" | "enterprise" {
  const v = (value ?? "").toLowerCase();
  if (v.includes("enterprise")) return "enterprise";
  if (v.includes("pro")) return "pro";
  if (v.includes("growth")) return "growth";
  return "starter";
}

function tzs(n: number): string {
  return `TZS ${Math.round(n).toLocaleString()}`;
}

function daysUntil(iso: string): number {
  const ms = new Date(`${iso.slice(0, 10)}T00:00:00Z`).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

function stageLabel(stage: string | null): string {
  const s = (stage ?? "").toUpperCase();
  if (!s || s === "SIGNED_UP" || s === "BUSINESS_CREATED") return "New customer";
  if (s === "ACTIVE" || s === "FIRST_ORDER") return "Active customer";
  if (s === "PAYING" || s === "SUBSCRIPTION") return "Paying customer";
  if (s === "CHURNED") return "Churned";
  return titleCase(s);
}

function healthNote(score: number | null): string {
  if (score == null) return "no data";
  if (score >= 70) return "healthy";
  if (score >= 40) return "watch";
  return "at risk";
}

function timelineEntry(type: string): { text: string; dotColor: string } {
  switch (type) {
    case "account_created":
      return { text: "Account created via web signup", dotColor: "hsl(var(--ink-3))" };
    case "email_verified":
      return { text: "Verified email", dotColor: "hsl(var(--pos))" };
    case "business_created":
      return { text: "Created their first business", dotColor: "hsl(var(--primary))" };
    case "location_added":
      return { text: "Added their first location", dotColor: "hsl(var(--primary))" };
    case "first_product":
      return { text: "Added a first product", dotColor: "#2563EB" };
    case "subscription_started":
      return { text: "Started a subscription", dotColor: "#2563EB" };
    case "first_order":
      return { text: "Recorded their first sale", dotColor: "hsl(var(--pos))" };
    case "last_order":
      return { text: "Most recent sale", dotColor: "hsl(var(--muted-2))" };
    default:
      return { text: titleCase(type), dotColor: "hsl(var(--muted-2))" };
  }
}

/**
 * Per-unit billing rollup for an account, joined from the Billing Service.
 * Each business carries ONE subscription whose ACTIVE items are its billable
 * units (location / warehouse / store), each on its own package. The
 * subscription status (TRIAL/ACTIVE/…) governs whether those units are
 * trialing or live; the plan varies per item (`packageInfo`).
 */
interface BillingAgg {
  billableUnits: number;
  byType: { locations: number; warehouses: number; stores: number };
  activeSubscriptions: number;
  openTrials: number;
  mrr: number;
  planMix: { label: string; count: number }[];
}

/**
 * Fan out across the account's businesses, fetching each subscription
 * independently so one failure — or a non-billing role (the endpoint is
 * SUPPORT_AGENT/SYSTEM_ADMIN gated) — never blanks the rollup. Returns null
 * when no subscription could be read at all, so the caller falls back to the
 * Reports tree (location-only) counts.
 */
async function aggregateBilling(
  businessIds: string[],
): Promise<BillingAgg | null> {
  if (businessIds.length === 0) return null;

  const subs = await Promise.all(
    businessIds.map((id) => getBusinessSubscription(id).catch(() => null)),
  );
  const live = subs.filter((s): s is SubscriptionResponse => s != null);
  if (live.length === 0) return null;

  const byType = { locations: 0, warehouses: 0, stores: 0 };
  let billableUnits = 0;
  let activeSubscriptions = 0;
  let openTrials = 0;
  let mrr = 0;
  const planCounts = new Map<string, number>();

  for (const sub of live) {
    const status = (sub.status ?? "").toUpperCase();
    for (const item of sub.items) {
      if (item.status !== "ACTIVE") continue;
      billableUnits += 1;
      if (item.entityType === "WAREHOUSE") byType.warehouses += 1;
      else if (item.entityType === "STORE") byType.stores += 1;
      else byType.locations += 1;
      mrr += item.packageInfo?.basePrice ?? 0;
      const plan = item.packageInfo?.name ?? "—";
      planCounts.set(plan, (planCounts.get(plan) ?? 0) + 1);
      // A unit's billing state follows its business's single subscription.
      if (status === "ACTIVE") activeSubscriptions += 1;
      else if (status === "TRIAL") openTrials += 1;
    }
  }

  const planMix = Array.from(planCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, z) => z.count - a.count);

  return {
    billableUnits,
    byType,
    activeSubscriptions,
    openTrials,
    mrr,
    planMix,
  };
}

function mapInsights(
  res: AccountInsightsResponse,
  billingAgg: BillingAgg | null,
): AccountInsights {
  const { subscription: sub, engagement: eng, kpis: k } = res;

  const subStatus = (sub.status ?? "").toUpperCase();

  // Billing ROLLUP across the account's billable units. The account itself
  // is never billed — each unit (location / warehouse / store) carries its
  // own subscription, invoices are issued per business. Prefer the live
  // per-unit aggregate from the Billing Service; fall back to the Reports
  // tree (which only knows locations) when billing isn't readable.
  let billableUnits: number;
  let activeSubscriptions: number;
  let openTrials: number;
  let billingMrr: number;
  let planMix: { label: string; count: number }[];
  let byType: { locations: number; warehouses: number; stores: number };

  if (billingAgg) {
    billableUnits = billingAgg.billableUnits;
    activeSubscriptions = billingAgg.activeSubscriptions;
    openTrials = billingAgg.openTrials;
    billingMrr = billingAgg.mrr;
    planMix = billingAgg.planMix;
    byType = billingAgg.byType;
  } else {
    billableUnits = 0;
    activeSubscriptions = 0;
    openTrials = 0;
    const planCounts = new Map<string, number>();
    for (const b of res.businesses) {
      for (const l of b.locations) {
        billableUnits += 1;
        const st = (l.status ?? "").toUpperCase();
        if (st === "ACTIVE") activeSubscriptions += 1;
        else if (st === "TRIAL") openTrials += 1;
        planCounts.set(l.planName ?? "—", (planCounts.get(l.planName ?? "—") ?? 0) + 1);
      }
    }
    planMix = Array.from(planCounts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, z) => z.count - a.count);
    billingMrr = k.mrr;
    byType = { locations: billableUnits, warehouses: 0, stores: 0 };
  }

  const banner: AttentionBanner | null = !eng.firstSale &&
    !sub.paymentMethodOnFile &&
    subStatus === "TRIAL"
    ? {
        title: "Not yet monetised.",
        text: "No payment method on file and no sales recorded — a strong candidate for a sales follow-up before the trial ends.",
        actionLabel: "Assign sales rep",
        actionHref: "#",
      }
    : sub.outstanding > 0
      ? {
          title: "Outstanding balance.",
          text: `${tzs(sub.outstanding)} outstanding across invoices — follow up on collection.`,
          actionLabel: "View billing",
        }
      : null;

  return {
    isLive: true,
    attentionBanner: banner,
    lifecycle: {
      stage: stageLabel(res.lifecycle.stage),
      source: res.lifecycle.referredByCode
        ? `Referral · ${res.lifecycle.referredByCode}`
        : "Web signup · organic",
      avatarLabel: res.lifecycle.referredByCode ? "R" : "W",
      avatarColor: res.lifecycle.referredByCode ? "#7C3AED" : "#0E8B5F",
    },
    kpis: {
      payingLocations: {
        count: k.payingLocations,
        setupNote:
          k.totalLocations > k.payingLocations
            ? `${k.totalLocations - k.payingLocations} setup`
            : undefined,
      },
      subscriptionPlan: k.subscriptionPlan ?? "—",
      subscriptionStatus: k.subscriptionStatus
        ? k.subscriptionStatus.toLowerCase()
        : undefined,
      mrr: { currency: "TZS", value: compactNumber(k.mrr) },
      gmv: {
        currency: "TZS",
        value: compactNumber(k.gmv),
        note: k.gmv === 0 ? "no sales" : undefined,
      },
    },
    businesses: {
      count: res.businesses.length,
      locationCount: k.totalLocations,
      items: res.businesses.map((b) => ({
        id: b.businessId,
        name: b.name,
        code: "",
        industry: b.industry ?? "—",
        locationCount: b.locationCount,
        statusLabel: b.statusLabel,
        statusTone: b.statusLabel === "Churned" ? "neg" : "pos",
        avatarColor: avatarColor(b.businessId),
        locations: b.locations.map((l) => {
          const isTrial =
            (l.status ?? "").toUpperCase() === "TRIAL" && !!l.trialEndDate;
          const dleft = isTrial ? daysUntil(l.trialEndDate as string) : 0;
          return {
            id: l.locationId,
            name: l.name,
            code: "",
            region: l.region ?? "—",
            terminals: `${l.terminals} terminal${l.terminals === 1 ? "" : "s"}`,
            planTier: tierOf(l.planName),
            planLabel: l.planName ?? "—",
            trialLabel: isTrial
              ? dleft <= 0
                ? "Trial · expired"
                : `Trial · ${dleft}d left`
              : undefined,
          };
        }),
      })),
    },
    billing: {
      billableUnits,
      byType,
      activeSubscriptions,
      openTrials,
      mrr: { currency: "TZS", value: compactNumber(billingMrr) },
      planMix,
      lifetimeBilled: {
        value: tzs(sub.lifetimeBilled),
        tone: sub.lifetimeBilled > 0 ? "default" : "dim",
      },
      outstanding: {
        value: tzs(sub.outstanding),
        tone: sub.outstanding > 0 ? "warn" : "default",
      },
      paymentMethod: {
        value: sub.paymentMethodOnFile ? "On file" : "Not added",
        tone: sub.paymentMethodOnFile ? "default" : "warn",
      },
    },
    engagement: {
      onboarding: {
        value:
          eng.onboardingMinutes != null
            ? `Done · ${eng.onboardingMinutes} min`
            : "Pending",
        tone: eng.onboardingMinutes != null ? "pos" : "warn",
      },
      lastActive:
        eng.lastOrderDays != null
          ? eng.lastOrderDays === 0
            ? "Today"
            : `${eng.lastOrderDays}d ago`
          : "—",
      firstSale: {
        value: eng.firstSale ? "Done" : "Pending",
        tone: eng.firstSale ? "pos" : "warn",
      },
      terminals: `${eng.activeTerminals} / ${eng.totalTerminals}`,
      staffUsers: `${eng.staffUsers} ${eng.staffUsers === 1 ? "user" : "users"}`,
      healthScore: {
        value: eng.healthScore ?? 0,
        max: 100,
        note: healthNote(eng.healthScore),
      },
    },
    support: {
      openTickets: "—",
      lastContact: { value: "—", tone: "dim" },
      csat: { value: "—", tone: "dim" },
      welcomeCall: { value: "—", tone: "dim" },
      notes: [],
    },
    timeline: res.timeline.map((e) => ({
      ...timelineEntry(e.type),
      time: formatDateTime(e.at),
    })),
  };
}

/**
 * Placeholder used when the Reports Service isn't reachable. Realistic demo
 * data; `isLive: false` lights the "Live data pending" badges.
 */
async function stubAccountInsights(
  _accountId: string,
): Promise<AccountInsights> {
  void _accountId;
  return {
    isLive: false,

    attentionBanner: {
      title: "Fast onboarder, not yet monetised.",
      text: "Completed setup in 7 minutes but has no payment method on file and no sales recorded — a strong candidate for a sales follow-up before the trial ends.",
      actionLabel: "Assign sales rep",
    },

    lifecycle: {
      stage: "New customer",
      source: "Web signup · organic",
      avatarLabel: "W",
      avatarColor: "#0E8B5F",
    },

    kpis: {
      payingLocations: { count: 1, setupNote: "1 setup" },
      subscriptionPlan: "Growth",
      subscriptionStatus: "trial",
      mrr: { currency: "TZS", value: "149K" },
      gmv: { currency: "TZS", value: "0", note: "no sales" },
    },

    businesses: {
      count: 1,
      locationCount: 1,
      items: [
        {
          id: "biz-1",
          name: "Gwambina Foods",
          code: "BIZ-GW8H2K",
          industry: "Food & beverage",
          locationCount: 1,
          statusLabel: "Active",
          statusTone: "pos",
          avatarColor: "#1E3A8A",
          locations: [
            {
              id: "loc-1",
              name: "Gwambina Foods — Main",
              code: "LOC-GW8H2K01",
              region: "Mwanza",
              terminals: "1 terminal",
              planTier: "growth",
              planLabel: "Growth",
              trialLabel: "Trial · 13d left",
            },
          ],
        },
      ],
    },

    billing: {
      billableUnits: 1,
      byType: { locations: 1, warehouses: 0, stores: 0 },
      activeSubscriptions: 0,
      openTrials: 1,
      mrr: { currency: "TZS", value: "149K" },
      planMix: [{ label: "Growth", count: 1 }],
      lifetimeBilled: { value: "TZS 0", tone: "dim" },
      outstanding: { value: "TZS 0", tone: "default" },
      paymentMethod: { value: "Not added", tone: "warn" },
    },

    engagement: {
      onboarding: { value: "Done · 7 min", tone: "pos" },
      lastActive: "12 min ago",
      firstSale: { value: "Pending", tone: "warn" },
      terminals: "1 / 1",
      staffUsers: "1 owner",
      healthScore: { value: 62, max: 100, note: "new" },
    },

    support: {
      openTickets: "0",
      lastContact: { value: "Never", tone: "dim" },
      csat: { value: "—", tone: "dim" },
      welcomeCall: { value: "Not booked", tone: "warn" },
      notes: [],
    },

    timeline: [
      {
        text: "Awaiting first transaction — no sales recorded yet",
        time: "Now",
        dotColor: "hsl(var(--muted-2))",
      },
      {
        text: "Started Growth trial on location Gwambina Foods — Main",
        time: "Jun 7, 2026 · 10:12 AM",
        dotColor: "#2563EB",
      },
      {
        text: "Added location Gwambina Foods — Main in Mwanza",
        time: "Jun 7, 2026 · 10:11 AM",
        dotColor: "hsl(var(--primary))",
      },
      {
        text: "Created business Gwambina Foods",
        time: "Jun 7, 2026 · 10:08 AM",
        dotColor: "hsl(var(--primary))",
      },
      {
        text: "Verified email",
        time: "Jun 7, 2026 · 10:06 AM",
        dotColor: "hsl(var(--pos))",
      },
      {
        text: "Account created via web signup",
        time: "Jun 7, 2026 · 10:05 AM",
        dotColor: "hsl(var(--ink-3))",
      },
    ],
  };
}

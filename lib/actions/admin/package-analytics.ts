"use server";

import {
  PackageAnalytics,
  PackageAnalyticsComparison,
  PackageComparisonMode,
  PackageDateRange,
  PackageForecast,
  PackageForecastModel,
  PackageStatusBreakdown,
  PackageSubscriberRow,
  PackageTimeSeriesPoint,
  PackageWhitelabelBreakdownRow,
} from "@/types/admin/billing";
import { reportsInternalGet } from "@/lib/reports-internal-client";

const PACKAGE_ANALYTICS_PATH = (packageId: string) =>
  `/api/v2/internal/metrics/saas/packages/${encodeURIComponent(packageId)}/analytics`;

/**
 * Businesses currently subscribed to a package. Sourced from the Reports
 * Service (`.../packages/{id}/subscribers`) so business names + regions come
 * pre-joined from dim_business. Returns [] on any failure, so the subscribers
 * table degrades to an empty state instead of breaking the page.
 */
export async function listPackageSubscribers(
  packageId: string,
): Promise<PackageSubscriberRow[]> {
  try {
    const rows = await reportsInternalGet<PackageSubscriberRow[]>(
      `/api/v2/internal/metrics/saas/packages/${encodeURIComponent(packageId)}/subscribers`,
    );
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

/**
 * Per-package analytics for the package detail page.
 *
 * Pulls the live aggregate from the Reports Service
 * (`GET /api/v2/internal/metrics/saas/packages/{id}/analytics`), which
 * computes the figures from `fact_subscription_items`,
 * `fact_invoice_line_items` and the trial-conversion rollup. On ANY
 * failure (endpoint not deployed yet, secret mismatch, query error) we
 * fall back to the deterministic synthetic below, which carries
 * {@code isLive: false} so the UI shows a "Live data pending" badge
 * rather than breaking or dressing up fabricated numbers as live.
 */
export async function getPackageAnalytics(
  packageId: string,
  basePrice: number,
  range: PackageDateRange,
  comparisonMode: PackageComparisonMode = "none",
): Promise<PackageAnalytics> {
  try {
    const res = await reportsInternalGet<PackageAnalytics>(
      PACKAGE_ANALYTICS_PATH(packageId),
      { from: range.from, to: range.to, compare: comparisonMode },
    );
    return normalizePackageAnalytics(res, packageId, range);
  } catch {
    return synthesizePackageAnalytics(
      packageId,
      basePrice,
      range,
      comparisonMode,
    );
  }
}

/**
 * Guard the live payload. The endpoint returns a JSON object assembled
 * from ClickHouse column maps, so ensure the array/echo fields are
 * always present (a partial row must never crash the UI) and force
 * {@code isLive: true} — this path only runs on a successful fetch.
 */
function normalizePackageAnalytics(
  res: PackageAnalytics,
  packageId: string,
  range: PackageDateRange,
): PackageAnalytics {
  return {
    ...res,
    packageId: res.packageId ?? packageId,
    range: res.range ?? range,
    comparison: res.comparison ?? null,
    subscribersTimeline: res.subscribersTimeline ?? [],
    revenueTimeline: res.revenueTimeline ?? [],
    byStatus: res.byStatus ?? [],
    byWhitelabel: res.byWhitelabel ?? [],
    isLive: true,
    computedAt: res.computedAt ?? new Date().toISOString(),
  };
}

/**
 * Deterministic synthetic fallback — keyed off the package ID + range so
 * the same package shows a stable shape. Marked {@code isLive: false} so
 * the UI flags it as placeholder data.
 */
async function synthesizePackageAnalytics(
  packageId: string,
  basePrice: number,
  range: PackageDateRange,
  comparisonMode: PackageComparisonMode = "none",
): Promise<PackageAnalytics> {
  const seed = hashSeed(packageId);
  const days = daysBetween(range.from, range.to);

  // Snapshot counts — keyed only off the seed so the same package
  // shows the same population whatever range is selected. Period
  // metrics below DO vary with range so the dashboard tells a story.
  const baseSubscribers = 40 + (seed % 220);
  const trial = Math.round(baseSubscribers * 0.18);
  const pastDue = Math.round(baseSubscribers * 0.06);
  const cancelled = Math.round(baseSubscribers * 0.4);

  // Period metrics scale with the window length so longer ranges
  // produce visibly larger absolute totals. The factor is sub-linear
  // to keep daily-rate numbers stable.
  const periodFactor = Math.sqrt(Math.max(1, days));
  const newSubs = Math.round((6 + (seed % 12)) * periodFactor);
  const churned = Math.round((3 + (seed % 6)) * periodFactor);
  const churnRate = ((seed % 80) + 10) / 1000;
  const conversionRate = ((seed % 35) + 55) / 100;
  const arpu = basePrice * (0.85 + ((seed % 30) / 100));
  const mrr = Math.round(baseSubscribers * arpu);
  const periodRevenue = buildSeries(
    seed,
    range,
    (baseSubscribers * basePrice) / 30,
  ).reduce((s, p) => s + p.value, 0);
  const lifetimeRevenue = periodRevenue * 8;

  const subscribersTimeline = buildSubscribersSeries(seed, range, baseSubscribers);
  const revenueTimeline = buildSeries(
    seed,
    range,
    (baseSubscribers * basePrice) / 30,
  );

  const byStatus: PackageStatusBreakdown[] = [
    { status: "ACTIVE", count: baseSubscribers },
    { status: "TRIAL", count: trial },
    { status: "PAST_DUE", count: pastDue },
    { status: "CANCELLED", count: cancelled },
    { status: "EXPIRED", count: Math.round(baseSubscribers * 0.08) },
    { status: "SUSPENDED", count: Math.round(baseSubscribers * 0.03) },
  ];

  const byWhitelabel = buildWhitelabelBreakdown(
    seed,
    baseSubscribers,
    basePrice,
    days,
  );

  const comparison = comparisonMode === "none"
    ? null
    : buildComparison(packageId, basePrice, range, comparisonMode);

  return {
    packageId,
    range,
    comparison,
    activeSubscribers: baseSubscribers,
    trialSubscribers: trial,
    pastDueSubscribers: pastDue,
    cancelledSubscribers: cancelled,
    newSubscribers: newSubs,
    churnedSubscribers: churned,
    churnRate: Number(churnRate.toFixed(4)),
    conversionRate: Number(conversionRate.toFixed(3)),
    mrrContribution: mrr,
    periodRevenue: Math.round(periodRevenue),
    lifetimeRevenue: Math.round(lifetimeRevenue),
    arpu: Math.round(arpu),
    subscribersTimeline,
    revenueTimeline,
    byStatus,
    byWhitelabel,
    isLive: false,
    computedAt: null,
  };
}

/**
 * Placeholder forecast for a package's daily revenue. Same caveats as
 * {@link getPackageAnalytics} — deterministic, marked {@code isLive:
 * false}, swap the body once the ML service exists.
 *
 * Different models produce visibly different shapes so reviewers can
 * see the picker has effect, but the numbers themselves are not
 * predictions of anything.
 */
export async function getPackageForecast(
  packageId: string,
  basePrice: number,
  model: PackageForecastModel = "linear",
  horizonDays = 90,
): Promise<PackageForecast> {
  const seed = hashSeed(`${packageId}:${model}`);
  const subscribers = 40 + (seed % 220);
  const baseDaily = (subscribers * basePrice) / 30;
  const points: PackageTimeSeriesPoint[] = [];
  const upper: PackageTimeSeriesPoint[] = [];
  const lower: PackageTimeSeriesPoint[] = [];

  const today = stripTime(new Date());
  for (let i = 1; i <= horizonDays; i++) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + i);
    const iso = date.toISOString().slice(0, 10);

    let value: number;
    let spread: number;
    if (model === "linear") {
      value = baseDaily * (1 + i * 0.003);
      spread = baseDaily * 0.05;
    } else if (model === "arima") {
      const wave = Math.sin(i / 6) * 0.08;
      value = baseDaily * (1 + i * 0.0025 + wave);
      spread = baseDaily * (0.06 + Math.abs(wave) * 0.5);
    } else {
      const weekly = Math.sin(i / 3.5) * 0.06;
      const trend = i * 0.0035;
      value = baseDaily * (1 + trend + weekly);
      spread = baseDaily * (0.04 + Math.min(0.1, i / 1000));
    }
    points.push({ date: iso, value: Math.round(value) });
    upper.push({ date: iso, value: Math.round(value + spread) });
    lower.push({ date: iso, value: Math.max(0, Math.round(value - spread)) });
  }

  return {
    packageId,
    model,
    horizonDays,
    points,
    upper,
    lower,
    note:
      "Placeholder figures — the ML revenue model isn't wired up yet. Shapes vary per model so the picker behaves correctly, but the values aren't a real prediction.",
    isLive: false,
  };
}

// ── Internal helpers ──────────────────────────────────────────────

function buildComparison(
  packageId: string,
  basePrice: number,
  primary: PackageDateRange,
  mode: PackageComparisonMode,
): PackageAnalyticsComparison {
  const compRange = shiftRange(primary, mode);
  const seed = hashSeed(`${packageId}:cmp:${mode}`);
  const baseSubscribers = 40 + (seed % 220);
  const days = daysBetween(compRange.from, compRange.to);
  const periodFactor = Math.sqrt(Math.max(1, days));
  const newSubs = Math.round((5 + (seed % 11)) * periodFactor);
  const churned = Math.round((3 + (seed % 5)) * periodFactor);
  const churnRate = ((seed % 75) + 12) / 1000;
  const conversionRate = ((seed % 30) + 50) / 100;
  const arpu = basePrice * (0.82 + ((seed % 28) / 100));
  const mrr = Math.round(baseSubscribers * arpu);
  const revenueTimeline = buildSeries(
    seed,
    compRange,
    (baseSubscribers * basePrice) / 30,
  );
  const subscribersTimeline = buildSubscribersSeries(
    seed,
    compRange,
    baseSubscribers,
  );

  return {
    range: compRange,
    activeSubscribers: baseSubscribers,
    newSubscribers: newSubs,
    churnedSubscribers: churned,
    churnRate: Number(churnRate.toFixed(4)),
    conversionRate: Number(conversionRate.toFixed(3)),
    mrrContribution: mrr,
    periodRevenue: Math.round(
      revenueTimeline.reduce((s, p) => s + p.value, 0),
    ),
    arpu: Math.round(arpu),
    subscribersTimeline,
    revenueTimeline,
  };
}

function shiftRange(
  primary: PackageDateRange,
  mode: PackageComparisonMode,
): PackageDateRange {
  if (mode === "none") return primary;
  const days = daysBetween(primary.from, primary.to);
  if (mode === "previous_period") {
    const from = addDays(primary.from, -(days + 1));
    const to = addDays(primary.from, -1);
    return { from, to };
  }
  // previous_year: shift the whole window back 12 months.
  return {
    from: addMonths(primary.from, -12),
    to: addMonths(primary.to, -12),
  };
}

function buildSeries(
  seed: number,
  range: PackageDateRange,
  dailyBase: number,
): PackageTimeSeriesPoint[] {
  const days = daysBetween(range.from, range.to);
  const out: PackageTimeSeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(range.from, i);
    const weeklyPhase = ((i % 7) + (seed % 7)) / 7;
    const wave = Math.sin(weeklyPhase * Math.PI * 2) * 0.12;
    const trend = i / Math.max(60, days * 12);
    const value = Math.max(0, dailyBase * (1 + trend + wave));
    out.push({ date, value: Math.round(value) });
  }
  return out;
}

function buildSubscribersSeries(
  seed: number,
  range: PackageDateRange,
  baseSubscribers: number,
): PackageTimeSeriesPoint[] {
  const days = daysBetween(range.from, range.to);
  const out: PackageTimeSeriesPoint[] = [];
  // Start a bit below the snapshot count and walk up so the chart
  // shows directional movement rather than a flat line. Stochastic
  // noise is seeded so re-renders are stable.
  const start = Math.max(1, Math.round(baseSubscribers * 0.82));
  let current = start;
  for (let i = 0; i < days; i++) {
    const date = addDays(range.from, i);
    const drift = baseSubscribers * 0.0018;
    const wobble =
      Math.sin((i + (seed % 11)) / 3.2) * Math.max(1, baseSubscribers * 0.012);
    current = Math.max(1, current + drift + wobble);
    out.push({ date, value: Math.round(current) });
  }
  return out;
}

function buildWhitelabelBreakdown(
  seed: number,
  baseSubscribers: number,
  basePrice: number,
  days: number,
): PackageWhitelabelBreakdownRow[] {
  // Placeholder whitelabel names — when the backend goes live this
  // breakdown will come back keyed to real whitelabel IDs and the UI
  // will swap straight through.
  const names = [
    "Settlo",
    "Settlo Pro",
    "Mwanga POS",
    "Hakika",
    "Reseller A",
    "Reseller B",
  ];
  const total = baseSubscribers;
  const weights = names.map((_, i) => 0.32 / Math.pow(1.45, i));
  const sum = weights.reduce((s, w) => s + w, 0);
  const subscribersAlloc = weights.map((w, i) =>
    Math.max(1, Math.round((total * w) / sum + ((seed >> i) % 4))),
  );
  // Allocate revenue proportional to subscribers × time × price with
  // a small per-row jitter so totals aren't perfectly linear.
  return names.map((name, i) => ({
    whitelabelId: `wl-${i + 1}`,
    whitelabelName: name,
    subscribers: subscribersAlloc[i],
    revenue: Math.round(
      subscribersAlloc[i] * basePrice * (days / 30) * (0.9 + ((seed >> i) % 25) / 100),
    ),
  }));
}

function daysBetween(from: string, to: string): number {
  const f = new Date(`${from}T00:00:00Z`).getTime();
  const t = new Date(`${to}T00:00:00Z`).getTime();
  if (Number.isNaN(f) || Number.isNaN(t)) return 30;
  return Math.max(1, Math.round((t - f) / 86_400_000) + 1);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function hashSeed(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return Math.abs(h);
}

function stripTime(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

import { eachDayOfInterval, format } from "date-fns";

import type { CashFlowDailyPoint } from "@/types/orders/type";
import type { CashflowTrendPoint } from "@/types/reports/cashflow";

// ─── Deterministic PRNG ─────────────────────────────────────────────
// The cash-flow summary endpoint returns period totals but no daily
// series. To give the trend chart a believable shape WITHOUT inventing
// magnitudes, we spread the REAL totals across day buckets using a seeded
// PRNG: the area under each series ties out to the real cash-in / cash-out,
// only the per-day distribution is modeled. Seeding off the date range
// keeps the curve stable across renders (no SSR/CSR drift, stable
// screenshots) and makes the chart respond plausibly when the range moves.

function seedFrom(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Spread the real period totals across daily buckets (weekly-folded for
 * very long ranges). Returns one point per bucket; summing `cashIn` over
 * the result reproduces `cashInTotal` (likewise `cashOut`).
 */
export function buildPlaceholderTrend(
  from: string,
  to: string,
  cashInTotal: number,
  cashOutTotal: number,
): CashflowTrendPoint[] {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [];
  }

  let days = eachDayOfInterval({ start, end });
  // Keep the x-axis readable: daily up to ~9 weeks, then sample weekly.
  const stride = days.length > 62 ? 7 : 1;
  if (stride > 1) days = days.filter((_, i) => i % stride === 0);

  const rand = mulberry32(seedFrom(`${from}|${to}|${days.length}`));
  // Per-bucket weights, normalized so the series sums to the real total.
  const inWeights = days.map(() => 0.5 + rand());
  const outWeights = days.map(() => 0.4 + rand());
  const inSum = inWeights.reduce((a, b) => a + b, 0) || 1;
  const outSum = outWeights.reduce((a, b) => a + b, 0) || 1;

  return days.map((day, i) => {
    const cashIn = (inWeights[i] / inSum) * cashInTotal;
    const cashOut = (outWeights[i] / outSum) * cashOutTotal;
    return {
      label: format(day, "MMM d"),
      date: format(day, "yyyy-MM-dd"),
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    };
  });
}

/**
 * Build the chart series from the REAL daily endpoint, overlaid on a full
 * day axis so days with no movement render as a zero bucket (a continuous
 * daily x-axis). `cashOut` folds expenses + refunds, matching the summary's
 * outflow definition. Returns [] for an invalid range.
 */
export function buildTrendFromDaily(
  from: string,
  to: string,
  points: CashFlowDailyPoint[],
): CashflowTrendPoint[] {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [];
  }

  const byDate = new Map<string, CashFlowDailyPoint>();
  for (const point of points) {
    if (point?.date) byDate.set(point.date.slice(0, 10), point);
  }

  return eachDayOfInterval({ start, end }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const point = byDate.get(key);
    const cashIn = point?.cashIn ?? 0;
    const cashOut =
      (point?.expensesPaidAmount ?? 0) + (point?.refundsAmount ?? 0);
    return {
      label: format(day, "MMM d"),
      date: key,
      cashIn,
      cashOut,
      net: cashIn - cashOut,
    };
  });
}

/**
 * Pure range helpers for the Profit & Loss page. Server-safe (the page
 * resolves its default window here) and client-safe (the period control
 * steps months and detects presets here). Dates are `yyyy-MM-dd` strings on
 * the wire; months are `yyyy-MM`.
 */

import {
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  isSameMonth,
  isSameYear,
  isValid,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";

export type PlView = "statement" | "monthly";
export type PlPreset = "month" | "year" | "last12" | "custom";

export interface PlRange {
  from: string;
  to: string;
}

/** Longest month range the monthly endpoint accepts. */
export const MAX_MONTHLY_SPAN = 12;

const day = (d: Date) => format(d, "yyyy-MM-dd");
const month = (d: Date) => format(d, "yyyy-MM");

export function parseDay(s: string | undefined | null): Date | null {
  if (!s) return null;
  const d = parseISO(s);
  return isValid(d) ? d : null;
}

/** The current calendar month, first day to last day. */
export function thisMonth(now = new Date()): PlRange {
  return { from: day(startOfMonth(now)), to: day(endOfMonth(now)) };
}

/** 1 January to the end of the current month. */
export function thisYear(now = new Date()): PlRange {
  return { from: day(startOfYear(now)), to: day(endOfMonth(now)) };
}

/** The current month and the eleven before it. */
export function lastTwelveMonths(now = new Date()): PlRange {
  return { from: day(startOfMonth(subMonths(now, 11))), to: day(endOfMonth(now)) };
}

export function resolvePlView(raw: string | undefined): PlView {
  return raw === "monthly" ? "monthly" : "statement";
}

/**
 * The page's window from its search params: missing or unparsable values
 * fall back to the current month, and an inverted pair is swapped.
 */
export function resolvePlRange(
  params: { from?: string; to?: string },
  now = new Date(),
): PlRange {
  const fallback = thisMonth(now);
  let from = parseDay(params.from) ?? parseDay(fallback.from)!;
  let to = parseDay(params.to) ?? parseDay(fallback.to)!;
  if (to < from) [from, to] = [to, from];
  return { from: day(from), to: day(to) };
}

/** True when the range is exactly one calendar month, first day to last. */
export function isWholeMonth(from: string, to: string): boolean {
  const f = parseDay(from);
  const t = parseDay(to);
  if (!f || !t) return false;
  return (
    isSameMonth(f, t) &&
    day(startOfMonth(f)) === from &&
    day(endOfMonth(t)) === to
  );
}

/** The whole month `delta` months away from the month `from` is in. */
export function stepMonth(from: string, delta: number): PlRange {
  const base = parseDay(from) ?? new Date();
  const target = addMonths(startOfMonth(base), delta);
  return { from: day(target), to: day(endOfMonth(target)) };
}

/** The stepper never goes past the current month. */
export function canStepForward(from: string, now = new Date()): boolean {
  const f = parseDay(from);
  return !!f && !isSameMonth(f, now) && f < now;
}

/**
 * The monthly endpoint's `fromMonth`/`toMonth` for a day range: truncated to
 * whole months and clamped to {@link MAX_MONTHLY_SPAN} by moving `from`
 * forward — the most recent months are the ones people compare.
 */
export function toMonthRange(from: string, to: string): { fromMonth: string; toMonth: string } {
  const f = startOfMonth(parseDay(from) ?? new Date());
  const t = startOfMonth(parseDay(to) ?? new Date());
  const span = differenceInCalendarMonths(t, f) + 1;
  const clampedFrom = span > MAX_MONTHLY_SPAN ? subMonths(t, MAX_MONTHLY_SPAN - 1) : f;
  return { fromMonth: month(clampedFrom), toMonth: month(t) };
}

/** Which preset (if any) a range corresponds to, per view. */
export function detectPlPreset(
  view: PlView,
  from: string,
  to: string,
  now = new Date(),
): PlPreset {
  const same = (r: PlRange) => r.from === from && r.to === to;
  if (view === "statement" && same(thisMonth(now))) return "month";
  if (same(thisYear(now))) return "year";
  if (view === "monthly" && same(lastTwelveMonths(now))) return "last12";
  return "custom";
}

/** "August 2026" for a whole month. */
export function formatMonthLabel(from: string): string {
  const f = parseDay(from);
  return f ? format(f, "MMMM yyyy") : "";
}

/**
 * Human label for the page subtitle: "August 2026", "Jan – Aug 2026",
 * "Jul 2025 – Jun 2026", or "10 Mar – 22 Apr 2026". Whole-month ranges that
 * end in the current month get "(to date)".
 */
export function formatPlRangeLabel(from: string, to: string, now = new Date()): string {
  const f = parseDay(from);
  const t = parseDay(to);
  if (!f || !t) return "";
  const wholeMonths = day(startOfMonth(f)) === from && day(endOfMonth(t)) === to;
  const toDate = wholeMonths && isSameMonth(t, now) ? " (to date)" : "";

  if (wholeMonths && isSameMonth(f, t)) return `${format(f, "MMMM yyyy")}${toDate}`;
  if (wholeMonths) {
    return isSameYear(f, t)
      ? `${format(f, "MMM")} – ${format(t, "MMM yyyy")}${toDate}`
      : `${format(f, "MMM yyyy")} – ${format(t, "MMM yyyy")}${toDate}`;
  }
  return isSameYear(f, t)
    ? `${format(f, "d MMM")} – ${format(t, "d MMM yyyy")}`
    : `${format(f, "d MMM yyyy")} – ${format(t, "d MMM yyyy")}`;
}

/**
 * Shared date-range presets for the dashboard's filter bars.
 *
 * Previously each filter (orders / packaging / stock) duplicated this logic and
 * every report page inlined its own default window. This is the single source
 * of truth — pure functions, safe on both server (page defaults) and client
 * (the segmented control).
 */

import {
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

export type RangePreset = "today" | "yesterday" | "week" | "month" | "custom";

export interface DateRangeValue {
  from: string;
  to: string;
}

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Preset ranges keyed off `now`. Weeks start Monday — matches how Settlo
 * locations close their books in the reporting code.
 */
export function getPresetRange(
  preset: Exclude<RangePreset, "custom">,
  now = new Date(),
): DateRangeValue {
  switch (preset) {
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "week":
      return {
        from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "month":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  }
}

/** The standard default report window: the current calendar month. */
export function thisMonthRange(now = new Date()): DateRangeValue {
  return getPresetRange("month", now);
}

/** Which preset (if any) a from/to pair corresponds to. */
export function detectPreset(from: string, to: string): RangePreset {
  for (const p of ["today", "yesterday", "week", "month"] as const) {
    const r = getPresetRange(p);
    if (r.from === from && r.to === to) return p;
  }
  return "custom";
}

/** Human label for a range, e.g. "Jun 10 – Jul 10, 2026" or a single day. */
export function formatRangeLabel(from: string, to: string): string {
  if (!from || !to) return "Pick range";
  if (from === to) return format(new Date(from), "MMM d, yyyy");
  return `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`;
}

export const RANGE_PRESETS: Array<{
  key: Exclude<RangePreset, "custom">;
  label: string;
}> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

/**
 * A preset a filter can offer: a stable key (drives the active highlight and
 * the pending spinner), the pill label, and the range it selects. Pages with
 * their own vocabulary (the P&L's This month / This year / Last 12 months)
 * hand a list of these to the shared control instead of the defaults.
 */
export interface RangePresetDef {
  key: string;
  label: string;
  range: (now?: Date) => DateRangeValue;
}

/** The standard preset row every list/report filter shows. */
export const DEFAULT_RANGE_PRESETS: RangePresetDef[] = RANGE_PRESETS.map((p) => ({
  key: p.key,
  label: p.label,
  range: (now?: Date) => getPresetRange(p.key, now),
}));

/** Which preset key (if any) a from/to pair corresponds to, for a given preset list. */
export function detectPresetKey(
  presets: RangePresetDef[],
  from: string,
  to: string,
): string {
  for (const p of presets) {
    const r = p.range();
    if (r.from === from && r.to === to) return p.key;
  }
  return "custom";
}

/**
 * Human label for a whole-month range, e.g. "Aug 2026", "Jan – Aug 2026" or
 * "Jul 2025 – Jun 2026". Used by month-granularity filters where the day
 * numbers of a range are always the 1st and the last and would only add noise.
 */
export function formatMonthRangeLabel(from: string, to: string): string {
  if (!from || !to) return "Pick months";
  const f = parseISO(from);
  const t = parseISO(to);
  if (isSameMonth(f, t)) return format(f, "MMM yyyy");
  return isSameYear(f, t)
    ? `${format(f, "MMM")} – ${format(t, "MMM yyyy")}`
    : `${format(f, "MMM yyyy")} – ${format(t, "MMM yyyy")}`;
}

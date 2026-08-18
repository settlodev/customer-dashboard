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

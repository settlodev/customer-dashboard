import type {
  PackageComparisonMode,
  PackageDateRange,
} from "@/types/admin/billing";

/**
 * Shared date-range helpers for admin screens that hang a {@link DateFilterBar}
 * off `?from`/`?to`/`?compare` search params. Mirrors the logic the package
 * detail page proved out, in one reusable place. All days are yyyy-MM-dd in
 * UTC so they line up with the Reports Service's `business_date` filters.
 */

/** yyyy-MM-dd matcher for validating range query params. */
export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function minusOneYear(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

/** Default window: the last 30 days (inclusive), ending today. */
export function defaultRange(): PackageDateRange {
  const to = todayIso();
  return { from: addDays(to, -29), to };
}

/** Validate `?from`/`?to` (yyyy-MM-dd, from ≤ to) or fall back to the default. */
export function parseRange(
  from: string | undefined,
  to: string | undefined,
): PackageDateRange {
  if (from && to && ISO_DAY.test(from) && ISO_DAY.test(to) && from <= to) {
    return { from, to };
  }
  return defaultRange();
}

/** Default comparison is the immediately-preceding window. */
export function parseComparison(
  value: string | undefined,
): PackageComparisonMode {
  if (
    value === "previous_period" ||
    value === "previous_year" ||
    value === "none"
  ) {
    return value;
  }
  return "previous_period";
}

/**
 * Resolve the window the primary range is compared against:
 *  - `previous_period`: an equal-length window ending the day before `from`.
 *  - `previous_year`:   the same range shifted back 12 months.
 *  - `none`:            no comparison.
 */
export function resolveComparisonRange(
  range: PackageDateRange,
  mode: PackageComparisonMode,
): PackageDateRange | null {
  if (mode === "none") return null;
  if (mode === "previous_year") {
    return { from: minusOneYear(range.from), to: minusOneYear(range.to) };
  }
  const lengthDays =
    Math.round(
      (Date.parse(`${range.to}T00:00:00Z`) -
        Date.parse(`${range.from}T00:00:00Z`)) /
        86_400_000,
    ) + 1;
  const prevTo = addDays(range.from, -1);
  const prevFrom = addDays(prevTo, -(lengthDays - 1));
  return { from: prevFrom, to: prevTo };
}

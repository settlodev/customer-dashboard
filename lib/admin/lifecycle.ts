/**
 * Shared reading of a lifecycle rollup row, at either grain — the business
 * rollup (`saas_merchant_lifecycle`) or the location one
 * (`saas_location_lifecycle`, V080).
 *
 * The two encode "never ordered" differently, which is the whole reason this
 * lives in one place. The business table's `days_since_last_order` is a
 * non-nullable `UInt32`, so its view has nowhere to put the absence and writes
 * the sentinel 9999 instead:
 *
 *     toUInt32(if(total_orders > 0, dateDiff('day', last_order_at, today()), 9999))
 *
 * Read literally that is ~27 years, which is exactly how it was rendering: a
 * brand-new business with no sales showed "27y ago" under Last order and
 * "Dormant" under Activity. The location table is nullable and emits NULL, with
 * no sentinel. Callers should not have to know which is which.
 *
 * `last_order_at` is separately NULL in both cases, and `total_orders` is 0, so
 * "never ordered" is knowable without pattern-matching on the number — the
 * sentinel check below is belt-and-braces for rows read through a narrower
 * projection.
 */

/** What the lifecycle view writes when a business has never taken an order. */
export const NO_ORDERS_SENTINEL = 9999;

/** The subset of a lifecycle row this module needs, at either grain. */
export interface LifecycleLike {
  days_since_last_order?: number | null;
  last_order_at?: string | null;
  total_orders?: number | null;
  lifecycle_stage?: string | null;
  is_churned?: number | null;
}

/** How a row should read in a list — the same vocabulary at both grains. */
export type ActivityTone = "pos" | "blue" | "warn" | "neg" | "muted";

/** Tailwind classes per tone, shared so both lists render the badge alike. */
export const ACTIVITY_TONE: Record<ActivityTone, string> = {
  pos: "bg-pos-tint text-pos",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
};

export interface ActivityBadge {
  label: string;
  tone: ActivityTone;
  hint: string;
}

/** True when the row says this entity has never taken an order. */
export function hasNeverOrdered(row: LifecycleLike | null | undefined): boolean {
  if (!row) return false;
  if (row.total_orders != null && row.total_orders > 0) return false;
  if (row.last_order_at) return false;
  return (
    row.total_orders === 0 ||
    row.last_order_at === null ||
    row.days_since_last_order === NO_ORDERS_SENTINEL
  );
}

/**
 * Days since the last order, or `null` when there has never been one.
 * Use this instead of reading `days_since_last_order` directly.
 */
export function daysSinceLastOrder(
  row: LifecycleLike | null | undefined,
): number | null {
  if (!row) return null;
  const days = row.days_since_last_order;
  if (days === null || days === undefined) return null;
  if (hasNeverOrdered(row) || days >= NO_ORDERS_SENTINEL) return null;
  return days;
}

/**
 * "Today" / "16d ago" / "4mo ago" / "2y ago", or "Never" when the entity has
 * never traded. `null` days means never — not unknown — because callers get
 * their value from {@link daysSinceLastOrder}.
 */
export function formatLastOrder(days: number | null): string {
  if (days === null) return "Never";
  if (days < 1) return "Today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * How active is this entity — the badge shown on the businesses and locations
 * lists. `noun` names the grain so the hint reads naturally ("Location created,
 * no orders yet").
 *
 * `undefined` and `null` mean different things and are kept apart: undefined is
 * "the rollup has no row for this yet" (a brand-new entity, or a snapshot that
 * hasn't published its first generation), while a row saying zero orders is a
 * definite "opened but never sold".
 */
export function activityBadge(
  row: LifecycleLike | null | undefined,
  noun: "Business" | "Location" = "Business",
): ActivityBadge {
  if (!row)
    return { label: "No data", tone: "muted", hint: "No lifecycle rollup yet" };

  const stage = (row.lifecycle_stage ?? "").toUpperCase();
  if (row.is_churned === 1 || stage === "CHURNED")
    return { label: "Churned", tone: "neg", hint: "Marked churned" };

  // Check this before reading the day count: at business grain "never" arrives
  // as the 9999 sentinel, which otherwise scores as "Dormant · 9999d ago".
  if (hasNeverOrdered(row))
    return {
      label: "No orders",
      tone: "warn",
      hint: `${noun} created, no orders yet`,
    };

  const days = daysSinceLastOrder(row);
  if (days === null)
    return { label: "Unknown", tone: "muted", hint: "No last-order timestamp" };

  if (days <= 7)
    return { label: "Active", tone: "pos", hint: `Last order ${days}d ago` };
  if (days <= 30)
    return { label: "Slowing", tone: "blue", hint: `Last order ${days}d ago` };
  if (days <= 60)
    return { label: "Stale", tone: "warn", hint: `Last order ${days}d ago` };
  return { label: "Dormant", tone: "neg", hint: `Last order ${days}d ago` };
}

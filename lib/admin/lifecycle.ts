/**
 * Decoding for the `saas_merchant_lifecycle` rollup's "days since last order".
 *
 * The column is a non-nullable `UInt32`, so the view has nowhere to put "this
 * business has never taken an order" — it writes the sentinel 9999 instead:
 *
 *     toUInt32(if(total_orders > 0, dateDiff('day', last_order_at, today()), 9999))
 *
 * Read literally that is ~27 years, which is exactly how it was rendering:
 * a brand-new business with no sales showed "27y ago" under Last order, and
 * "Dormant" under Activity. Both are the same sentinel leaking through a
 * formatter that assumed a real day count.
 *
 * `last_order_at` is separately NULL in that case, and `total_orders` is 0, so
 * "never ordered" is knowable without pattern-matching on the number — the
 * sentinel check below is belt-and-braces for rows read through a narrower
 * projection.
 */

/** What the lifecycle view writes when a business has never taken an order. */
export const NO_ORDERS_SENTINEL = 9999;

/** The subset of a lifecycle row this module needs. */
interface LifecycleLike {
  days_since_last_order?: number | null;
  last_order_at?: string | null;
  total_orders?: number | null;
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

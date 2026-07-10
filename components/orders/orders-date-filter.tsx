"use client";

import { DateRangeSegmented } from "@/components/filters/date-range-segmented";

interface Props {
  /** Current `from` URL param (yyyy-MM-dd). */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). */
  to: string;
  /**
   * Show an "All" button that clears the range (drops `from`/`to` from the
   * URL). Use on list pages that default to showing every row; leave off for
   * report pages that are always scoped to a period.
   */
  allowClear?: boolean;
}

/**
 * Date-range filter for orders/report/list pages. Thin wrapper over the shared
 * {@link DateRangeSegmented} control so every dashboard filter looks the same.
 */
export function OrdersDateFilter({ from, to, allowClear = false }: Props) {
  return <DateRangeSegmented from={from} to={to} allowClear={allowClear} />;
}

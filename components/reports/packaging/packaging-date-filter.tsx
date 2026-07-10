"use client";

import { DateRangeSegmented } from "@/components/filters/date-range-segmented";

interface Props {
  /** Range start (yyyy-MM-dd). Drives the Flow tab's movement window. */
  from: string;
  /** Range end (yyyy-MM-dd). */
  to: string;
}

/**
 * Period filter for the packaging report.
 *
 * Packaging has a single time axis. The Deposit & empties tab is always a live
 * snapshot of current balances (no historical "as of"), so only the Flow tab
 * consumes `from`/`to`; the control still renders on both tabs so switching
 * never loses the chosen range. Thin wrapper over the shared
 * {@link DateRangeSegmented} control.
 */
export function PackagingDateFilter({ from, to }: Props) {
  return <DateRangeSegmented from={from} to={to} label="Period" />;
}

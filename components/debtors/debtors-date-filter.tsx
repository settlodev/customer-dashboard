"use client";

import { DateRangeSegmented } from "@/components/filters/date-range-segmented";

interface Props {
  /** Current `from` URL param (yyyy-MM-dd). Empty when unfiltered. */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). Empty when unfiltered. */
  to: string;
}

/**
 * Date filter for the debtors screen. Same segmented control as the sales
 * report, but it defaults to "All": debtors is a collections view, and
 * period-scoping it out of the box would hide exactly the aged debt an
 * operator opens the page to chase.
 *
 * The range scopes rows by when the debt ORIGINATED (`oldestUnsettledAt`),
 * not by last activity — see the Accounting Service's ar-balances endpoint.
 */
export function DebtorsDateFilter({ from, to }: Props) {
  return (
    <DateRangeSegmented
      from={from}
      to={to}
      allowClear
      label="Debt from"
      allLabel="All"
    />
  );
}

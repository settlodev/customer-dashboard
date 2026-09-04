"use client";

import { DateRangeSegmented } from "@/components/filters/date-range-segmented";

interface Props {
  /** Range start (yyyy-MM-dd). The Opening column is the balance here. */
  from: string;
  /** Range end (yyyy-MM-dd). The Closing column is the balance here. */
  to: string;
}

/**
 * Period filter for the stock report.
 *
 * One window drives the whole row: Opening is the balance at `from`, Closing
 * the balance at `to`, and In/Out everything that moved between them. There
 * used to be a second "As of" date beside this control that set Closing on its
 * own. Nothing kept the two in step, so a historical period left on the
 * default as-of reported today's on-hand against last year's movement — and
 * the report's residual fold padded In/Out to make the row balance anyway, so
 * it never looked wrong. Removing the input is what makes the numbers add up.
 */
export function StockReportDateFilter({ from, to }: Props) {
  return <DateRangeSegmented from={from} to={to} label="Period" />;
}

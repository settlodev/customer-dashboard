"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  differenceInCalendarMonths,
  isAfter,
  isBefore,
  isSameMonth,
  startOfMonth,
} from "date-fns";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A month range under construction: `to` is unset between the two clicks. */
export interface MonthRange {
  from?: Date;
  to?: Date;
}

interface Props {
  selected?: MonthRange;
  onSelect: (next: MonthRange | undefined) => void;
  /** Latest selectable month (usually today). Later months are disabled. */
  toDate: Date;
  /**
   * Longest span allowed, in months. Once a start month is chosen, months
   * that would exceed it are disabled until the end is picked.
   */
  maxMonths?: number;
  className?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const navButton = cn(
  buttonVariants({ variant: "outline" }),
  "absolute h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
);

/**
 * The month-granularity twin of the day calendar: a year header with ◀ ▶
 * and a 3×4 grid of months. Click a start month, then an end month — a
 * second click on the start selects that one month, an earlier month swaps
 * the ends — matching how the day calendar's range mode behaves. Cells reuse
 * the calendar's ghost / selected / in-range classes so the two popovers
 * read as one control.
 */
export function MonthRangePicker({
  selected,
  onSelect,
  toDate,
  maxMonths,
  className,
}: Props) {
  const [year, setYear] = useState(() => (selected?.from ?? toDate).getFullYear());

  const from = selected?.from ? startOfMonth(selected.from) : undefined;
  const to = selected?.to ? startOfMonth(selected.to) : undefined;
  const latest = startOfMonth(toDate);
  const picking = !!from && !to;

  const isDisabled = (month: Date) => {
    if (isAfter(month, latest)) return true;
    if (picking && from && maxMonths) {
      return Math.abs(differenceInCalendarMonths(month, from)) + 1 > maxMonths;
    }
    return false;
  };

  const pick = (month: Date) => {
    if (!from || to) {
      onSelect({ from: month, to: undefined });
      return;
    }
    if (isSameMonth(month, from)) {
      onSelect({ from, to: from });
      return;
    }
    onSelect(isBefore(month, from) ? { from: month, to: from } : { from, to: month });
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="relative flex items-center justify-center pt-1">
        <button
          type="button"
          aria-label="Previous year"
          onClick={() => setYear((y) => y - 1)}
          className={cn(navButton, "left-1")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium">{year}</span>
        <button
          type="button"
          aria-label="Next year"
          disabled={year >= latest.getFullYear()}
          onClick={() => setYear((y) => y + 1)}
          className={cn(navButton, "right-1")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid w-[16rem] grid-cols-3 gap-1">
        {MONTHS.map((label, index) => {
          const month = new Date(year, index, 1);
          const isStart = !!from && isSameMonth(month, from);
          const isEnd = !!to && isSameMonth(month, to);
          const inRange =
            !!from && !!to && isAfter(month, from) && isBefore(month, to);
          const disabled = isDisabled(month);
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              aria-pressed={isStart || isEnd}
              onClick={() => pick(month)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-full font-normal",
                inRange && "bg-accent text-accent-foreground",
                (isStart || isEnd) &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                !isStart && !isEnd && !inRange && isSameMonth(month, latest) &&
                  "bg-accent/60",
                disabled && "text-muted-foreground opacity-50",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

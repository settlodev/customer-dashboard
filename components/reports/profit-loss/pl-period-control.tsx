"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { DateRangeSegmented } from "@/components/filters/date-range-segmented";
import type { RangePresetDef } from "@/lib/date-range";
import { cn } from "@/lib/utils";
import {
  canStepForward,
  formatMonthLabel,
  isWholeMonth,
  lastTwelveMonths,
  MAX_MONTHLY_SPAN,
  stepMonth,
  thisMonth,
  thisYear,
  type PlRange,
  type PlView,
} from "@/lib/pl-period";

// Same segmented-pill vocabulary as the shared date-range control, so the
// view toggle and the stepper sit flush beside it. Not imported: those
// constants are private to it.
const segButton =
  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors disabled:opacity-50";
const segActive = "bg-primary text-primary-foreground shadow-sm";
const segIdle = "text-ink-3 hover:text-ink";
const pill =
  "inline-flex max-w-full items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px] align-middle transition-opacity";

/** The single-period statement's presets: the month you are in, or the year to date. */
const STATEMENT_PRESETS: RangePresetDef[] = [
  { key: "month", label: "This month", range: (now) => thisMonth(now) },
  { key: "year", label: "This year", range: (now) => thisYear(now) },
];

/** The comparative view's presets: the year so far, or a rolling twelve months. */
const MONTHLY_PRESETS: RangePresetDef[] = [
  { key: "year", label: "This year", range: (now) => thisYear(now) },
  { key: "last12", label: "Last 12 months", range: (now) => lastTwelveMonths(now) },
];

type PendingKey = PlView | "prev" | "next" | null;

interface Props {
  view: PlView;
  /** Current `from` URL param (yyyy-MM-dd). */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). */
  to: string;
}

/**
 * The P&L page's period control: a Statement / By month toggle, the shared
 * date-range pill switched to month granularity (so presets and Custom all
 * produce whole months, picked from the same month grid in both views), and
 * a month stepper for single-month statements. URL-driven — every click
 * writes `view`/`from`/`to` and the server page refetches — so every view is
 * linkable and the back button works.
 */
export function PlPeriodControl({ view, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<PendingKey>(null);

  const wholeMonth = view === "statement" && isWholeMonth(from, to);

  const navigate = (next: { view?: PlView; range?: PlRange }, key: PendingKey) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("view", next.view ?? view);
    qs.set("from", next.range?.from ?? from);
    qs.set("to", next.range?.to ?? to);
    setPendingKey(key);
    startTransition(() => {
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    });
  };

  const spinner = (key: PendingKey) =>
    isPending && pendingKey === key ? <Loader2 className="h-3 w-3 animate-spin" /> : null;

  return (
    <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
      {/* View toggle */}
      <div className={cn(pill, isPending && "opacity-60")}>
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate({ view: "statement" }, "statement")}
          className={cn(segButton, view === "statement" ? segActive : segIdle)}
        >
          {spinner("statement")}
          Statement
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => navigate({ view: "monthly" }, "monthly")}
          className={cn(segButton, view === "monthly" ? segActive : segIdle)}
        >
          {spinner("monthly")}
          By month
        </button>
      </div>

      {/* Presets + Custom month picker — the same control as every other
          screen's date filter, in month granularity. It writes `from`/`to`
          and keeps `view` because it preserves the other query params. */}
      <DateRangeSegmented
        from={from}
        to={to}
        presets={view === "statement" ? STATEMENT_PRESETS : MONTHLY_PRESETS}
        defaultPreset={view === "statement" ? "month" : "year"}
        granularity="month"
        maxMonths={view === "monthly" ? MAX_MONTHLY_SPAN : undefined}
      />

      {/* Month stepper — single-month statements only */}
      {wholeMonth && (
        <div className={cn(pill, isPending && "opacity-60")}>
          <button
            type="button"
            aria-label="Previous month"
            disabled={isPending}
            onClick={() => navigate({ range: stepMonth(from, -1) }, "prev")}
            className={cn(segButton, segIdle, "px-2")}
          >
            {spinner("prev") ?? <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <span className="px-2 text-[12.5px] font-semibold text-ink">
            {formatMonthLabel(from)}
          </span>
          <button
            type="button"
            aria-label="Next month"
            disabled={isPending || !canStepForward(from)}
            onClick={() => navigate({ range: stepMonth(from, 1) }, "next")}
            className={cn(segButton, segIdle, "px-2")}
          >
            {spinner("next") ?? <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}

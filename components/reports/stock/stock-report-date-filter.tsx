"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRangeSegmented } from "@/components/filters/date-range-segmented";

interface Props {
  /** Snapshot date — drives the Closing column ("on hand as of"). */
  asOf: string;
  /** Range start (yyyy-MM-dd). Drives the movement period. */
  from: string;
  /** Range end (yyyy-MM-dd). */
  to: string;
}

/**
 * Dual filter for the stock report: a single-date "As of" chip (drives the
 * Closing position) plus the shared segmented period control (drives the
 * movement window). Both are URL-driven; the "As of" popover is capped at
 * today (you can't audit inventory that doesn't exist yet).
 */
export function StockReportDateFilter({ asOf, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [asOfOpen, setAsOfOpen] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const onApplyAsOf = (next: Date | undefined) => {
    if (!next) return;
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("asOf", format(next, "yyyy-MM-dd"));
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    setAsOfOpen(false);
  };

  const asOfLabel = format(new Date(asOf), "MMM d, yyyy");

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* ── As-of single date ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          As of
        </span>
        <Popover open={asOfOpen} onOpenChange={setAsOfOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-[34px] items-center gap-2 rounded-[9px] border border-line-2 bg-card px-[13px] text-[12.5px] font-semibold text-ink-2 transition-colors hover:bg-surface"
            >
              <CalendarClock className="h-3.5 w-3.5 text-ink-3" />
              {asOfLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={new Date(asOf)}
              defaultMonth={new Date(asOf)}
              onSelect={onApplyAsOf}
              disabled={{ after: today }}
              toDate={today}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Movement period ────────────────────────────────────── */}
      <DateRangeSegmented from={from} to={to} label="Period" />
    </div>
  );
}

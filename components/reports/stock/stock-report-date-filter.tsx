"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { CalendarClock, CalendarRange } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Preset = "today" | "yesterday" | "week" | "month" | "custom";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

function getPresetRange(preset: Exclude<Preset, "custom">, now = new Date()) {
  switch (preset) {
    case "today":
      return { from: fmt(now), to: fmt(now) };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "week":
      return {
        from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case "month":
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  }
}

function detectPreset(from: string, to: string): Preset {
  for (const p of ["today", "yesterday", "week", "month"] as const) {
    const range = getPresetRange(p);
    if (range.from === from && range.to === to) return p;
  }
  return "custom";
}

interface Props {
  /** Snapshot date — drives "as-of" KPIs and the stock-levels table. */
  asOf: string;
  /** Range start (yyyy-MM-dd). Drives trend charts and movement. */
  from: string;
  /** Range end (yyyy-MM-dd). */
  to: string;
}

/**
 * Dual filter bar for the stock report.
 *
 * Stock has two natural time axes — what does inventory look like
 * RIGHT NOW (as-of snapshot) and what changed OVER A PERIOD (range).
 * Both controls are URL-driven; switching either resets `page` since
 * the filter slice changes.
 *
 * `asOf` defaults to today; the as-of popover is disabled to future
 * dates (you can't audit inventory that doesn't exist yet).
 */
export function StockReportDateFilter({ asOf, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activePreset = useMemo(() => detectPreset(from, to), [from, to]);

  const [asOfOpen, setAsOfOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>({
    from: new Date(from),
    to: new Date(to),
  });

  const apply = (next: Partial<{ asOf: string; from: string; to: string }>) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(next)) {
      if (v) qs.set(k, v);
    }
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const onPreset = (preset: Exclude<Preset, "custom">) => {
    apply(getPresetRange(preset));
  };

  const onApplyRange = () => {
    if (!draftRange?.from) return;
    apply({
      from: fmt(draftRange.from),
      to: fmt(draftRange.to ?? draftRange.from),
    });
    setRangeOpen(false);
  };

  const onApplyAsOf = (next: Date | undefined) => {
    if (!next) return;
    apply({ asOf: fmt(next) });
    setAsOfOpen(false);
  };

  const rangeLabel =
    from && to && from === to
      ? format(new Date(from), "MMM d, yyyy")
      : from && to
        ? `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`
        : "Pick range";

  const asOfLabel = format(new Date(asOf), "MMM d, yyyy");

  const presets: Array<{ key: Exclude<Preset, "custom">; label: string }> = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── As-of date ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          As of
        </span>
        <Popover open={asOfOpen} onOpenChange={setAsOfOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-[12.5px]"
            >
              <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
              {asOfLabel}
            </Button>
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

      <div className="hidden h-5 w-px bg-line md:block" />

      {/* ── Range presets + custom ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Period
        </span>
        {presets.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={activePreset === key ? "default" : "outline"}
            className={cn(
              "h-8 text-[12.5px]",
              activePreset === key ? "" : "border-dashed",
            )}
            onClick={() => onPreset(key)}
          >
            {label}
          </Button>
        ))}

        <Popover
          open={rangeOpen}
          onOpenChange={(open) => {
            setRangeOpen(open);
            if (open) {
              setDraftRange({ from: new Date(from), to: new Date(to) });
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant={activePreset === "custom" ? "default" : "outline"}
              className={cn(
                "h-8 text-[12.5px]",
                activePreset === "custom" ? "" : "border-dashed",
              )}
            >
              <CalendarRange className="mr-1.5 h-3.5 w-3.5" />
              {activePreset === "custom" ? rangeLabel : "Custom"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={draftRange?.from}
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={2}
              disabled={{ after: today }}
              toDate={today}
              initialFocus
            />
            <div className="flex items-center justify-end gap-2 border-t border-line p-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRangeOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onApplyRange}
                disabled={!draftRange?.from}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

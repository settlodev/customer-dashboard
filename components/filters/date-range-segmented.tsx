"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  detectPreset,
  formatRangeLabel,
  getPresetRange,
  RANGE_PRESETS,
  type RangePreset,
} from "@/lib/date-range";

const fmt = (d: Date) => format(d, "yyyy-MM-dd");

const segButton =
  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors";
const segActive = "bg-primary text-primary-foreground shadow-sm";
const segIdle = "text-ink-3 hover:text-ink";

interface Props {
  /** Current `from` URL param (yyyy-MM-dd). */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). */
  to: string;
  /**
   * Show an "All" segment that clears the range (drops `from`/`to`). Use on
   * list pages that default to every row; leave off for period-scoped reports.
   */
  allowClear?: boolean;
  /** Optional mono label rendered before the control (e.g. "Period"). */
  label?: string;
  className?: string;
}

/**
 * The dashboard's standard date-range control — a segmented pill of presets
 * (Today / Yesterday / This week / This month) plus a Custom range popover.
 * URL-driven: writes `from`/`to` and resets `page`. Every dashboard date
 * filter renders through this so they all share one look.
 */
export function DateRangeSegmented({
  from,
  to,
  allowClear = false,
  label,
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isAll = !from && !to;
  const activePreset = useMemo<RangePreset | null>(
    () => (isAll ? null : detectPreset(from, to)),
    [isAll, from, to],
  );

  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(
    from || to
      ? {
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
        }
      : undefined,
  );

  const apply = (next: { from: string; to: string }) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("from", next.from);
    qs.set("to", next.to);
    // Switching the range invalidates the current page.
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const clear = () => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.delete("from");
    qs.delete("to");
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const onApplyCustom = () => {
    if (!draft?.from) return;
    apply({ from: fmt(draft.from), to: fmt(draft.to ?? draft.from) });
    setCustomOpen(false);
  };

  const isCustom = activePreset === "custom";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      )}
      <div className="inline-flex items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px]">
        {allowClear && (
          <button
            type="button"
            onClick={clear}
            className={cn(segButton, isAll ? segActive : segIdle)}
          >
            All
          </button>
        )}
        {RANGE_PRESETS.map(({ key, label: presetLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => apply(getPresetRange(key))}
            className={cn(segButton, activePreset === key ? segActive : segIdle)}
          >
            {presetLabel}
          </button>
        ))}

        <Popover
          open={customOpen}
          onOpenChange={(open) => {
            setCustomOpen(open);
            if (open) {
              setDraft(
                from || to
                  ? {
                      from: from ? new Date(from) : undefined,
                      to: to ? new Date(to) : undefined,
                    }
                  : undefined,
              );
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(segButton, isCustom ? segActive : segIdle)}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              {isCustom ? formatRangeLabel(from, to) : "Custom"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              defaultMonth={draft?.from}
              selected={draft}
              onSelect={setDraft}
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
                onClick={() => setCustomOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onApplyCustom}
                disabled={!draft?.from}
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

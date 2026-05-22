"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PackageComparisonMode,
  PackageDateRange,
} from "@/types/admin/billing";

interface DateFilterBarProps {
  range: PackageDateRange;
  comparisonMode: PackageComparisonMode;
  /** Comparison range the server resolved — shown next to the picker. */
  comparisonRange: PackageDateRange | null;
}

type PresetKey = "7d" | "30d" | "90d" | "ytd" | "12mo";

interface Preset {
  key: PresetKey;
  label: string;
  resolve: () => PackageDateRange;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const PRESETS: Preset[] = [
  {
    key: "7d",
    label: "7 days",
    resolve: () => {
      const to = todayUtc();
      return { from: isoDay(addDays(to, -6)), to: isoDay(to) };
    },
  },
  {
    key: "30d",
    label: "30 days",
    resolve: () => {
      const to = todayUtc();
      return { from: isoDay(addDays(to, -29)), to: isoDay(to) };
    },
  },
  {
    key: "90d",
    label: "90 days",
    resolve: () => {
      const to = todayUtc();
      return { from: isoDay(addDays(to, -89)), to: isoDay(to) };
    },
  },
  {
    key: "ytd",
    label: "YTD",
    resolve: () => {
      const to = todayUtc();
      const from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1));
      return { from: isoDay(from), to: isoDay(to) };
    },
  },
  {
    key: "12mo",
    label: "12 mo",
    resolve: () => {
      const to = todayUtc();
      const from = new Date(to);
      from.setUTCMonth(from.getUTCMonth() - 12);
      return { from: isoDay(from), to: isoDay(to) };
    },
  },
];

function rangesMatch(a: PackageDateRange, b: PackageDateRange): boolean {
  return a.from === b.from && a.to === b.to;
}

function formatDisplay(range: PackageDateRange): string {
  try {
    const f = format(new Date(`${range.from}T00:00:00Z`), "MMM d, yyyy");
    const t = format(new Date(`${range.to}T00:00:00Z`), "MMM d, yyyy");
    return `${f} – ${t}`;
  } catch {
    return `${range.from} → ${range.to}`;
  }
}

export function DateFilterBar({
  range,
  comparisonMode,
  comparisonRange,
}: DateFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [pendingCustom, setPendingCustom] = useState<DateRange | undefined>({
    from: new Date(`${range.from}T00:00:00Z`),
    to: new Date(`${range.to}T00:00:00Z`),
  });

  const pushRange = (next: PackageDateRange, mode?: PackageComparisonMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", next.from);
    params.set("to", next.to);
    if (mode !== undefined) {
      if (mode === "none") {
        params.delete("compare");
      } else {
        params.set("compare", mode);
      }
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const applyCustom = () => {
    if (!pendingCustom?.from) return;
    const from = isoDay(
      new Date(
        Date.UTC(
          pendingCustom.from.getUTCFullYear(),
          pendingCustom.from.getUTCMonth(),
          pendingCustom.from.getUTCDate(),
        ),
      ),
    );
    const toSource = pendingCustom.to ?? pendingCustom.from;
    const to = isoDay(
      new Date(
        Date.UTC(
          toSource.getUTCFullYear(),
          toSource.getUTCMonth(),
          toSource.getUTCDate(),
        ),
      ),
    );
    pushRange({ from, to });
    setCustomOpen(false);
  };

  const activePresetKey = PRESETS.find((p) => rangesMatch(p.resolve(), range))?.key ?? "custom";
  const today = todayUtc();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="tablist"
        aria-label="Date range"
        className="inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
      >
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={activePresetKey === p.key}
            onClick={() => pushRange(p.resolve())}
            className={cn(
              "rounded-[5px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              activePresetKey === p.key
                ? "bg-canvas text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 justify-start gap-2 text-left text-[12.5px] font-normal",
              activePresetKey !== "custom" && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDisplay(range)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={pendingCustom?.from ?? today}
            selected={pendingCustom}
            onSelect={setPendingCustom}
            numberOfMonths={2}
            disabled={{ after: today }}
            toDate={today}
            initialFocus
          />
          <div className="flex items-center justify-end gap-2 p-3 pt-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPendingCustom(undefined)}
              disabled={!pendingCustom?.from}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={applyCustom}
              disabled={!pendingCustom?.from}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Comparison picker — kept as a single select to keep the strip
          compact. The label area beneath the select shows the resolved
          comparison range so the user can sanity-check what
          "previous period" or "previous year" actually means. */}
      <div className="ml-auto flex items-center gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Compare
        </span>
        <Select
          value={comparisonMode}
          onValueChange={(v) =>
            pushRange(range, v as PackageComparisonMode)
          }
        >
          <SelectTrigger className="h-9 w-[180px] text-[12.5px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No comparison</SelectItem>
            <SelectItem value="previous_period">Previous period</SelectItem>
            <SelectItem value="previous_year">Same period, last year</SelectItem>
          </SelectContent>
        </Select>
        {comparisonRange && comparisonMode !== "none" && (
          <span className="font-mono text-[11px] text-muted-foreground">
            vs {formatDisplay(comparisonRange)}
          </span>
        )}
      </div>
    </div>
  );
}

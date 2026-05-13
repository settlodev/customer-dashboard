"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
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

/**
 * Computes preset ranges keyed off `now`. Weeks start on Monday — matches
 * how Settlo locations close their books in our reporting code.
 */
function getPresetRange(preset: Exclude<Preset, "custom">, now = new Date()) {
  switch (preset) {
    case "today": {
      return { from: fmt(now), to: fmt(now) };
    }
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "week": {
      return {
        from: fmt(startOfWeek(now, { weekStartsOn: 1 })),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 })),
      };
    }
    case "month": {
      return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
    }
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
  /** Current `from` URL param (yyyy-MM-dd). */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). */
  to: string;
}

export function OrdersDateFilter({ from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const activePreset = useMemo(() => detectPreset(from, to), [from, to]);

  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>({
    from: new Date(from),
    to: new Date(to),
  });

  const apply = (next: { from: string; to: string }) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("from", next.from);
    qs.set("to", next.to);
    // Reset paging — switching the range invalidates the current page.
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  const onPreset = (preset: Exclude<Preset, "custom">) => {
    apply(getPresetRange(preset));
  };

  const onApplyCustom = () => {
    if (!draft?.from) return;
    apply({
      from: fmt(draft.from),
      to: fmt(draft.to ?? draft.from),
    });
    setCustomOpen(false);
  };

  const customLabel =
    from && to && from === to
      ? format(new Date(from), "MMM d, yyyy")
      : from && to
        ? `${format(new Date(from), "MMM d")} – ${format(new Date(to), "MMM d, yyyy")}`
        : "Pick range";

  const presets: Array<{ key: Exclude<Preset, "custom">; label: string }> = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This week" },
    { key: "month", label: "This month" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
        open={customOpen}
        onOpenChange={(open) => {
          setCustomOpen(open);
          if (open) {
            setDraft({ from: new Date(from), to: new Date(to) });
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
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {activePreset === "custom" ? customLabel : "Custom"}
          </Button>
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
  );
}

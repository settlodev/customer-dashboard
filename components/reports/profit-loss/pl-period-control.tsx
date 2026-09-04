"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  canStepForward,
  detectPlPreset,
  formatMonthLabel,
  isWholeMonth,
  lastTwelveMonths,
  MAX_MONTHLY_SPAN,
  parseDay,
  stepMonth,
  thisMonth,
  thisYear,
  type PlPreset,
  type PlRange,
  type PlView,
} from "@/lib/pl-period";
import { endOfMonth, format, startOfMonth } from "date-fns";

// Same segmented-pill vocabulary as the shared date-range control, so the two
// look identical side by side. Not imported: those constants are private to it.
const segButton =
  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors disabled:opacity-50";
const segActive = "bg-primary text-primary-foreground shadow-sm";
const segIdle = "text-ink-3 hover:text-ink";
const pill =
  "inline-flex max-w-full items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px] align-middle transition-opacity";
const nativeInput =
  "h-8 rounded-md border border-line-2 bg-card px-2 text-[12.5px] text-ink outline-none focus:ring-2 focus:ring-primary/30";

type PendingKey = PlView | PlPreset | "prev" | "next" | null;

interface Props {
  view: PlView;
  /** Current `from` URL param (yyyy-MM-dd). */
  from: string;
  /** Current `to` URL param (yyyy-MM-dd). */
  to: string;
}

/**
 * The P&L page's period control: a Statement / By month toggle, per-view
 * presets, a month stepper for whole-month statements, and a Custom popover.
 * URL-driven — every click writes `view`/`from`/`to` and the server page
 * refetches — so every view is linkable and the back button works.
 */
export function PlPeriodControl({ view, from, to }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<PendingKey>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const preset = detectPlPreset(view, from, to);
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

  const presets: Array<{ key: PlPreset; label: string; range: () => PlRange }> =
    view === "statement"
      ? [
          { key: "month", label: "This month", range: () => thisMonth() },
          { key: "year", label: "This year", range: () => thisYear() },
        ]
      : [
          { key: "year", label: "This year", range: () => thisYear() },
          { key: "last12", label: "Last 12 months", range: () => lastTwelveMonths() },
        ];

  const openCustom = (open: boolean) => {
    setCustomOpen(open);
    if (open) {
      setDraftFrom(from);
      setDraftTo(to);
    }
  };

  // In monthly view the inputs are month pickers (yyyy-MM); the range they
  // produce is whole months, first day to last, capped at MAX_MONTHLY_SPAN.
  // Drafts start as yyyy-MM-dd (from the URL) and become yyyy-MM once the
  // month input is edited, so always take the first seven characters.
  const applyCustom = () => {
    if (view === "monthly") {
      const f = parseDay(`${draftFrom.slice(0, 7)}-01`);
      const t = parseDay(`${draftTo.slice(0, 7)}-01`);
      if (!f || !t) return;
      const range = {
        from: format(startOfMonth(f), "yyyy-MM-dd"),
        to: format(endOfMonth(t), "yyyy-MM-dd"),
      };
      navigate({ range: range.from <= range.to ? range : { from: range.to, to: range.from } }, "custom");
    } else {
      const f = parseDay(draftFrom);
      const t = parseDay(draftTo);
      if (!f || !t) return;
      navigate({ range: draftFrom <= draftTo ? { from: draftFrom, to: draftTo } : { from: draftTo, to: draftFrom } }, "custom");
    }
    setCustomOpen(false);
  };

  const spinner = (key: PendingKey) =>
    isPending && pendingKey === key ? <Loader2 className="h-3 w-3 animate-spin" /> : null;

  return (
    <div className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-2", isPending && "opacity-60")}>
      {/* View toggle */}
      <div className={pill}>
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

      {/* Presets + custom */}
      <div className={pill}>
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            disabled={isPending}
            onClick={() => navigate({ range: p.range() }, p.key)}
            className={cn(segButton, preset === p.key ? segActive : segIdle)}
          >
            {spinner(p.key)}
            {p.label}
          </button>
        ))}
        <Popover open={customOpen} onOpenChange={openCustom}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className={cn(segButton, preset === "custom" ? segActive : segIdle)}
            >
              {spinner("custom") ?? <CalendarRange className="h-3.5 w-3.5" />}
              Custom
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="end">
            <div className="flex items-end gap-2">
              <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                From
                <input
                  type={view === "monthly" ? "month" : "date"}
                  className={nativeInput}
                  value={view === "monthly" ? draftFrom.slice(0, 7) : draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                To
                <input
                  type={view === "monthly" ? "month" : "date"}
                  className={nativeInput}
                  value={view === "monthly" ? draftTo.slice(0, 7) : draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                />
              </label>
            </div>
            {view === "monthly" && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Up to {MAX_MONTHLY_SPAN} months. Longer ranges keep the most recent months.
              </p>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomOpen(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={applyCustom}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Month stepper — whole-month statements only */}
      {wholeMonth && (
        <div className={pill}>
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

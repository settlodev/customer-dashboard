"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarRange, Loader2 } from "lucide-react";
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

/**
 * Order presets give up their seat in when the control runs out of room —
 * lowest value to the operator first. "Today" and the page's own default are
 * never in here, so the control always keeps the range you opened on plus the
 * one everybody reaches for.
 */
const COLLAPSE_ORDER: Array<Exclude<RangePreset, "custom">> = [
  "week",
  "yesterday",
  "month",
];

/** useLayoutEffect that doesn't warn during SSR. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  /** Text for the clear segment. Defaults to "All". */
  allLabel?: string;
  /**
   * Controlled mode. When supplied the control stops writing `from`/`to` to the
   * URL and reports the new range here instead — for filters that live inside a
   * client widget (e.g. the stock movement ledger) rather than driving an RSC
   * refetch. Clearing reports `{ from: "", to: "" }`.
   */
  onChange?: (range: { from: string; to: string }) => void;
  /**
   * The preset this page falls back to when the URL carries no range. It is
   * never collapsed away, so the control always shows the window the page
   * actually opens on. Pages that default to "All" set {@link allowClear}
   * instead — that segment is never collapsed either.
   */
  defaultPreset?: Exclude<RangePreset, "custom">;
  className?: string;
}

/**
 * The dashboard's standard date-range control — a segmented pill of presets
 * (Today / Yesterday / This week / This month) plus a Custom range popover.
 * URL-driven: writes `from`/`to` and resets `page`. Every dashboard date
 * filter renders through this so they all share one look.
 *
 * The pill collapses to fit: when its box is too narrow it sheds presets in
 * {@link COLLAPSE_ORDER}, keeping Today, Custom, the active preset and the
 * page's {@link Props.defaultPreset}. Shed presets move into the Custom
 * popover, so nothing becomes unreachable. This is measured per-element
 * rather than keyed to a breakpoint, so a control squeezed into a narrow
 * column collapses on a desktop too.
 */
export function DateRangeSegmented({
  from,
  to,
  allowClear = false,
  label,
  allLabel = "All",
  onChange,
  defaultPreset = "month",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

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
  // While a transition is in flight, `from`/`to` (and thus `activePreset`)
  // still reflect the OLD url — React only swaps them in once the new RSC
  // payload commits. Track which segment was actually clicked so the spinner
  // lands on it instead of on the previously-active one.
  const [pendingKey, setPendingKey] = useState<RangePreset | "all" | null>(
    null,
  );

  const apply = (next: { from: string; to: string }, key: RangePreset) => {
    if (onChange) {
      onChange(next);
      return;
    }
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("from", next.from);
    qs.set("to", next.to);
    // Switching the range invalidates the current page.
    qs.delete("page");
    setPendingKey(key);
    startTransition(() => {
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    });
  };

  const clear = () => {
    if (onChange) {
      onChange({ from: "", to: "" });
      return;
    }
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.delete("from");
    qs.delete("to");
    qs.delete("page");
    setPendingKey("all");
    startTransition(() => {
      router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
    });
  };

  const onApplyCustom = () => {
    if (!draft?.from) return;
    apply(
      { from: fmt(draft.from), to: fmt(draft.to ?? draft.from) },
      "custom",
    );
    setCustomOpen(false);
  };

  const isCustom = activePreset === "custom";

  // ── Responsive collapse ────────────────────────────────────────────
  // Measured, not breakpointed: the control drops presets whenever its own
  // box is too narrow for them, so it behaves the same squeezed beside a KPI
  // row on a laptop as it does on a phone. Anything dropped stays reachable
  // from the Custom popover.
  const trackRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const [collapsedCount, setCollapsedCount] = useState(0);

  const collapsible = useMemo(
    () =>
      COLLAPSE_ORDER.filter(
        (key) => key !== defaultPreset && key !== activePreset,
      ),
    [defaultPreset, activePreset],
  );

  useIsoLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    let lastWidth = track.clientWidth;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      // Collapsing a segment doesn't change the track's width, so ignore the
      // echo — reacting to it would expand and re-collapse forever.
      if (Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      setCollapsedCount(0);
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  // The protected set changes when the active preset does — picking a shed
  // preset out of the popover has to bring it back into the pill — so start
  // the fit over rather than carrying a stale count.
  useIsoLayoutEffect(() => {
    setCollapsedCount(0);
  }, [collapsible]);

  // Shrink one segment per pass until the pill fits. No dependency array on
  // purpose: the Custom segment's label grows when a custom range is picked,
  // so the fit has to be re-checked after every render. Guarded by the
  // collapsible length, so it always settles.
  useIsoLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;
    if (
      collapsedCount < collapsible.length &&
      pill.scrollWidth > pill.clientWidth + 1
    ) {
      setCollapsedCount((count) => count + 1);
    }
  });

  const hiddenKeys = useMemo(
    () => new Set(collapsible.slice(0, collapsedCount)),
    [collapsible, collapsedCount],
  );
  const visiblePresets = RANGE_PRESETS.filter((p) => !hiddenKeys.has(p.key));
  const hiddenPresets = RANGE_PRESETS.filter((p) => hiddenKeys.has(p.key));

  return (
    <div className={cn("flex min-w-0 max-w-full flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
      )}
      <div ref={trackRef} className="min-w-0 max-w-full">
      <div
        ref={pillRef}
        className={cn(
          // Last-resort overflow scrolls inside the pill rather than pushing
          // the page sideways, which is what a long preset row used to do.
          "no-scrollbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[10px] border border-line-2 bg-card p-[3px] align-middle transition-opacity",
          isPending && "opacity-60",
        )}
      >
        {allowClear && (
          <button
            type="button"
            onClick={clear}
            disabled={isPending}
            className={cn(segButton, isAll ? segActive : segIdle)}
          >
            {isPending && pendingKey === "all" && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {allLabel}
          </button>
        )}
        {visiblePresets.map(({ key, label: presetLabel }) => (
          <button
            key={key}
            type="button"
            onClick={() => apply(getPresetRange(key), key)}
            disabled={isPending}
            className={cn(segButton, activePreset === key ? segActive : segIdle)}
          >
            {isPending && pendingKey === key && (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
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
              disabled={isPending}
              className={cn(segButton, isCustom ? segActive : segIdle)}
            >
              {isPending && pendingKey === "custom" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarRange className="h-3.5 w-3.5" />
              )}
              {isCustom ? formatRangeLabel(from, to) : "Custom"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0" align="end">
            {hiddenPresets.length > 0 && (
              // The presets that didn't fit still live here, so narrowing the
              // screen hides them from the pill without losing them.
              <div className="border-b border-line p-3">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  Quick ranges
                </p>
                <div className="flex flex-wrap gap-2">
                  {hiddenPresets.map(({ key, label: presetLabel }) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        apply(getPresetRange(key), key);
                        setCustomOpen(false);
                      }}
                    >
                      {presetLabel}
                    </Button>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
}

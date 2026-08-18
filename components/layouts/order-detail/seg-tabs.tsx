"use client";

/**
 * SegTabs — the `.od-seg` segmented drill-down control. Split out from
 * `primitives.tsx` because it's the only primitive in this module that
 * attaches an event handler (`onClick`) and therefore needs the client
 * boundary — keeping it in its own file lets the rest of
 * `components/layouts/order-detail` stay server-safe instead of forcing
 * `"use client"` on the whole barrel.
 */

import { cn } from "@/lib/utils";

export interface SegTab<T extends string = string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function SegTabs<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: SegTab<T>[];
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="overflow-x-auto pb-0.5">
      <div
        role="tablist"
        className="inline-flex items-center gap-0.5 rounded-[10px] border border-line-2 bg-card p-[3px]"
      >
        {tabs.map((tb) => {
          const on = active === tb.id;
          const Icon = tb.icon;
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onSelect(tb.id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                on
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", on ? "opacity-100" : "opacity-70")} />
              {tb.label}
              {tb.count != null && (
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold leading-none",
                    on ? "bg-white/20 text-white" : "bg-canvas text-ink-3",
                  )}
                >
                  {tb.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

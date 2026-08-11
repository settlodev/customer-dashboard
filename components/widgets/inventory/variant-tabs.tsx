"use client";

import { cn } from "@/lib/utils";

export interface VariantTabOption {
  id: string;
  label: string;
  /** Optional count shown beside the label. Omitted when 0 or undefined. */
  count?: number;
}

interface Props {
  options: VariantTabOption[];
  activeId: string;
  onChange: (id: string) => void;
  /** Accessible name for the tablist, e.g. "Variant movements". */
  ariaLabel: string;
  className?: string;
}

/**
 * The variant selector shared by the stock item's per-variant panels
 * (movements, batches). Each variant is inspected on its own — a stock's
 * 300ml and 500ml entries never interleave — so every panel that drills into
 * one variant at a time renders through this and they all look the same.
 *
 * Hidden entirely when there's only one variant to choose from.
 */
export function VariantTabs({
  options,
  activeId,
  onChange,
  ariaLabel,
  className,
}: Props) {
  if (options.length <= 1) return null;

  return (
    <div className={cn("-mx-1 overflow-x-auto px-1", className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-1 rounded-lg bg-muted p-1"
      >
        {options.map((o) => {
          const isActive = o.id === activeId;
          return (
            <button
              key={o.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(o.id)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
              {o.count != null && o.count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({o.count.toLocaleString()})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

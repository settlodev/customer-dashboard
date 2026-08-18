"use client";

import Link from "next/link";
import { Building2, ShoppingCart, Tag, Users, Utensils } from "lucide-react";

import { cn } from "@/lib/utils";

export type SalesTab = "staff" | "product" | "category" | "department" | "table";

/** The tab shown when no `?tab=` param is present. */
export const DEFAULT_SALES_TAB: SalesTab = "staff";

interface Props {
  active: SalesTab;
  /**
   * Which dimensions to render. The page decides this — e.g. "table" is
   * dropped for locations that don't run a table system.
   */
  tabs: SalesTab[];
  /** Carried across tab switches so the shared date range sticks. */
  preservedParams: Record<string, string | undefined>;
}

const TAB_META: Record<
  SalesTab,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  staff: { label: "By staff", icon: Users },
  product: { label: "By product", icon: ShoppingCart },
  category: { label: "By category", icon: Tag },
  department: { label: "By department", icon: Building2 },
  table: { label: "By table", icon: Utensils },
};

/**
 * URL-driven tab nav for the sales report. Each tab is a focused view of
 * the same period from a different angle (staff / product / category /
 * table). The `?tab=` param flips which one renders while the date range
 * persists across switches. Per-tab scope (search, page, sort) is dropped
 * on switch — page 3 of "By staff" has nothing to do with "By product".
 */
export function SalesTabNav({ active, tabs, preservedParams }: Props) {
  const buildHref = (tab: SalesTab) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      if (v) qs.set(k, v);
    }
    if (tab !== DEFAULT_SALES_TAB) qs.set("tab", tab);
    const query = qs.toString();
    return `/report/sales${query ? `?${query}` : ""}`;
  };

  return (
    <div className="-mx-1 flex overflow-x-auto pb-1">
      <div
        role="tablist"
        aria-label="Sales report dimensions"
        className="inline-flex items-center gap-0.5 rounded-md bg-muted p-1 text-muted-foreground"
      >
        {tabs.map((key) => {
          const { label, icon: Icon } = TAB_META[key];
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={buildHref(key)}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-[13px] font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:text-foreground/80",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

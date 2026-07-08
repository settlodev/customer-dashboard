"use client";

import Link from "next/link";
import { PackageCheck, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

export type PackagingTab = "deposit" | "flow";

interface Props {
  active: PackagingTab;
  /** URL params carried across when switching tabs (date filters). */
  preservedParams: Record<string, string | undefined>;
}

const TABS: Array<{
  key: PackagingTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "deposit", label: "Deposit & empties", icon: PackageCheck },
  { key: "flow", label: "Flow", icon: TrendingUp },
];

/**
 * URL-driven tab nav for the packaging report. Mirrors `StockTabNav` —
 * the `?tab=` param flips which view renders, while the date range
 * persists across switches.
 */
export function PackagingTabNav({ active, preservedParams }: Props) {
  const buildHref = (tab: PackagingTab) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      if (v && k !== "page" && k !== "tab") qs.set(k, v);
    }
    if (tab !== "deposit") qs.set("tab", tab);
    const query = qs.toString();
    return `/report/packaging${query ? `?${query}` : ""}`;
  };

  return (
    <div className="-mx-1 flex overflow-x-auto pb-1">
      <div
        role="tablist"
        aria-label="Packaging report sections"
        className="inline-flex items-center gap-0.5 rounded-md bg-muted p-1 text-muted-foreground"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={buildHref(t.key)}
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
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

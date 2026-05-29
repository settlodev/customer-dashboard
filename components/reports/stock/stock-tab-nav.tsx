"use client";

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  Clock,
  History,
  Lock,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type StockTab =
  | "overview"
  | "levels"
  | "movement"
  | "risk"
  | "aging"
  | "reservations"
  | "activity";

interface Props {
  active: StockTab;
  /** URL params carried across when switching tabs (date filters, search). */
  preservedParams: Record<string, string | undefined>;
}

const TABS: Array<{
  key: StockTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "levels", label: "Stock levels", icon: Boxes },
  { key: "movement", label: "Movement", icon: TrendingUp },
  { key: "risk", label: "Risk & reorder", icon: ShieldAlert },
  { key: "aging", label: "Aging & expiry", icon: Clock },
  { key: "reservations", label: "Reservations", icon: Lock },
  { key: "activity", label: "Activity", icon: History },
];

/**
 * URL-driven tab nav for the stock report. Each tab is its own focused
 * view — the URL `?tab=` param flips which one renders, while date
 * filters and search persist across switches.
 *
 * Page state intentionally drops on switch (every tab has its own
 * pagination scope — page 3 of "Stock levels" has nothing to do with
 * page 3 of "Activity").
 */
export function StockTabNav({ active, preservedParams }: Props) {
  const buildHref = (tab: StockTab) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(preservedParams)) {
      if (v && k !== "page" && k !== "tab") qs.set(k, v);
    }
    if (tab !== "overview") qs.set("tab", tab);
    const query = qs.toString();
    return `/report/stock${query ? `?${query}` : ""}`;
  };

  return (
    <div className="-mx-1 flex overflow-x-auto pb-1">
      <div
        role="tablist"
        aria-label="Stock report sections"
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

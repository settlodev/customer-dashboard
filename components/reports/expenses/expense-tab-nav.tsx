"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export type ExpenseTab = "category" | "status";

const TAB_LABELS: Record<ExpenseTab, string> = {
  category: "By category",
  status: "By status",
};

interface Props {
  active: ExpenseTab;
  tabs: ExpenseTab[];
  preservedParams?: Record<string, string | undefined>;
}

export function ExpenseTabNav({ active, tabs, preservedParams }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (tab: ExpenseTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    Object.entries(preservedParams ?? {}).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return `${pathname}?${params.toString()}`;
  };

  return (
    <nav className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => (
        <Link
          key={tab}
          href={buildHref(tab)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === tab
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {TAB_LABELS[tab]}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Active / Inactive / All toggle for the customer list, driven by the
 * `?status=` URL param so the active tab survives a refresh and is
 * shareable. Resets `?page=` when switching tabs because the underlying
 * paginated data changes.
 */
export function CustomerStatusTabs({
  value,
  counts,
}: {
  value: "active" | "inactive" | "all";
  counts?: { active: number; inactive: number; all: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (next: "active" | "inactive" | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/customers?${qs}` : "/customers");
  };

  const TABS: Array<{
    id: "active" | "inactive" | "all";
    label: string;
  }> = [
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
    { id: "all", label: "All" },
  ];

  return (
    <div
      role="tablist"
      className="inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        const count = counts?.[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => handleChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              active ? "bg-canvas text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {tab.label}
            {count !== undefined && (
              <span
                className={cn(
                  "rounded-[3px] px-1.5 font-mono text-[10.5px] tracking-[0.02em]",
                  active
                    ? "border border-line bg-card text-ink-3"
                    : "bg-canvas text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

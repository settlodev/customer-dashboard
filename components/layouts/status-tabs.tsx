"use client";

/**
 * Reusable Active / Archived toggle for paginated list pages.
 *
 * Driven by the `?status=` URL param so the active tab survives a
 * refresh and is shareable. Resets `?page=` when switching tabs
 * because the underlying paginated data changes.
 *
 * Mirrors the look of the products list's `ProductStatusTabs` so the
 * inventory section reads as one consistent surface.
 *
 * Usage:
 *
 *   <StatusTabs basePath="/categories" value={status} />
 *
 * The list page is responsible for reading `searchParams.status` and
 * filtering its data; this component just owns the tab UI + URL.
 */

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ListStatus } from "./list-status";

export type { ListStatus };

export function StatusTabs({
  basePath,
  value,
}: {
  basePath: string;
  value: ListStatus;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (next: ListStatus) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const TABS: Array<{ id: ListStatus; label: string }> = [
    { id: "active", label: "Active" },
    { id: "archived", label: "Archived" },
  ];

  return (
    <div
      role="tablist"
      className="inline-flex w-fit items-center gap-0.5 rounded-md border border-line bg-card p-[3px]"
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
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
          </button>
        );
      })}
    </div>
  );
}


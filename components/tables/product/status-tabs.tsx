"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Active / Archived toggle for the products list, driven by the
 * `?status=` URL param so the active tab survives a page refresh and
 * is shareable. Resets `?page=` when switching tabs because the
 * underlying paginated data changes.
 *
 * Visual: design's `.tabs` pill — a hairline-bordered card with
 * inline pill-tabs that highlight via `bg-canvas` when active.
 */
export function ProductStatusTabs({
  value,
}: {
  value: "active" | "archived";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (next: "active" | "archived") => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  const TABS: Array<{ id: "active" | "archived"; label: string }> = [
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
              active
                ? "bg-canvas text-ink"
                : "text-ink-3 hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

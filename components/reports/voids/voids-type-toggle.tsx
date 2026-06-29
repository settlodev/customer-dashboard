"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  VOID_EVENT_TYPE_FILTER_OPTIONS,
  type VoidEventTypeFilter,
} from "@/lib/orders/void-events";

interface Props {
  /** Currently-active type from the URL, or "" for All. */
  active: VoidEventTypeFilter;
}

/**
 * URL-driven type pills for the voids report (All / Cancellations / Item
 * voids). Mirrors the sold-items status toggle: switching the active pill
 * rewrites `?type=` and drops `page` so the user doesn't land on an
 * out-of-range page.
 */
export function VoidsTypeToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: VoidEventTypeFilter) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "") {
      qs.delete("type");
    } else {
      qs.set("type", next);
    }
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {VOID_EVENT_TYPE_FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <Button
            key={value || "all"}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn("h-8 text-[12.5px]", isActive ? "" : "border-dashed")}
            onClick={() => apply(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SOLD_ITEM_STATUS_FILTER_OPTIONS,
  type SoldItemStatus,
} from "@/types/reports/sold-items";

interface Props {
  /** Currently-active status from the URL, or "" for All. */
  active: SoldItemStatus | "";
}

/**
 * URL-driven status pills for the sold-items report.
 *
 * Switching the active pill resets pagination — rows shown on page 3
 * of "All" don't line up with page 3 of "Refunded", so dropping `page`
 * avoids landing the user on an empty page.
 */
export function SoldItemsStatusToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: SoldItemStatus | "") => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "") {
      qs.delete("status");
    } else {
      qs.set("status", next);
    }
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {SOLD_ITEM_STATUS_FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <Button
            key={value || "all"}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            className={cn(
              "h-8 text-[12.5px]",
              isActive ? "" : "border-dashed",
            )}
            onClick={() => apply(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

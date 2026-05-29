"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TOP_SELLING_SORT_OPTIONS,
  type TopSellingSortBy,
} from "@/types/reports/top-selling";

interface Props {
  /** Current sort param from the URL. */
  active: TopSellingSortBy;
}

/**
 * URL-driven ranking selector. Flipping the metric resets pagination
 * because rank order changes — page 3 of "by revenue" has nothing to
 * do with page 3 of "by quantity".
 */
export function TopSellingSortToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: TopSellingSortBy) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "revenue") {
      qs.delete("sort");
    } else {
      qs.set("sort", next);
    }
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TOP_SELLING_SORT_OPTIONS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          size="sm"
          variant={active === value ? "default" : "outline"}
          className={cn(
            "h-8 text-[12.5px]",
            active === value ? "" : "border-dashed",
          )}
          onClick={() => apply(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

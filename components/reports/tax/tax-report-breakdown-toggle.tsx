"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaxReportBreakdown } from "@/types/reports/tax";

interface Props {
  active: TaxReportBreakdown;
}

const OPTIONS: Array<{ value: TaxReportBreakdown; label: string }> = [
  { value: "taxCode", label: "By tax code" },
  { value: "product", label: "By product" },
];

/** URL-driven breakdown toggle for the tax report table's grouping dimension. */
export function TaxReportBreakdownToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: TaxReportBreakdown) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("breakdown", next);
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {OPTIONS.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <Button
            key={value}
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

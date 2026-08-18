"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaxReportPeriod } from "@/types/reports/tax";

interface Props {
  active: TaxReportPeriod;
}

const OPTIONS: Array<{ value: TaxReportPeriod; label: string }> = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
];

/** URL-driven day/month toggle for the tax report — mirrors VoidsTypeToggle. */
export function TaxReportPeriodToggle({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (next: TaxReportPeriod) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("period", next);
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

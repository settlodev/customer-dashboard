"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CYCLE_COUNT_TYPE_OPTIONS } from "@/types/stock-take/type";

const ALL_VALUE = "ALL";

/**
 * URL-driven filter control placed next to the list header. Navigates to
 * the same route with `?cycleCountType=...` which the server page reads
 * and passes to the stock-take listing endpoint.
 */
export default function CycleCountTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("cycleCountType") ?? ALL_VALUE;

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === ALL_VALUE) next.delete("cycleCountType");
    else next.set("cycleCountType", value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All count types" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All count types</SelectItem>
        {CYCLE_COUNT_TYPE_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { ListFilter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Option = { label: string; value: string };

/**
 * Filters the categories list by department through the `?department=`
 * URL param. Filtering is server-side (the page paginates before the table
 * ever sees the rows), so the selection round-trips the URL. Re-selecting
 * the active department clears the filter.
 */
export function DepartmentFilter({ options }: { options: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (options.length === 0) return null;

  const active = searchParams.get("department") ?? "";
  const activeLabel = active
    ? options.find((o) => o.value === active)?.label
    : null;

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (active === value) {
      params.delete("department");
    } else {
      params.set("department", value);
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-dashed border-line-2 text-ink-3 hover:text-ink"
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span className="sm:whitespace-nowrap">
            {activeLabel ?? "Department"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        <DropdownMenuLabel>Filter by department</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.value}
            checked={active === o.value}
            onSelect={() => handleSelect(o.value)}
          >
            {o.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

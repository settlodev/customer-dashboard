"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SoldItemsFilterOption {
  value: string;
  label: string;
}

interface Props {
  /** Currently-selected department id, or "" for all. */
  departmentId: string;
  /** Currently-selected category id, or "" for all. */
  categoryId: string;
  /** Currently-selected staff id, or "" for all. */
  staffId: string;
  /** Departments at the current location. */
  departmentOptions: SoldItemsFilterOption[];
  /** Categories belonging to the current location's departments. */
  categoryOptions: SoldItemsFilterOption[];
  /** Staff at the current location. */
  staffOptions: SoldItemsFilterOption[];
}

// Radix Select forbids an empty-string item value, so "All" uses a sentinel.
const ALL = "__all__";

/**
 * URL-driven department/category/staff dropdowns for the sold-items report.
 * Each value is sent straight to `listSoldItems` as a backend query param
 * (see app/(protected)/report/sold-items/page.tsx) — filtering happens on
 * the reports service, not over the already-fetched rows.
 */
export function SoldItemsFilters({
  departmentId,
  categoryId,
  staffId,
  departmentOptions,
  categoryOptions,
  staffOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (
    key: "departmentId" | "categoryId" | "staffId",
    value: string,
  ) => {
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    if (!value || value === ALL) {
      qs.delete(key);
    } else {
      qs.set(key, value);
    }
    qs.delete("page");
    router.replace(`${pathname}?${qs.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={departmentId || ALL}
        onValueChange={(v) => apply("departmentId", v)}
      >
        <SelectTrigger className="h-8 w-[160px] text-[12.5px]">
          <SelectValue placeholder="All departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All departments</SelectItem>
          {departmentOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryId || ALL}
        onValueChange={(v) => apply("categoryId", v)}
      >
        <SelectTrigger className="h-8 w-[160px] text-[12.5px]">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categoryOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={staffId || ALL} onValueChange={(v) => apply("staffId", v)}>
        <SelectTrigger className="h-8 w-[160px] text-[12.5px]">
          <SelectValue placeholder="All staff" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All staff</SelectItem>
          {staffOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

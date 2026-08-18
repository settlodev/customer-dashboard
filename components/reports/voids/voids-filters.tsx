"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VoidsFilterOption {
  value: string;
  label: string;
}

interface Props {
  /** Currently-selected assigned-staff id, or "" for all. */
  staffId: string;
  /** Currently-selected void reason, or "" for all. */
  reason: string;
  /** Assignees present in the period's voided orders. */
  staffOptions: VoidsFilterOption[];
  /** Void reasons present in the period, with counts in the label. */
  reasonOptions: VoidsFilterOption[];
}

// Radix Select forbids an empty-string item value, so "All" uses a sentinel.
const ALL = "__all__";

/**
 * URL-driven reason + assigned-staff dropdowns for the voids report. Mirrors
 * the date filter: changing a value rewrites the query string and resets
 * pagination so the user doesn't land on an out-of-range page.
 */
export function VoidsFilters({
  staffId,
  reason,
  staffOptions,
  reasonOptions,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const apply = (key: "staffId" | "reason", value: string) => {
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
      <Select value={reason || ALL} onValueChange={(v) => apply("reason", v)}>
        <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
          <SelectValue placeholder="All reasons" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All reasons</SelectItem>
          {reasonOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={staffId || ALL} onValueChange={(v) => apply("staffId", v)}>
        <SelectTrigger className="h-8 w-[180px] text-[12.5px]">
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

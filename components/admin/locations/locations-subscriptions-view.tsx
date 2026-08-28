"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable } from "@/components/tables/data-table";
import { buildLocationColumns } from "@/components/admin/locations/columns";
import { cn } from "@/lib/utils";
import type {
  PlatformLocationsPage,
  PlatformLocationStatusCounts,
} from "@/types/admin/platform-metrics";

/**
 * Locations & subscriptions list. Server-paginated + URL-synced status tabs
 * (`?status=`) and free-text search — the table pushes `?page`/`?limit`/
 * `?search`/`?status` and the page re-queries the Reports Service.
 *
 * Tabs are NOT mutually exclusive in what they count: TRIAL is a derived
 * flag on top of ACTIVE (Billing has no TRIAL status), so a location on an
 * active trial shows up under both "Active" and "Trial" — same semantics
 * the single-select `status` filter already had.
 */

type StatusKey =
  | "all"
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "SUSPENDED"
  | "CANCELLED";

interface TabConfig {
  key: StatusKey;
  label: string;
  count: number;
  dotColor?: string;
}

interface LocationsSubscriptionsViewProps {
  page: PlatformLocationsPage;
  counts: PlatformLocationStatusCounts;
  initialStatus: string;
}

export function LocationsSubscriptionsView({
  page,
  counts,
  initialStatus,
}: LocationsSubscriptionsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const columns = useMemo(() => buildLocationColumns(), []);

  const tabs: TabConfig[] = [
    { key: "all", label: "All", count: counts.total },
    {
      key: "TRIAL",
      label: "Trial",
      count: counts.trial,
      dotColor: "#2563EB",
    },
    {
      key: "ACTIVE",
      label: "Active",
      count: counts.active,
      dotColor: "hsl(var(--pos))",
    },
    {
      key: "PAST_DUE",
      label: "Past due",
      count: counts.pastDue,
      dotColor: "hsl(var(--warn))",
    },
    {
      key: "EXPIRED",
      label: "Expired",
      count: counts.expired,
      dotColor: "hsl(var(--neg))",
    },
    {
      key: "SUSPENDED",
      label: "Suspended",
      count: counts.suspended,
      dotColor: "hsl(var(--warn))",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      count: counts.cancelled,
      dotColor: "#6B7280",
    },
  ];

  const activeTabKey: StatusKey =
    (tabs.find((t) => t.key === initialStatus)?.key as StatusKey | undefined) ??
    "all";

  const onTabClick = (key: StatusKey) => {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "all") next.delete("status");
    else next.set("status", key);
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Location subscription status"
        className="-mb-px flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab) => {
          const active = activeTabKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabClick(tab.key)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 pb-3 pt-2 text-[13.5px] transition-colors",
                active
                  ? "border-primary font-semibold text-ink"
                  : "border-transparent font-medium text-ink-3 hover:text-ink",
              )}
            >
              {tab.dotColor && (
                <span
                  className="h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: tab.dotColor }}
                />
              )}
              {tab.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-px font-mono text-[11px] font-semibold tracking-[0.02em]",
                  active
                    ? "bg-primary/12 text-[#C25E26]"
                    : "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
                )}
              >
                {tab.count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={page.content}
        searchKey="locationName"
        pageNo={page.page}
        total={page.totalElements}
        pageCount={Math.max(1, page.totalPages)}
        searchPlaceholder="Search locations…"
        disableArchive
      />
    </div>
  );
}

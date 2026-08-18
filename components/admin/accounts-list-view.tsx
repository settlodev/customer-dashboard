"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { DataTable } from "@/components/tables/data-table";
import { buildAccountColumns } from "@/components/tables/admin-accounts/column";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  AccountOnboardingCounts,
  AdminAccountListPage,
  OnboardingState,
} from "@/types/admin/account";

interface AccountsListViewProps {
  initialPage: AdminAccountListPage;
  counts: AccountOnboardingCounts;
  initialStatus: string;
  initialOnboardingState: string;
  initialFrom: string | null;
  initialTo: string | null;
  canSuspend: boolean;
  canDelete: boolean;
}

interface TabConfig {
  key: "all" | OnboardingState;
  label: string;
  count: number;
  /** Colour of the leading status dot (omitted for the "All" tab). */
  dotColor?: string;
}

function parseDateInput(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function AccountsListView({
  initialPage,
  counts,
  initialStatus,
  initialOnboardingState,
  initialFrom,
  initialTo,
  canSuspend,
  canDelete,
}: AccountsListViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<DateRange | undefined>({
    from: parseDateInput(initialFrom),
    to: parseDateInput(initialTo),
  });

  const updateParams = useCallback(
    (changes: Record<string, string | null | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      const queryString = next.toString();
      startTransition(() => {
        router.push(
          queryString ? `${pathname}?${queryString}` : pathname,
          { scroll: false },
        );
      });
    },
    [pathname, router, searchParams],
  );

  const columns = useMemo(
    () => buildAccountColumns({ canSuspend, canDelete }),
    [canSuspend, canDelete],
  );

  const tabs: TabConfig[] = [
    { key: "all", label: "All", count: counts.total },
    {
      key: "EMAIL_UNVERIFIED",
      label: "Email unverified",
      count: counts.emailUnverified,
      dotColor: "hsl(var(--neg))",
    },
    {
      key: "BUSINESS_INCOMPLETE",
      label: "Business pending",
      count: counts.businessIncomplete,
      dotColor: "hsl(var(--warn))",
    },
    {
      key: "LOCATION_INCOMPLETE",
      label: "Location pending",
      count: counts.locationIncomplete,
      dotColor: "#2563EB",
    },
    {
      key: "COMPLETE",
      label: "Fully registered",
      count: counts.complete,
      dotColor: "hsl(var(--pos))",
    },
  ];

  const onTabClick = (key: TabConfig["key"]) => {
    updateParams({
      state: key === "all" ? null : key,
      page: "1",
    });
  };

  const onStatusChange = (value: string) => {
    updateParams({
      // Route the whole lifecycle filter (active | inactive | deleted) through a
      // single `status` param and drop the legacy `active` param so a stale
      // `?active=` can't fight the new selection. page.tsx reads `status`.
      status: value === "all" ? null : value,
      active: null,
      page: "1",
    });
  };

  const applyDateRange = () => {
    const from = pendingDate?.from
      ? format(pendingDate.from, "yyyy-MM-dd")
      : null;
    const to = pendingDate?.to ? format(pendingDate.to, "yyyy-MM-dd") : from;
    updateParams({ from, to, page: "1" });
    setDatePopoverOpen(false);
  };

  const clearDateRange = () => {
    setPendingDate(undefined);
    updateParams({ from: null, to: null, page: "1" });
  };

  const dateLabel = (() => {
    const from = parseDateInput(initialFrom);
    const to = parseDateInput(initialTo);
    if (!from) return "Filter by registration date";
    if (!to || +to === +from) return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  })();

  const hasDateFilter = !!initialFrom;
  const statusValue =
    initialStatus === "active" ||
    initialStatus === "inactive" ||
    initialStatus === "deleted"
      ? initialStatus
      : "all";
  const activeTabKey: TabConfig["key"] =
    (tabs.find((t) => t.key === initialOnboardingState)?.key as
      | TabConfig["key"]
      | undefined) ?? "all";

  const { content, totalElements, totalPages, number } = initialPage;
  const today = new Date();

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Current onboarding state"
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

      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[180px] text-[12.5px]">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Suspended only</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left text-[12.5px] font-normal",
                !hasDateFilter && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={pendingDate?.from ?? today}
              selected={pendingDate}
              onSelect={setPendingDate}
              numberOfMonths={2}
              disabled={{ after: today }}
              toDate={today}
              initialFocus
            />
            <div className="flex items-center justify-end gap-2 p-3 pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPendingDate(undefined)}
                disabled={!pendingDate?.from}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={applyDateRange}
                disabled={!pendingDate?.from}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {hasDateFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground hover:text-ink"
            onClick={clearDateRange}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear dates
          </Button>
        )}

        <span className="ml-auto font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No accounts"
            : `Page ${number + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="fullName"
        pageNo={number}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        rowClickBasePath="/accounts"
        manualSort
        disableArchive
      />
    </div>
  );
}

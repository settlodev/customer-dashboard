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
  initialSearch: string;
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
}

function parseDateInput(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function AccountsListView({
  initialPage,
  counts,
  initialSearch,
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
    },
    {
      key: "BUSINESS_INCOMPLETE",
      label: "Business pending",
      count: counts.businessIncomplete,
    },
    {
      key: "LOCATION_INCOMPLETE",
      label: "Location pending",
      count: counts.locationIncomplete,
    },
    {
      key: "COMPLETE",
      label: "Fully registered",
      count: counts.complete,
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
      active: value === "all" ? null : value === "active" ? "true" : "false",
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
    initialStatus === "active" || initialStatus === "inactive"
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
        className="inline-flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-card p-[3px]"
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
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                active
                  ? "bg-canvas text-ink"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-[3px] px-1.5 font-mono text-[10.5px] tracking-[0.02em]",
                  active
                    ? "border border-line bg-card text-ink-3"
                    : "bg-canvas text-muted-foreground",
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
        disableArchive
      />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { DataTable } from "@/components/tables/data-table";
import { buildActivityColumns } from "@/components/tables/admin-activity/column";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { ClientActivityPage } from "@/types/admin/activity-log";
import { PlatformLocationRow } from "@/types/admin/platform-metrics";

// Canonical client-activity event types emitted by the POS device
// (src/lib/activity/events.ts → ACTIVITY_EVENT). event_type is technically an
// open string server-side, so this is a known-set convenience, not a hard list.
const EVENT_TYPES: string[] = [
  "ORDER_CREATED",
  "ITEMS_ADDED",
  "ITEM_UPDATED",
  "ITEM_REMOVED",
  "ITEM_VOIDED",
  "ORDER_DISCOUNTED",
  "ITEM_DISCOUNTED",
  "TRANSACTION_ADDED",
  "ORDER_CLOSED",
  "ORDER_CANCELLED",
  "REFUND_CREATED",
  "ORDER_MERGED",
  "ORDER_SPLIT",
  "CUSTOMER_SET",
  "TABLE_SET",
  "LOCK_ACQUIRED",
  "LOCK_RELEASED",
  "LOCK_TAKEOVER",
  "PRINT_BILL",
  "PRINT_RECEIPT",
  "PRINT_DOCKET",
  "PRINT_EFD",
  "MUTATION_ENQUEUED",
  "MUTATION_DRAINED",
  "MUTATION_SOFT_DROPPED",
  "MUTATION_DEAD_LETTERED",
  "MUTATION_CONFLICT",
  "DAY_OPENED",
  "DAY_CLOSED",
  "STAFF_LOGIN",
  "STAFF_SWITCH",
  "STAFF_LOGOUT",
  "ACTIVITY_DROP",
];

interface ActivityLogViewProps {
  initialPage: ClientActivityPage;
  locations: PlatformLocationRow[];
  initialEventType: string;
  initialLocationId: string;
  initialDeviceId: string | null;
  initialStaffId: string | null;
  initialFrom: string | null;
  initialTo: string | null;
  defaultPageSize: number;
}

function parseDateInput(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function ActivityLogView({
  initialPage,
  locations,
  initialEventType,
  initialLocationId,
  initialDeviceId,
  initialStaffId,
  initialFrom,
  initialTo,
  defaultPageSize,
}: ActivityLogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [pendingDate, setPendingDate] = useState<DateRange | undefined>({
    from: parseDateInput(initialFrom),
    to: parseDateInput(initialTo),
  });
  const [deviceIdInput, setDeviceIdInput] = useState(initialDeviceId ?? "");
  const [staffIdInput, setStaffIdInput] = useState(initialStaffId ?? "");

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

  const locationNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      if (loc.locationId) map[loc.locationId] = loc.locationName;
    }
    return map;
  }, [locations]);

  const columns = useMemo(
    () => buildActivityColumns({ locationNameById }),
    [locationNameById],
  );

  const onEventTypeChange = (value: string) => {
    updateParams({ eventType: value === "all" ? null : value, page: "1" });
  };

  const onLocationChange = (value: string) => {
    updateParams({ locationId: value === "all" ? null : value, page: "1" });
  };

  const applyId = (key: "deviceId" | "staffId", value: string) => {
    updateParams({ [key]: value.trim() || null, page: "1" });
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
    if (!from) return "Filter by date";
    if (!to || +to === +from) return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  })();

  const hasDateFilter = !!initialFrom;
  const eventTypeValue = EVENT_TYPES.includes(initialEventType)
    ? initialEventType
    : "all";
  const locationValue = locationNameById[initialLocationId]
    ? initialLocationId
    : "all";

  const { content, totalElements, totalPages, page } = initialPage;
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={locationValue} onValueChange={onLocationChange}>
          <SelectTrigger className="h-9 w-[200px] text-[12.5px]">
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc.locationId} value={loc.locationId}>
                {loc.locationName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={eventTypeValue} onValueChange={onEventTypeChange}>
          <SelectTrigger className="h-9 w-[190px] text-[12.5px]">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {EVENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
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

        <Input
          value={deviceIdInput}
          onChange={(e) => setDeviceIdInput(e.target.value)}
          onBlur={() => applyId("deviceId", deviceIdInput)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyId("deviceId", deviceIdInput);
          }}
          placeholder="Device ID"
          className="h-9 w-[150px] text-[12.5px]"
        />
        <Input
          value={staffIdInput}
          onChange={(e) => setStaffIdInput(e.target.value)}
          onBlur={() => applyId("staffId", staffIdInput)}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyId("staffId", staffIdInput);
          }}
          placeholder="Staff ID"
          className="h-9 w-[150px] text-[12.5px]"
        />

        <span className="ml-auto font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No activity"
            : `Page ${page + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="orderNumber"
        searchPlaceholder="Search order # or UUID…"
        pageNo={page}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        defaultPageSize={defaultPageSize}
        disableArchive
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { DataTable } from "@/components/tables/data-table";
import { buildActivityColumns } from "@/components/tables/admin-activity/column";
import {
  LocationCombobox,
  locationDisplayLabel,
} from "@/components/admin/shared/location-combobox";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ClientActivityPage } from "@/types/admin/activity-log";
import { PlatformLocationRow } from "@/types/admin/platform-metrics";

// Canonical client-activity event types emitted by the POS device
// (src/lib/activity/events.ts → ACTIVITY_EVENT), bucketed into readable
// groups for the filter. event_type is technically an open string
// server-side, so this is a known-set convenience, not a hard list.
const EVENT_TYPE_GROUPS: { heading: string; types: string[] }[] = [
  {
    heading: "Order lifecycle",
    types: [
      "ORDER_CREATED",
      "ORDER_CLOSED",
      "ORDER_CANCELLED",
      "ORDER_MERGED",
      "ORDER_SPLIT",
    ],
  },
  {
    heading: "Items",
    types: ["ITEMS_ADDED", "ITEM_UPDATED", "ITEM_REMOVED", "ITEM_VOIDED"],
  },
  {
    heading: "Discounts & refunds",
    types: ["ORDER_DISCOUNTED", "ITEM_DISCOUNTED", "REFUND_CREATED"],
  },
  { heading: "Payments", types: ["TRANSACTION_ADDED"] },
  { heading: "Order context", types: ["CUSTOMER_SET", "TABLE_SET"] },
  {
    heading: "Locks",
    types: ["LOCK_ACQUIRED", "LOCK_RELEASED", "LOCK_TAKEOVER"],
  },
  {
    heading: "Printing",
    types: ["PRINT_BILL", "PRINT_RECEIPT", "PRINT_DOCKET", "PRINT_EFD"],
  },
  {
    heading: "Sync & mutations",
    types: [
      "MUTATION_ENQUEUED",
      "MUTATION_DRAINED",
      "MUTATION_SOFT_DROPPED",
      "MUTATION_DEAD_LETTERED",
      "MUTATION_CONFLICT",
      "ACTIVITY_DROP",
    ],
  },
  { heading: "Day", types: ["DAY_OPENED", "DAY_CLOSED"] },
  { heading: "Staff", types: ["STAFF_LOGIN", "STAFF_SWITCH", "STAFF_LOGOUT"] },
];

const KNOWN_EVENT_TYPES = new Set(
  EVENT_TYPE_GROUPS.flatMap((g) => g.types),
);

/** Sentinel for the "All events" row (maps to a cleared filter). */
const EVENT_ALL = "__all_events__";

const EVENT_OPTIONS: ComboboxOption[] = [
  { value: EVENT_ALL, label: "All events" },
  ...EVENT_TYPE_GROUPS.flatMap((g) =>
    g.types.map((t) => ({
      value: t,
      label: t,
      group: g.heading,
      mono: true,
    })),
  ),
];

const SEARCH_DEBOUNCE_MS = 350;

interface ActivityLogViewProps {
  initialPage: ClientActivityPage;
  locations: PlatformLocationRow[];
  initialEventType: string;
  initialLocationId: string;
  initialDeviceId: string | null;
  initialStaffId: string | null;
  initialFrom: string | null;
  initialTo: string | null;
  initialSearch: string | null;
  defaultPageSize: number;
}

function parseDateInput(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Trim a long opaque id for a compact chip. */
function shortenId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 10)}…` : value;
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
  initialSearch,
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
  const [searchInput, setSearchInput] = useState(initialSearch ?? "");
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
        router.push(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced free-text search → `?search` (UUID → exact target; otherwise
  // an order-number trace). We own this param now, so the DataTable's own
  // search box is hidden below (`hideSearch`).
  useEffect(() => {
    const trimmed = searchInput.trim();
    const current = searchParams.get("search") ?? "";
    if (trimmed === current) return;
    const handle = setTimeout(() => {
      updateParams({ search: trimmed || null, page: "1" });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, searchParams, updateParams]);

  const locationNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      if (loc.locationId) map[loc.locationId] = locationDisplayLabel(loc);
    }
    return map;
  }, [locations]);

  const columns = useMemo(
    () => buildActivityColumns({ locationNameById }),
    [locationNameById],
  );

  // Normalise the URL params into "active or null" filter values.
  const locationValue =
    initialLocationId && initialLocationId !== "all" ? initialLocationId : null;
  const eventValue = KNOWN_EVENT_TYPES.has(initialEventType)
    ? initialEventType
    : null;
  const hasDateFilter = !!initialFrom;
  const searchValue = initialSearch?.trim() || null;

  const onLocationChange = (value: string | null) =>
    updateParams({ locationId: value, page: "1" });

  const onEventTypeChange = (value: string | null) =>
    updateParams({ eventType: value, page: "1" });

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

  const clearAll = () => {
    setSearchInput("");
    setDeviceIdInput("");
    setStaffIdInput("");
    setPendingDate(undefined);
    updateParams({
      search: null,
      locationId: null,
      eventType: null,
      deviceId: null,
      staffId: null,
      from: null,
      to: null,
      page: "1",
    });
  };

  const dateLabel = (() => {
    const from = parseDateInput(initialFrom);
    const to = parseDateInput(initialTo);
    if (!from) return "Filter by date";
    if (!to || +to === +from) return format(from, "MMM d, yyyy");
    return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
  })();

  // Active-filter chips — a single glanceable summary of what's narrowing the
  // stream, each individually clearable.
  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (searchValue)
    activeChips.push({
      key: "search",
      label: `Search: ${searchValue}`,
      onClear: () => {
        setSearchInput("");
        updateParams({ search: null, page: "1" });
      },
    });
  if (locationValue)
    activeChips.push({
      key: "location",
      label: `Location: ${locationNameById[locationValue] ?? shortenId(locationValue)}`,
      onClear: () => onLocationChange(null),
    });
  if (eventValue)
    activeChips.push({
      key: "event",
      label: `Event: ${eventValue}`,
      onClear: () => onEventTypeChange(null),
    });
  if (hasDateFilter)
    activeChips.push({
      key: "date",
      label: `Date: ${dateLabel}`,
      onClear: clearDateRange,
    });
  if (initialDeviceId)
    activeChips.push({
      key: "device",
      label: `Device: ${shortenId(initialDeviceId)}`,
      onClear: () => {
        setDeviceIdInput("");
        applyId("deviceId", "");
      },
    });
  if (initialStaffId)
    activeChips.push({
      key: "staff",
      label: `Staff: ${shortenId(initialStaffId)}`,
      onClear: () => {
        setStaffIdInput("");
        applyId("staffId", "");
      },
    });

  const { content, totalElements, totalPages, page } = initialPage;
  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-line bg-card p-3 sm:p-4">
        {/* ── Search + result summary ───────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:max-w-[360px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order # or UUID…"
              type="search"
              className="h-9 pl-9 text-[12.5px]"
            />
          </div>
          <span className="ml-auto font-mono text-[12px] text-muted-foreground">
            {totalElements === 0
              ? "No activity"
              : `Page ${page + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
          </span>
        </div>

        {/* ── Filter controls ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <LocationCombobox
            locations={locations}
            value={locationValue}
            onChange={onLocationChange}
            className="w-[230px]"
          />

          <Combobox
            options={EVENT_OPTIONS}
            value={eventValue ?? EVENT_ALL}
            onChange={(v) => onEventTypeChange(v && v !== EVENT_ALL ? v : null)}
            placeholder="All events"
            searchPlaceholder="Search events…"
            emptyText="No event types match."
            className="w-[200px]"
            contentClassName="w-[280px]"
            ariaLabel="Filter by event type"
          />

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

          <Input
            value={deviceIdInput}
            onChange={(e) => setDeviceIdInput(e.target.value)}
            onBlur={() => applyId("deviceId", deviceIdInput)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyId("deviceId", deviceIdInput);
            }}
            placeholder="Device ID"
            aria-label="Filter by device ID"
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
            aria-label="Filter by staff ID"
            className="h-9 w-[150px] text-[12.5px]"
          />
        </div>

        {/* ── Active-filter chips ───────────────────────────────── */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Active
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex max-w-[260px] items-center gap-1 rounded-md border border-line bg-canvas py-0.5 pl-2 pr-1 text-[12px] text-ink-2"
              >
                <span className="truncate">{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onClear}
                  aria-label={`Clear ${chip.key} filter`}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-line hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 px-2 text-[12px] text-muted-foreground hover:text-ink"
              onClick={clearAll}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="orderNumber"
        hideSearch
        pageNo={page}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        defaultPageSize={defaultPageSize}
        disableArchive
      />
    </div>
  );
}

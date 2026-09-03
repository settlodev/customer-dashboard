"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { DataTable } from "@/components/tables/data-table";
import { buildManualPaymentColumns } from "@/components/tables/admin-manual-payments/column";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ManualPaymentPage, ManualPaymentStatus } from "@/types/admin/billing";

interface ManualPaymentsQueueViewProps {
  page: ManualPaymentPage;
  status: ManualPaymentStatus | "ALL";
  counts: Record<ManualPaymentStatus | "ALL", number>;
  actorNames: Record<string, string>;
  /** Current `?recordedFrom`/`?recordedTo` filter, as `YYYY-MM-DD` (business-timezone calendar days). */
  recordedFrom?: string;
  recordedTo?: string;
}

function parseDayLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const TABS: { key: ManualPaymentStatus | "ALL"; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "APPROVED", label: "Approved" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "ALL", label: "All" },
];

export function ManualPaymentsQueueView({
  page,
  status,
  counts,
  actorNames,
  recordedFrom,
  recordedTo,
}: ManualPaymentsQueueViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [dateOpen, setDateOpen] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    recordedFrom
      ? { from: parseDayLocal(recordedFrom), to: recordedTo ? parseDayLocal(recordedTo) : undefined }
      : undefined,
  );

  const columns = useMemo(
    () => buildManualPaymentColumns(actorNames),
    [actorNames],
  );

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const handleStatusChange = (next: ManualPaymentStatus | "ALL") => {
    updateParams({ status: next === "ALL" ? null : next, page: null });
  };

  const applyDateRange = () => {
    if (!pendingRange?.from) return;
    const from = format(pendingRange.from, "yyyy-MM-dd");
    const to = format(pendingRange.to ?? pendingRange.from, "yyyy-MM-dd");
    updateParams({ recordedFrom: from, recordedTo: to, page: null });
    setDateOpen(false);
  };

  const clearDateRange = () => {
    setPendingRange(undefined);
    updateParams({ recordedFrom: null, recordedTo: null, page: null });
    setDateOpen(false);
  };

  const dateRangeLabel =
    recordedFrom && recordedTo
      ? recordedFrom === recordedTo
        ? format(parseDayLocal(recordedFrom), "MMM d, yyyy")
        : `${format(parseDayLocal(recordedFrom), "MMM d, yyyy")} – ${format(parseDayLocal(recordedTo), "MMM d, yyyy")}`
      : "Recorded date";

  const { content, totalElements, totalPages, number, size } = page;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status tabs */}
        <div
          role="tablist"
          aria-label="Manual payment status"
          className="inline-flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-md border border-line bg-card p-[3px]"
        >
          {TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleStatusChange(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  active ? "bg-canvas text-ink" : "text-ink-3 hover:text-ink",
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
                  {counts[tab.key].toLocaleString()}
                </span>
              </button>
            );
          })}
          <span className="ml-3 self-center font-mono text-[12px] text-muted-foreground">
            {totalElements === 0
              ? "No manual payments"
              : `Page ${number + 1} of ${Math.max(1, totalPages)} · ${totalElements.toLocaleString()} total`}
          </span>
        </div>

        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start gap-2 text-left text-[12.5px] font-normal",
                !recordedFrom && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={pendingRange?.from}
              selected={pendingRange}
              onSelect={setPendingRange}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              toDate={new Date()}
              initialFocus
            />
            <div className="flex items-center justify-end gap-2 p-3 pt-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                disabled={!recordedFrom && !pendingRange?.from}
              >
                Clear
              </Button>
              <Button size="sm" onClick={applyDateRange} disabled={!pendingRange?.from}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {recordedFrom && (
          <button
            type="button"
            onClick={clearDateRange}
            className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1.5 text-[12px] text-muted-foreground hover:text-ink"
            aria-label="Clear recorded date filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="invoiceNumber"
        hideSearch
        pageNo={number}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        defaultPageSize={size}
        disableArchive
      />
    </div>
  );
}

"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { DataTable } from "@/components/tables/data-table";
import { buildDeadLetterColumns } from "@/components/tables/admin-stuck-writes/columns";
import { buildApprovalsColumns } from "@/components/tables/admin-stuck-writes/approvals-columns";
import {
  LocationCombobox,
  locationDisplayLabel,
} from "@/components/admin/shared/location-combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { DeadLetterPage, RepairCommandPage } from "@/types/admin/stuck-writes";
import type { PlatformLocationRow } from "@/types/admin/platform-metrics";

const CLASSIFICATIONS = [
  "terminal",
  "conflict",
  "validation",
  "stale",
  "network",
  "server",
];

export interface StuckWritesViewProps {
  initialDeadLetters: DeadLetterPage;
  initialApprovals: RepairCommandPage;
  locations: PlatformLocationRow[];
  canExecute: boolean;
  canApprove: boolean;
  /** Current operator userId (requesterId / approverId). */
  operatorId: string;
  initialClassification: string;
  initialLocationId: string;
  initialDeviceId: string | null;
  initialOrderId: string | null;
  /** "true" | "false" | "" */
  initialMoneyOp: string;
  initialFrom: string | null;
  initialTo: string | null;
  defaultPageSize: number;
  /** "mutations" | "approvals" | "history" */
  initialTab: string;
  /** true → showing the resolved archive; false → still-stuck rows. */
  initialResolved: boolean;
}

function parseDateInput(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export function StuckWritesView({
  initialDeadLetters,
  initialApprovals,
  locations,
  canExecute,
  canApprove,
  operatorId,
  initialClassification,
  initialLocationId,
  initialDeviceId,
  initialOrderId,
  initialMoneyOp,
  initialFrom,
  initialTo,
  defaultPageSize,
  initialTab,
  initialResolved,
}: StuckWritesViewProps) {
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
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId ?? "");

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
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const onActionDone = useCallback(() => {
    router.refresh();
  }, [router]);

  const locationNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const loc of locations) {
      if (loc.locationId) map[loc.locationId] = locationDisplayLabel(loc);
    }
    return map;
  }, [locations]);

  const deadLetterCols = useMemo(
    () =>
      buildDeadLetterColumns({
        locationNameById,
        canExecute,
        requesterId: operatorId,
        onActionDone,
      }),
    [locationNameById, canExecute, operatorId, onActionDone],
  );

  const approvalsCols = useMemo(
    () =>
      buildApprovalsColumns({ canApprove, approverId: operatorId, onActionDone }),
    [canApprove, operatorId, onActionDone],
  );

  const applyDateRange = () => {
    const from = pendingDate?.from ? format(pendingDate.from, "yyyy-MM-dd") : null;
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
  const today = new Date();
  const tabValue = initialTab === "approvals" && canApprove ? "approvals" : "mutations";

  const {
    content: dlContent,
    totalElements: dlTotal,
    totalPages: dlPages,
    page: dlPage,
  } = initialDeadLetters;
  const {
    content: appContent,
    totalElements: appTotal,
    totalPages: appPages,
    page: appPage,
  } = initialApprovals;

  return (
    <Tabs
      value={tabValue}
      onValueChange={(v) => updateParams({ tab: v, page: "1" })}
      className="space-y-4"
    >
      <TabsList className="w-fit">
        <TabsTrigger value="mutations">
          Stuck Mutations
          {dlTotal > 0 && (
            <span className="ml-2 rounded-full bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive">
              {dlTotal}
            </span>
          )}
        </TabsTrigger>
        {canApprove && (
          <TabsTrigger value="approvals">
            Pending Approvals
            {appTotal > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] text-amber-700">
                {appTotal}
              </span>
            )}
          </TabsTrigger>
        )}
      </TabsList>

      {/* ── Stuck Mutations tab ── */}
      <TabsContent value="mutations" className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <LocationCombobox
            locations={locations}
            value={
              initialLocationId && initialLocationId !== "all"
                ? initialLocationId
                : null
            }
            onChange={(v) => updateParams({ locationId: v, page: "1" })}
            className="w-[230px]"
          />

          <Select
            value={initialClassification || "all"}
            onValueChange={(v) =>
              updateParams({ classification: v === "all" ? null : v, page: "1" })
            }
          >
            <SelectTrigger className="h-9 w-[180px] text-[12.5px]">
              <SelectValue placeholder="All classifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classifications</SelectItem>
              {CLASSIFICATIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initialMoneyOp || "all"}
            onValueChange={(v) =>
              updateParams({ moneyOp: v === "all" ? null : v, page: "1" })
            }
          >
            <SelectTrigger className="h-9 w-[150px] text-[12.5px]">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              <SelectItem value="true">Money ops only</SelectItem>
              <SelectItem value="false">Non-money only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={initialResolved ? "resolved" : "stuck"}
            onValueChange={(v) =>
              updateParams({
                resolved: v === "resolved" ? "true" : null,
                page: "1",
              })
            }
          >
            <SelectTrigger className="h-9 w-[150px] text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stuck">Still stuck</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
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
                <Button size="sm" onClick={applyDateRange} disabled={!pendingDate?.from}>
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
            onBlur={() =>
              updateParams({ deviceId: deviceIdInput.trim() || null, page: "1" })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateParams({ deviceId: deviceIdInput.trim() || null, page: "1" });
            }}
            placeholder="Device ID"
            className="h-9 w-[150px] text-[12.5px]"
          />
          <Input
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            onBlur={() =>
              updateParams({ orderId: orderIdInput.trim() || null, page: "1" })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter")
                updateParams({ orderId: orderIdInput.trim() || null, page: "1" });
            }}
            placeholder="Order / resource ID"
            className="h-9 w-[180px] text-[12.5px]"
          />

          <span className="ml-auto font-mono text-[12px] text-muted-foreground">
            {dlTotal === 0
              ? "No stuck mutations"
              : `Page ${dlPage + 1} of ${Math.max(1, dlPages)} · ${dlTotal.toLocaleString()} total`}
          </span>
        </div>

        {/* Search box is hidden: order/resource-ID search is driven by the
            `orderId` input above (server-side via `?orderId`), and the backend
            has no generic `?search` param. */}
        <DataTable
          columns={deadLetterCols}
          data={dlContent}
          searchKey="order"
          hideSearch
          pageNo={dlPage}
          total={dlTotal}
          pageCount={Math.max(1, dlPages)}
          defaultPageSize={defaultPageSize}
          disableArchive
        />
      </TabsContent>

      {/* ── Pending Approvals tab (admin only) ── */}
      {canApprove && (
        <TabsContent value="approvals" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[12.5px] text-muted-foreground">
              Money-op discard requests awaiting your approval. You cannot approve your own requests.
            </p>
            <span className="font-mono text-[12px] text-muted-foreground">
              {appTotal === 0
                ? "No pending approvals"
                : `${appTotal.toLocaleString()} pending`}
            </span>
          </div>
          {/* Single-page fetch (up to 100 pending) with no backend search —
              hide the non-functional search box. */}
          <DataTable
            columns={approvalsCols}
            data={appContent}
            searchKey="target"
            hideSearch
            pageNo={appPage}
            total={appTotal}
            pageCount={Math.max(1, appPages)}
            defaultPageSize={20}
            disableArchive
          />
        </TabsContent>
      )}
    </Tabs>
  );
}

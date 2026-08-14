"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarIcon, Check, Copy, Radio, Trash2, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatDateTime, timeSince } from "@/components/admin/shared/format";
import { DataTable } from "@/components/tables/data-table";
import {
  gatewayRequestColumns,
  statusTone,
} from "@/components/tables/admin-gateway-requests/column";
import { listGatewayRequests } from "@/lib/actions/admin/gateway-requests";
import type { GatewayRequestRow } from "@/types/admin/gateway-requests";

// gatewayRequestId is the real identifier — fall back to a composite only
// for rows from before that field existed.
function keyOf(row: GatewayRequestRow) {
  return (
    row.gatewayRequestId ??
    `${row.vercelId ?? "novercel"}-${row.createdAt}-${row.httpMethod}-${row.incomingUrl}-${row.incomingIpAddress}`
  );
}

function formatCountry(row: GatewayRequestRow): string | null {
  if (row.countryName && row.countryIsoCode)
    return `${row.countryName} (${row.countryIsoCode})`;
  return row.countryName ?? row.countryIsoCode;
}

function formatCoordinates(row: GatewayRequestRow): string | null {
  if (row.latitude == null || row.longitude == null) return null;
  return `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`;
}

interface GatewayRequestsViewProps {
  initialPage: { content: GatewayRequestRow[]; totalElements: number };
  pageSize: number;
  intervalMs?: number;
}

export function GatewayRequestsView({
  initialPage,
  pageSize,
  intervalMs = 3000,
}: GatewayRequestsViewProps) {
  const [rows, setRows] = useState<GatewayRequestRow[]>(initialPage.content);
  const [live, setLive] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GatewayRequestRow | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pendingDate, setPendingDate] = useState<DateRange | undefined>(
    undefined,
  );
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const liveRef = useRef(live);
  liveRef.current = live;
  const seen = useRef<Set<string>>(new Set(initialPage.content.map(keyOf)));

  const poll = useCallback(async () => {
    try {
      const data = await listGatewayRequests({ page: 0, size: pageSize });
      setLastError(null);

      const fresh = data.content.filter((row) => {
        const k = keyOf(row);
        if (seen.current.has(k)) return false;
        seen.current.add(k);
        return true;
      });

      if (fresh.length) {
        setRows((prev) => [...fresh, ...prev].slice(0, 500));
      }
    } catch (error: any) {
      setLastError(error?.message ?? "Failed to reach the gateway feed.");
    }
  }, [pageSize]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (liveRef.current) await poll();
      timer = setTimeout(tick, intervalMs);
    };
    tick();
    return () => clearTimeout(timer);
  }, [poll, intervalMs]);

  const clear = () => {
    setRows([]);
    seen.current.clear();
  };

  const hasDateFilter = !!dateRange?.from;

  const dateLabel = !dateRange?.from
    ? "Filter by date"
    : !dateRange.to || +dateRange.to === +dateRange.from
      ? format(dateRange.from, "MMM d, yyyy")
      : `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`;

  const applyDateRange = () => {
    setDateRange(pendingDate);
    setDatePopoverOpen(false);
  };

  const clearDateRange = () => {
    setPendingDate(undefined);
    setDateRange(undefined);
  };

  const filteredRows = useMemo(() => {
    if (!dateRange?.from) return rows;
    const start = new Date(dateRange.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.to ?? dateRange.from);
    end.setHours(23, 59, 59, 999);
    return rows.filter((row) => {
      const t = new Date(row.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [rows, dateRange]);

  const today = new Date();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-[7px] bg-primary/10 text-primary-dark dark:text-primary">
            <Radio className="h-3.5 w-3.5" />
          </span>
          <h3 className="text-[14px] font-semibold tracking-tight text-ink">
            Request tail
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={live ? "ok" : "muted"} dot>
            {live ? "Live" : "Paused"} · {rows.length} events
          </Badge>

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
            <PopoverContent className="w-auto p-0" align="end">
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
            <button
              type="button"
              onClick={clearDateRange}
              aria-label="Clear date filter"
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-canvas hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <Switch
            checked={live}
            onCheckedChange={setLive}
            aria-label="Toggle live tail"
          />
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {lastError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {lastError}
        </p>
      )}

      <DataTable
        columns={gatewayRequestColumns}
        data={filteredRows}
        searchKey="incomingUrl"
        searchPlaceholder="Search by URL…"
        defaultPageSize={pageSize}
        clientMode
        disableArchive
        onRowClick={(row) => setSelected(row)}
      />

      <RequestDetailSheet row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function RequestDetailSheet({
  row,
  onClose,
}: {
  row: GatewayRequestRow | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={!!row} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {row && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone(row.upstreamStatusCode)}>
                  {row.upstreamStatusCode ?? "—"}
                </Badge>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {row.httpMethod}
                </span>
                <SheetTitle className="truncate font-mono text-[14px]">
                  {row.incomingUrl}
                </SheetTitle>
              </div>
              <p className="font-mono text-[12px] text-muted-foreground">
                {formatDateTime(row.createdAt)} · {timeSince(row.createdAt)}
                {row.upstreamResponseTimeMs != null &&
                  ` · ${row.upstreamResponseTimeMs}ms`}
              </p>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <DetailSection title="Request">
                <DetailField
                  label="Incoming URL"
                  value={row.incomingUrl}
                  copyable={false}
                />
                <DetailField
                  label="Outgoing URL"
                  value={row.outgoingUrl}
                  copyable={false}
                />
                <DetailField
                  label="Method"
                  value={row.httpMethod}
                  copyable={false}
                />
                <DetailField
                  label="Upstream server"
                  value={row.upstreamServerName}
                  copyable={false}
                />
              </DetailSection>

              <DetailSection title="Response">
                <DetailField
                  label="Status code"
                  value={row.upstreamStatusCode}
                  copyable={false}
                />
                <ErrorMessageField value={row.upstreamErrorMessage} />
                <DetailField
                  label="Response time"
                  value={
                    row.upstreamResponseTimeMs != null
                      ? `${row.upstreamResponseTimeMs} ms`
                      : null
                  }
                  copyable={false}
                />
              </DetailSection>

              <DetailSection title="Origin">
                <DetailField label="IP address" value={row.incomingIpAddress} />
                <DetailField label="User agent" value={row.userAgent} />
              </DetailSection>

              <DetailSection title="Location">
                <DetailField
                  label="Country"
                  value={formatCountry(row)}
                  copyable={false}
                />
                <DetailField
                  label="Region"
                  value={row.subdivision}
                  copyable={false}
                />
                <DetailField
                  label="City"
                  value={row.city}
                  copyable={false}
                />
                <DetailField
                  label="Timezone"
                  value={row.timezone}
                  copyable={false}
                />
                <DetailField
                  label="Coordinates"
                  value={formatCoordinates(row)}
                  copyable={false}
                />
                <DetailField
                  label="Accuracy radius"
                  value={
                    row.accuracyRadiusKm != null
                      ? `${row.accuracyRadiusKm} km`
                      : null
                  }
                  copyable={false}
                />
              </DetailSection>

              <DetailSection title="Identity">
                <DetailField label="User ID" value={row.userId} />
                <DetailField
                  label="Account ID"
                  value={row.accountId}
                  href={row.accountId ? `/accounts/${row.accountId}` : undefined}
                />
                <DetailField
                  label="Business ID"
                  value={row.businessId}
                  href={row.businessId ? `/businesses/${row.businessId}` : undefined}
                />
                <DetailField label="Staff ID" value={row.staffId} />
                <DetailField
                  label="Location ID"
                  value={row.locationId}
                  href={row.locationId ? `/locations/${row.locationId}` : undefined}
                />
                <DetailField label="Day session ID" value={row.daySessionId} />
              </DetailSection>

              <DetailSection title="Trace">
                <DetailField
                  label="Gateway request ID"
                  value={row.gatewayRequestId}
                  copyable={false}
                />
                <DetailField
                  label="Vercel trace ID"
                  value={row.vercelId}
                  copyable={false}
                />
              </DetailSection>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-1 rounded-lg border border-line bg-canvas/50">
        {children}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  copyable = true,
  href,
}: {
  label: string;
  value: string | number | null;
  copyable?: boolean;
  href?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (value == null) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access blocked — nothing to fall back to here.
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 border-b border-line/60 px-3 py-2 last:border-b-0">
      <span className="shrink-0 pt-0.5 text-[12px] text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-start gap-1.5">
        {href && value != null ? (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 break-all text-right font-mono text-[12px] text-primary hover:underline"
          >
            {value}
          </Link>
        ) : (
          <span
            className={cn(
              "min-w-0 break-all text-right font-mono text-[12px] text-ink",
              value == null && "text-muted-foreground",
            )}
          >
            {value ?? "—"}
          </span>
        )}
        {copyable && value != null && (
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
            className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-canvas hover:text-ink"
          >
            {copied ? (
              <Check className="h-3 w-3 text-pos" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/** Parses `value` as a JSON object, returning null for anything else (plain
 * strings, arrays, primitives, invalid JSON) so callers can fall back to
 * rendering the raw text. */
function parseJsonObject(
  value: string | null,
): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function formatJsonValue(key: string, value: unknown): string {
  if (typeof value === "string") {
    if (key.toLowerCase().includes("timestamp")) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return formatDateTime(value);
    }
    return value;
  }
  return JSON.stringify(value);
}

/** Renders `upstreamErrorMessage`. Upstream errors are often a JSON blob
 * (e.g. `{"error":"ACCESS_DENIED","message":"..."}`); when that's the case
 * this breaks it out into readable key/value rows instead of one long
 * unreadable string. Falls back to plain text otherwise. */
function ErrorMessageField({ value }: { value: string | null }) {
  const parsed = useMemo(() => parseJsonObject(value), [value]);

  return (
    <div className="border-b border-line/60 px-3 py-2 last:border-b-0">
      <span className="text-[12px] text-muted-foreground">
        Error message
      </span>

      {value == null ? (
        <span className="font-mono text-[12px] text-muted-foreground">
          —
        </span>
      ) : parsed ? (
        <ul className="mt-1.5 space-y-1">
          {Object.entries(parsed).map(([key, val]) => (
            <li key={key} className="flex gap-1.5 font-mono text-[12px]">
              <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-destructive" />
              <span className="shrink-0 text-muted-foreground">{key}:</span>
              <span className="min-w-0 break-all text-ink">
                {formatJsonValue(key, val)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 break-all font-mono text-[12px] text-ink">
          {value}
        </p>
      )}
    </div>
  );
}

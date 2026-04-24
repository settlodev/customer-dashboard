"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  SerialEvent,
  SerialNumber,
  SERIAL_STATUS_LABELS,
  SERIAL_STATUS_TONES,
} from "@/types/traceability/type";
import {
  fetchSerialEvents,
  searchSerialNumbers,
} from "@/lib/actions/traceability-actions";

const PAGE_SIZE = 50;

export function SerialSearch() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<SerialNumber[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [events, setEvents] = useState<Record<string, SerialEvent[]>>({});
  const [eventsLoading, setEventsLoading] = useState<Record<string, boolean>>(
    {},
  );

  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const load = (nextPage: number) => {
    startTransition(async () => {
      const res = await searchSerialNumbers(query, nextPage, PAGE_SIZE);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Search failed",
          description: res.message,
        });
        setResults([]);
        setTotalMatches(0);
        setHasSearched(true);
        return;
      }
      setResults(res.data?.items ?? []);
      setTotalMatches(res.data?.totalElements ?? 0);
      setPage(nextPage);
      setHasSearched(true);
      setExpanded(null);
    });
  };

  const run = () => load(0);

  const reset = () => {
    setQuery("");
    setResults([]);
    setTotalMatches(0);
    setPage(0);
    setHasSearched(false);
    setExpanded(null);
    setEvents({});
  };

  const toggleExpand = async (serial: SerialNumber) => {
    if (expanded === serial.id) {
      setExpanded(null);
      return;
    }
    setExpanded(serial.id);

    if (events[serial.id]) return; // cached

    setEventsLoading((s) => ({ ...s, [serial.id]: true }));
    const res = await fetchSerialEvents(serial.stockVariantId, serial.serialNumber);
    setEventsLoading((s) => ({ ...s, [serial.id]: false }));
    if (res.responseType === "error") {
      toast({
        variant: "destructive",
        title: "Couldn't load history",
        description: res.message,
      });
      return;
    }
    setEvents((s) => ({ ...s, [serial.id]: res.data?.items ?? [] }));
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Serial number lookup</h3>
          <p className="text-xs text-muted-foreground">
            Search by full or partial serial. Scoped to your current location.
            Click a row to see the full event history.
          </p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!query.trim() || isPending) return;
            run();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. IMEI-1234 or ABC123"
              className="pl-9 font-mono"
              disabled={isPending}
            />
            {query && !isPending && (
              <button
                type="button"
                onClick={reset}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={isPending || !query.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {isPending && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        )}

        {hasSearched && !isPending && results.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No serials matching &ldquo;{query}&rdquo; at this location.
          </p>
        )}


        {!isPending && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="w-8" />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Serial
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Variant
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Supplier
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Received
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Batch / GRN
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Sale ref
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((s) => {
                  const isOpen = expanded === s.id;
                  return (
                    <>
                      <tr
                        key={s.id}
                        onClick={() => toggleExpand(s)}
                        className="cursor-pointer hover:bg-gray-50/50"
                      >
                        <td className="px-2 py-2 text-muted-foreground">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono">{s.serialNumber}</td>
                        <td className="px-3 py-2">
                          {s.stockVariantDisplayName || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SERIAL_STATUS_TONES[s.status]}`}
                          >
                            {SERIAL_STATUS_LABELS[s.status]}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {s.supplierName ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {s.receivedDate
                            ? new Date(s.receivedDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                          {s.batchId ? (
                            <Link
                              href={`/stock-batches/${s.batchId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-foreground hover:underline"
                            >
                              {s.batchNumber ?? s.batchId.slice(0, 8)}
                            </Link>
                          ) : (
                            "—"
                          )}
                          {s.grnId && (
                            <>
                              {" · "}
                              <Link
                                href={`/goods-received/${s.grnId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-foreground hover:underline"
                              >
                                GRN {s.grnId.slice(0, 8)}
                              </Link>
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs font-mono text-muted-foreground">
                          {s.saleReferenceType && s.saleReferenceId ? (
                            <span>
                              {s.saleReferenceType} ·{" "}
                              {s.saleReferenceId.slice(0, 8)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={`${s.id}-events`} className="bg-gray-50/30">
                          <td colSpan={8} className="px-6 py-3">
                            <SerialTimeline
                              loading={eventsLoading[s.id] ?? false}
                              events={events[s.id] ?? []}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-3 py-2 text-xs border-t">
                <span className="text-muted-foreground">
                  Page {page + 1} of {totalPages} — {totalMatches.toLocaleString()} matches
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canPrev && load(page - 1)}
                    disabled={!canPrev || isPending}
                  >
                    <ChevronsLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => canNext && load(page + 1)}
                    disabled={!canNext || isPending}
                  >
                    Next <ChevronsRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SerialTimeline({
  loading,
  events,
}: {
  loading: boolean;
  events: SerialEvent[];
}) {
  if (loading) {
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No events recorded for this serial yet.
      </p>
    );
  }
  return (
    <ol className="space-y-2 border-l pl-4 relative">
      {events.map((ev) => (
        <li key={ev.id} className="relative">
          <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-gray-400" />
          <div className="text-xs">
            <span className="font-medium">
              {SERIAL_STATUS_LABELS[ev.status] ?? ev.status}
            </span>
            {ev.previousStatus && (
              <span className="text-muted-foreground">
                {" "}
                (from {SERIAL_STATUS_LABELS[ev.previousStatus] ?? ev.previousStatus})
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(ev.occurredAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {ev.referenceType && (
              <>
                {" · "}
                <span className="font-mono">
                  {ev.referenceType}
                  {ev.referenceId ? `:${ev.referenceId.slice(0, 8)}` : ""}
                </span>
              </>
            )}
          </div>
          {ev.notes && (
            <div className="text-xs italic text-muted-foreground mt-0.5">
              &ldquo;{ev.notes}&rdquo;
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

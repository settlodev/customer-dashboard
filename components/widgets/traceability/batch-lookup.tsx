"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  StockBatchSummary,
} from "@/types/traceability/type";
import { findBatchesByNumber } from "@/lib/actions/traceability-actions";

const PAGE_SIZE = 50;

/**
 * Read-only batch search. Same backend as the recall widget but no recall
 * buttons — users who just want to view a batch's trace shouldn't have to
 * click through a destructive-looking action.
 */
export function BatchLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockBatchSummary[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [page, setPage] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const load = (nextPage: number) => {
    startTransition(async () => {
      const res = await findBatchesByNumber(query, nextPage, PAGE_SIZE);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Lookup failed",
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
    });
  };

  const run = () => load(0);

  const reset = () => {
    setQuery("");
    setResults([]);
    setTotalMatches(0);
    setPage(0);
    setHasSearched(false);
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">Batch lookup</h3>
          <p className="text-xs text-muted-foreground">
            Paste a batch number (BTH_…) or UUID to view its movement history,
            supplier lineage, and current quantity. Read-only — click through
            to the batch page for a full trace.
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
              placeholder="Batch number or UUID"
              className="pl-9 font-mono"
              disabled={isPending}
            />
            {query && !isPending && (
              <button
                type="button"
                onClick={reset}
                aria-label="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" disabled={isPending || !query.trim()}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lookup"}
          </Button>
        </form>

        {isPending && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {hasSearched && !isPending && results.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            No batches match &ldquo;{query}&rdquo; in this business.
          </p>
        )}

        {!isPending && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Batch
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Variant
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">
                    On hand
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Received
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Expiry
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        href={`/stock-batches/${b.id}`}
                        className="hover:underline"
                      >
                        {b.batchNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {b.stockVariantDisplayName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {Number(b.quantityOnHand ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {b.receivedDate
                        ? new Date(b.receivedDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {b.expiryDate
                        ? new Date(b.expiryDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BATCH_STATUS_TONES[b.status]}`}
                      >
                        {BATCH_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                  </tr>
                ))}
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

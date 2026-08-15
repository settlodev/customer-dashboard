"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import {
  StockTakeCountRow,
  type CountDraft,
} from "@/components/widgets/stock-take/count-row";
import {
  recordStockTakeCounts,
  searchForItemOnStockTake,
} from "@/lib/actions/stock-take-actions";
import type { StockTakeItem } from "@/types/stock-take/type";
import { splitDivisibleQuantity } from "@/lib/format-divisible-quantity";

interface Props {
  takeId: string;
  items: StockTakeItem[];
  blindCount: boolean;
  readOnly: boolean;
  hasBins: boolean;
  pageSize?: number;
}

// Below this length, treat it as "not searching yet" instead of firing a
// backend request per keystroke — a single character matches too broadly
// to be useful and just wastes round-trips on a fast typist.
const MIN_SEARCH_LENGTH = 3;

function initialDraft(item: StockTakeItem): CountDraft {
  if (item.divisibleUnitRatio != null && item.countedQuantity != null) {
    const { whole, sub } = splitDivisibleQuantity(
      item.countedQuantity,
      item.divisibleUnitRatio,
    );
    return {
      countedWholeUnits: whole,
      countedSubUnits: sub,
      notes: item.notes ?? "",
    };
  }
  return {
    countedQuantity: item.countedQuantity ?? undefined,
    notes: item.notes ?? "",
  };
}

/**
 * Paged renderer for stock take items. Large zone counts (hundreds of
 * variant-bin rows) otherwise murder first-paint, so the unfiltered view
 * pages the `items` prop client-side. The search box instead hits the
 * backend (`searchForItemOnStockTake` → `/stock-takes/{id}/items`),
 * debounced 300ms, since the counter is looking for one specific row and
 * the backend search is the source of truth for matching.
 *
 * Owns every row's draft count/notes — not just the visible page — so
 * values survive paging/searching between now and one bulk "Submit all
 * counts", alongside each row's own immediate Save.
 */
export default function StockTakeItemsTable({
  takeId,
  items,
  blindCount,
  readOnly,
  hasBins,
  pageSize = 50,
}: Props) {
  const [page, setPage] = useState(0);
  const [values, setValues] = useState<Record<string, CountDraft>>(() =>
    Object.fromEntries(items.map((i) => [i.id, initialDraft(i)])),
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  // Search hits the backend (`/stock-takes/{id}/items`) rather than filtering
  // the `items` prop locally — the same items array is still the source of
  // truth for `values`/`dirtyIds` lookups below, since search results are
  // always a subset of it (same take), so submitting a count for a
  // search-found row works the same as any other.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const isSearching = debouncedSearch.length >= MIN_SEARCH_LENGTH;
  const [searchResult, setSearchResult] = useState<{
    items: StockTakeItem[];
    totalElements: number;
    totalPages: number;
  } | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // A new search term should always start at page 0. Rather than resetting
  // `page` in a separate effect (which fired the fetch below once more with
  // the stale page before the reset landed — an extra request plus a
  // flicker of the old page number), track the previous term in a ref and,
  // when it just changed, reset the page and skip straight to the re-run
  // that fetch triggers instead of fetching with the stale page.
  const prevDebouncedSearchRef = useRef(debouncedSearch);
  useEffect(() => {
    const searchChanged = prevDebouncedSearchRef.current !== debouncedSearch;
    prevDebouncedSearchRef.current = debouncedSearch;

    if (!isSearching) {
      setSearchResult(null);
      return;
    }
    if (searchChanged && page !== 0) {
      setPage(0);
      return;
    }

    let cancelled = false;
    setIsSearchLoading(true);
    searchForItemOnStockTake(takeId, debouncedSearch, page, pageSize)
      .then((res) => {
        if (cancelled) return;
        setSearchResult({
          items: res?.content ?? [],
          totalElements: res?.totalElements ?? 0,
          totalPages: res?.totalPages ?? 1,
        });
      })
      .catch(() => {
        if (!cancelled)
          setSearchResult({ items: [], totalElements: 0, totalPages: 1 });
      })
      .finally(() => {
        if (!cancelled) setIsSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [takeId, debouncedSearch, page, pageSize]);

  const localTotalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const totalPages = isSearching
    ? Math.max(1, searchResult?.totalPages ?? 1)
    : localTotalPages;
  const safePage = Math.min(page, totalPages - 1);
  const localVisible = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );
  const visible = isSearching ? (searchResult?.items ?? []) : localVisible;

  const totalCount = isSearching
    ? (searchResult?.totalElements ?? 0)
    : items.length;
  const showControls = isSearching
    ? totalCount > pageSize
    : items.length > pageSize;
  const noSearchResults =
    isSearching && !isSearchLoading && (searchResult?.items.length ?? 0) === 0;

  // Dirty rows still missing a quantity aren't submittable yet — they just
  // sit pending until the counter fills one in (mirrors the per-row Save
  // guard, which refuses an empty count too).
  const submittableIds = useMemo(
    () =>
      Array.from(dirtyIds).filter((id) => {
        const draft = values[id];
        const item = items.find((i) => i.id === id);
        return item?.divisibleUnitRatio != null
          ? draft?.countedWholeUnits != null || draft?.countedSubUnits != null
          : draft?.countedQuantity != null;
      }),
    [dirtyIds, values, items],
  );

  useUnsavedChangesGuard(dirtyIds.size > 0);

  const handleChange = (itemId: string, patch: Partial<CountDraft>) => {
    setValues((v) => ({ ...v, [itemId]: { ...v[itemId], ...patch } }));
    setDirtyIds((d) => new Set(d).add(itemId));
  };

  const markSaved = (itemIds: string[]) => {
    setDirtyIds((d) => {
      const next = new Set(d);
      itemIds.forEach((id) => next.delete(id));
      return next;
    });
    router.refresh();
  };

  const handleSubmitAll = () => {
    if (submittableIds.length === 0) return;
    startTransition(() => {
      recordStockTakeCounts(takeId, {
        counts: submittableIds.map((id) => {
          const item = items.find((i) => i.id === id)!;
          const draft = values[id];
          return {
            itemId: id,
            ...(item.divisibleUnitRatio != null
              ? {
                  countedWholeUnits: draft.countedWholeUnits ?? 0,
                  countedSubUnits: draft.countedSubUnits ?? 0,
                }
              : { countedQuantity: draft.countedQuantity! }),
            notes: draft.notes.trim() || undefined,
          };
        }),
      }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't submit counts",
            description: res.message,
          });
          return;
        }
        toast({ title: "Counts submitted", description: res.message });
        markSaved(submittableIds);
      });
    });
  };

  return (
    <>
      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items…"
          className="pl-8 pr-8"
        />
        {isSearchLoading ? (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )
        )}
      </div>

      {noSearchResults ? (
        <div className="rounded-md border py-10 text-center text-sm text-muted-foreground">
          No items match &quot;{debouncedSearch}&quot;.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Item
                </th>
                {hasBins && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                    Bin
                  </th>
                )}
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Expected
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Counted
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Variance
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Notes
                </th>
                {!readOnly && <th />}
              </tr>
            </thead>
            <tbody className="divide-y">
              {visible.map((item) => (
                <StockTakeCountRow
                  key={item.id}
                  takeId={takeId}
                  item={item}
                  value={values[item.id] ?? initialDraft(item)}
                  dirty={dirtyIds.has(item.id)}
                  blindCount={blindCount}
                  readOnly={readOnly}
                  showBin={hasBins}
                  onChange={(patch) => handleChange(item.id, patch)}
                  onSaved={() => markSaved([item.id])}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showControls && (
        <div className="flex items-center justify-between gap-2 px-3 pt-3 text-xs text-muted-foreground">
          <span>
            Showing {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>
            <span className="px-2">
              Page {safePage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/95 to-background/0 pt-4 pb-2 -mx-2 px-2 sm:-mx-6 sm:px-6">
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs text-muted-foreground">
              {submittableIds.length === 0
                ? "No counts ready to submit"
                : `${submittableIds.length} count${submittableIds.length === 1 ? "" : "s"} ready to submit`}
            </span>
            {isPending ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </Button>
            ) : (
              <Button
                onClick={handleSubmitAll}
                disabled={submittableIds.length === 0}
              >
                Submit all counts
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

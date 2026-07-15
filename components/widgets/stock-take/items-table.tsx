"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { StockTakeCountRow, type CountDraft } from "@/components/widgets/stock-take/count-row";
import { recordStockTakeCounts } from "@/lib/actions/stock-take-actions";
import type { StockTakeItem } from "@/types/stock-take/type";

interface Props {
  takeId: string;
  items: StockTakeItem[];
  blindCount: boolean;
  readOnly: boolean;
  hasBins: boolean;
  pageSize?: number;
}

function initialDraft(item: StockTakeItem): CountDraft {
  return {
    countedQuantity: item.countedQuantity ?? undefined,
    notes: item.notes ?? "",
  };
}

/**
 * Client-side paged renderer for stock take items. Large zone counts
 * (hundreds of variant-bin rows) otherwise murder first-paint.
 *
 * Owns every row's draft count/notes — not just the visible page — so
 * values survive paging between now and one bulk "Submit all counts",
 * alongside each row's own immediate Save.
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

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  const showControls = items.length > pageSize;

  // Dirty rows still missing a quantity aren't submittable yet — they just
  // sit pending until the counter fills one in (mirrors the per-row Save
  // guard, which refuses an empty count too).
  const submittableIds = useMemo(
    () => Array.from(dirtyIds).filter((id) => values[id]?.countedQuantity != null),
    [dirtyIds, values],
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
        counts: submittableIds.map((id) => ({
          itemId: id,
          countedQuantity: values[id].countedQuantity!,
          notes: values[id].notes.trim() || undefined,
        })),
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50/60">
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Item</th>
              {hasBins && (
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Bin</th>
              )}
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Expected</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Counted</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-gray-400 uppercase">Variance</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">Notes</th>
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

      {showControls && (
        <div className="flex items-center justify-between gap-2 px-3 pt-3 text-xs text-muted-foreground">
          <span>
            Showing {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, items.length)} of {items.length}
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
              <Button onClick={handleSubmitAll} disabled={submittableIds.length === 0}>
                Submit all counts
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

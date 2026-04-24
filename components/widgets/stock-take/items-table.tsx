"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockTakeCountRow } from "@/components/widgets/stock-take/count-row";
import type { StockTakeItem } from "@/types/stock-take/type";

interface Props {
  takeId: string;
  items: StockTakeItem[];
  blindCount: boolean;
  readOnly: boolean;
  hasBins: boolean;
  pageSize?: number;
}

/**
 * Client-side paged renderer for stock take items. Large zone counts
 * (hundreds of variant-bin rows) otherwise murder first-paint.
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

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  const showControls = items.length > pageSize;

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
                blindCount={blindCount}
                readOnly={readOnly}
                showBin={hasBins}
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
    </>
  );
}

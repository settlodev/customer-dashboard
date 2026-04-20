"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import type { StockTakeItem } from "@/types/stock-take/type";
import { recordStockTakeCount } from "@/lib/actions/stock-take-actions";

interface Props {
  takeId: string;
  item: StockTakeItem;
  blindCount: boolean;
  readOnly?: boolean;
}

/**
 * One editable row inside the stock-take detail page. Persists counted qty
 * with an inline save button — the backend recalculates variance per request.
 */
export function StockTakeCountRow({ takeId, item, blindCount, readOnly }: Props) {
  const [counted, setCounted] = useState<number | undefined>(
    item.countedQuantity ?? undefined,
  );
  const [notes, setNotes] = useState<string>(item.notes ?? "");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const dirty =
    (counted ?? null) !== (item.countedQuantity ?? null) ||
    (notes ?? "") !== (item.notes ?? "");

  const variance = item.variance;

  const save = () => {
    if (counted == null) {
      toast({
        variant: "destructive",
        title: "Enter a count",
        description: "Counted quantity is required.",
      });
      return;
    }
    startTransition(() => {
      recordStockTakeCount(takeId, {
        itemId: item.id,
        countedQuantity: counted,
        notes: notes.trim() || undefined,
      }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save count",
            description: res.message,
          });
          return;
        }
        router.refresh();
      });
    });
  };

  return (
    <tr className="hover:bg-gray-50/40 align-top">
      <td className="px-3 py-3 font-medium text-gray-900">{item.displayName || "—"}</td>
      <td className="px-3 py-3 text-right text-muted-foreground">
        {blindCount && item.expectedQuantity == null
          ? <span className="italic">hidden</span>
          : Number(item.expectedQuantity ?? 0).toLocaleString()}
      </td>
      <td className="px-3 py-3 w-36">
        {readOnly ? (
          <div className="text-right">
            {counted != null ? counted.toLocaleString() : "—"}
          </div>
        ) : (
          <NumericFormat
            customInput={Input}
            value={counted ?? ""}
            onValueChange={(v) => setCounted(v.value === "" ? undefined : Number(v.value))}
            thousandSeparator
            decimalScale={6}
            allowNegative={false}
            disabled={isPending}
          />
        )}
      </td>
      <td className="px-3 py-3 text-right text-sm">
        {variance == null ? (
          <span className="text-muted-foreground">—</span>
        ) : variance > 0 ? (
          <span className="text-green-700 font-medium">+{variance.toLocaleString()}</span>
        ) : variance < 0 ? (
          <span className="text-red-600 font-medium">{variance.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="px-3 py-3">
        {readOnly ? (
          <span className="text-xs text-muted-foreground">{notes || "—"}</span>
        ) : (
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note"
            disabled={isPending}
          />
        )}
      </td>
      {!readOnly && (
        <td className="px-3 py-3 text-right">
          <Button
            type="button"
            size="sm"
            variant={dirty ? "default" : "outline"}
            onClick={save}
            disabled={!dirty || isPending}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
        </td>
      )}
    </tr>
  );
}

"use client";

import { useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumericFormat } from "react-number-format";
import { useToast } from "@/hooks/use-toast";
import type { StockTakeItem } from "@/types/stock-take/type";
import { recordStockTakeCount } from "@/lib/actions/stock-take-actions";
import { formatDivisibleQuantity, splitDivisibleQuantity } from "@/lib/format-divisible-quantity";

export interface CountDraft {
  countedQuantity?: number;
  countedWholeUnits?: number;
  countedSubUnits?: number;
  notes: string;
}

interface Props {
  takeId: string;
  item: StockTakeItem;
  value: CountDraft;
  dirty: boolean;
  blindCount: boolean;
  readOnly?: boolean;
  showBin?: boolean;
  onChange: (patch: Partial<CountDraft>) => void;
  onSaved: () => void;
}

/**
 * One editable row inside the stock-take detail page. The count/notes value
 * is owned by the parent table (so it survives client-side pagination) —
 * this row just renders it and offers an immediate per-row Save alongside
 * the table's bulk "Submit all counts" action.
 */
export function StockTakeCountRow({
  takeId,
  item,
  value,
  dirty,
  blindCount,
  readOnly,
  showBin,
  onChange,
  onSaved,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Computed live from the pending value, not the last-saved item.variance,
  // so typing a count previews its variance immediately instead of only
  // after a save round trip. Stays hidden under blind count the same way
  // expectedQuantity already is (both null together).
  const isDivisible = item.divisibleUnitRatio != null;

  const effectiveCountedQuantity = isDivisible
    ? (value.countedWholeUnits ?? 0) + (value.countedSubUnits ?? 0) / item.divisibleUnitRatio!
    : value.countedQuantity;

  const hasCount = isDivisible
    ? value.countedWholeUnits != null || value.countedSubUnits != null
    : value.countedQuantity != null;

  const liveVariance =
    item.expectedQuantity != null && hasCount
      ? effectiveCountedQuantity! - item.expectedQuantity
      : null;

  const save = () => {
    if (!hasCount) {
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
        ...(isDivisible
          ? { countedWholeUnits: value.countedWholeUnits ?? 0, countedSubUnits: value.countedSubUnits ?? 0 }
          : { countedQuantity: value.countedQuantity! }),
        notes: value.notes.trim() || undefined,
      }).then((res) => {
        if (res.responseType === "error") {
          toast({
            variant: "destructive",
            title: "Couldn't save count",
            description: res.message,
          });
          return;
        }
        onSaved();
      });
    });
  };

  return (
    <tr className="hover:bg-gray-50/40 align-top">
      <td className="px-3 py-3 font-medium text-gray-900">{item.displayName || "—"}</td>
      {showBin && (
        <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
          {item.binCode || "—"}
        </td>
      )}
      <td className="px-3 py-3 text-right text-muted-foreground">
        {blindCount && item.expectedQuantity == null
          ? <span className="italic">hidden</span>
          : formatDivisibleQuantity(Number(item.expectedQuantity ?? 0), {
              baseUnitName: item.unitName ?? "",
              divisibleUnitRatio: item.divisibleUnitRatio,
              divisibleUnitName: item.divisibleUnitName,
            })}
      </td>
      <td className="px-3 py-3 w-52">
        {readOnly ? (
          <div className="text-right">
            {hasCount
              ? formatDivisibleQuantity(effectiveCountedQuantity!, {
                  baseUnitName: item.unitName ?? "",
                  divisibleUnitRatio: item.divisibleUnitRatio,
                  divisibleUnitName: item.divisibleUnitName,
                })
              : "—"}
          </div>
        ) : isDivisible ? (
          <div className="flex items-center gap-1.5">
            <NumericFormat
              customInput={Input}
              className="w-20"
              value={value.countedWholeUnits ?? ""}
              onValueChange={(v) => onChange({ countedWholeUnits: v.value === "" ? undefined : Number(v.value) })}
              onBlur={() => {
                const ratio = item.divisibleUnitRatio!;
                const whole = value.countedWholeUnits ?? 0;
                const sub = value.countedSubUnits ?? 0;
                if (sub >= ratio) {
                  onChange({
                    countedWholeUnits: whole + Math.floor(sub / ratio),
                    countedSubUnits: sub % ratio,
                  });
                }
              }}
              decimalScale={0}
              allowNegative={false}
              disabled={isPending}
              placeholder={item.unitAbbreviation ?? ""}
            />
            <span className="text-xs text-muted-foreground">{item.unitAbbreviation}</span>
            <NumericFormat
              customInput={Input}
              className="w-20"
              value={value.countedSubUnits ?? ""}
              onValueChange={(v) => onChange({ countedSubUnits: v.value === "" ? undefined : Number(v.value) })}
              onBlur={() => {
                const ratio = item.divisibleUnitRatio!;
                const whole = value.countedWholeUnits ?? 0;
                const sub = value.countedSubUnits ?? 0;
                if (sub >= ratio) {
                  onChange({
                    countedWholeUnits: whole + Math.floor(sub / ratio),
                    countedSubUnits: sub % ratio,
                  });
                }
              }}
              decimalScale={0}
              allowNegative={false}
              disabled={isPending}
              placeholder={item.divisibleUnitAbbreviation ?? ""}
            />
            <span className="text-xs text-muted-foreground">{item.divisibleUnitAbbreviation}</span>
          </div>
        ) : (
          <NumericFormat
            customInput={Input}
            value={value.countedQuantity ?? ""}
            onValueChange={(v) => onChange({ countedQuantity: v.value === "" ? undefined : Number(v.value) })}
            thousandSeparator
            decimalScale={6}
            allowNegative={false}
            disabled={isPending}
          />
        )}
      </td>
      <td className="px-3 py-3 text-right text-sm">
        {liveVariance == null ? (
          <span className="text-muted-foreground">—</span>
        ) : liveVariance > 0 ? (
          <span className="text-green-700 font-medium">
            +{formatDivisibleQuantity(liveVariance, {
              baseUnitName: item.unitName ?? "",
              divisibleUnitRatio: item.divisibleUnitRatio,
              divisibleUnitName: item.divisibleUnitName,
            })}
          </span>
        ) : liveVariance < 0 ? (
          <span className="text-red-600 font-medium">
            {formatDivisibleQuantity(liveVariance, {
              baseUnitName: item.unitName ?? "",
              divisibleUnitRatio: item.divisibleUnitRatio,
              divisibleUnitName: item.divisibleUnitName,
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">0</span>
        )}
      </td>
      <td className="px-3 py-3">
        {readOnly ? (
          <span className="text-xs text-muted-foreground">{value.notes || "—"}</span>
        ) : (
          <Input
            value={value.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
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

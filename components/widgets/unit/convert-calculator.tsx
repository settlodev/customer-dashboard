"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Calculator, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { NumericFormat } from "react-number-format";
import { convertUnits } from "@/lib/actions/unit-actions";
import type { UnitOfMeasure } from "@/types/unit/type";

interface Props {
  /** The UoM the calculator is anchored to — used as the default "from". */
  anchor: UnitOfMeasure;
  /** All UoMs visible to the caller. */
  allUnits: UnitOfMeasure[];
}

/**
 * Quick converter for the UoM detail page. Uses the backend /convert endpoint
 * which already respects the system + caller scoped conversion lookup.
 */
export function ConvertCalculator({ anchor, allUnits }: Props) {
  const [fromId, setFromId] = useState<string>(anchor.id);
  const [toId, setToId] = useState<string>("");
  const [qty, setQty] = useState<string>("1");
  const [result, setResult] = useState<{ value: number; unit: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fromUnit = allUnits.find((u) => u.id === fromId);

  // Only offer to-units of the same type — prevents kg→ml nonsense.
  const candidates = useMemo(() => {
    if (!fromUnit) return [];
    return allUnits.filter(
      (u) => u.id !== fromUnit.id && u.unitType === fromUnit.unitType && !u.archivedAt,
    );
  }, [allUnits, fromUnit]);

  const groupedCandidates = useMemo(() => {
    const custom = candidates.filter((u) => !u.systemGenerated);
    const system = candidates.filter((u) => u.systemGenerated);
    return { custom, system };
  }, [candidates]);

  const run = () => {
    setResult(null);
    setError(null);
    const quantity = Number(qty);
    if (!fromId || !toId) {
      setError("Pick both units.");
      return;
    }
    if (!quantity || Number.isNaN(quantity)) {
      setError("Quantity must be a number.");
      return;
    }
    startTransition(async () => {
      const res = await convertUnits(fromId, toId, quantity);
      if (!res) {
        setError("No conversion path between these units.");
        toast({
          variant: "destructive",
          title: "Conversion failed",
          description: "Define a conversion between these units first.",
        });
        return;
      }
      setResult({ value: res.result, unit: res.toUnit });
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          Convert
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
          {/* From */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <NumericFormat
                customInput={Input}
                value={qty}
                onValueChange={(v) => setQty(v.value)}
                thousandSeparator
                decimalScale={10}
                allowNegative={false}
                className="w-[120px]"
                disabled={isPending}
              />
              <Select value={fromId} onValueChange={setFromId} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {allUnits
                    .filter((u) => !u.archivedAt)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center text-muted-foreground pb-2">
            <ArrowRight className="h-4 w-4" />
          </div>

          {/* To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Select value={toId} onValueChange={setToId} disabled={isPending || !fromUnit}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    fromUnit
                      ? candidates.length
                        ? `Select ${fromUnit.unitType.toLowerCase()} unit`
                        : "No other units of this type"
                      : "Pick from-unit first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groupedCandidates.custom.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Custom</SelectLabel>
                    {groupedCandidates.custom.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {groupedCandidates.system.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        System
                      </span>
                    </SelectLabel>
                    {groupedCandidates.system.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="pb-[1px]">
            <Button onClick={run} disabled={isPending || !fromId || !toId}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-1.5" />
              )}
              Calculate
            </Button>
          </div>
        </div>

        {/* Result / error */}
        {result && (
          <div className="mt-4 rounded-md border bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Result</p>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              {result.value.toLocaleString(undefined, { maximumFractionDigits: 10 })}{" "}
              {result.unit}
            </p>
          </div>
        )}
        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

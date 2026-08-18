"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Loader2, Plus, Ruler } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { createConversion, createUnit } from "@/lib/actions/unit-actions";
import { invalidateUnitsCache, useCachedUnits } from "@/lib/cache/reference-data";
import { UNIT_TYPE_OPTIONS, type UnitType } from "@/types/catalogue/enums";
import type { UnitOfMeasure } from "@/types/unit/type";

interface Props {
  /** Render-prop or react node used as the dialog trigger. */
  trigger: React.ReactNode;
  /** Called with the freshly-created unit on success. */
  onCreated: (unit: UnitOfMeasure) => void | Promise<void>;
  /** Disable the trigger from outside (e.g. while parent is busy). */
  disabled?: boolean;
  /**
   * When set, the new unit is created convertible to this anchor unit: the
   * type is locked to the anchor's, and a required multiplier defines
   * "1 anchor = X new unit" via `createConversion` right after the unit
   * itself is created. Use this whenever the caller's picker is a
   * `CompatibleUnitSelector` — without a conversion the new unit would show
   * up flagged "not compatible" the moment it's picked.
   */
  anchorUnitId?: string;
}

/**
 * Lightweight "create one unit, attach it where I am" dialog — the Unit
 * equivalent of {@link components/widgets/create-category-dialog}. Unlike
 * that widget's full-page counterpart ({@link components/widgets/unit/unit-dialog}),
 * this one never calls `router.refresh()` — it's meant to be dropped into a
 * form without resetting the page around it.
 */
export default function CreateUnitDialog({
  trigger,
  onCreated,
  disabled,
  anchorUnitId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("PIECE");
  const [multiplier, setMultiplier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { data: allUnits } = useCachedUnits();

  const anchorUnit = useMemo(
    () =>
      anchorUnitId
        ? (allUnits ?? []).find((u) => u.id === anchorUnitId) ?? null
        : null,
    [allUnits, anchorUnitId],
  );
  const isAnchored = !!anchorUnitId;
  const effectiveUnitType = isAnchored ? anchorUnit?.unitType : unitType;

  const reset = () => {
    setName("");
    setAbbreviation("");
    setUnitType("PIECE");
    setMultiplier("");
    setError(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAbbr = abbreviation.trim();
    if (!trimmedName || !trimmedAbbr) return;

    if (isAnchored) {
      if (!anchorUnit) {
        setError("Still resolving the anchor unit — try again in a moment.");
        return;
      }
      const parsed = Number(multiplier);
      if (!multiplier || !Number.isFinite(parsed) || parsed <= 0) {
        setError("Enter a positive conversion multiplier.");
        return;
      }
    }
    setError(null);

    startTransition(async () => {
      const unitResult = await createUnit({
        name: trimmedName,
        abbreviation: trimmedAbbr,
        unitType: isAnchored ? anchorUnit!.unitType : unitType,
      });
      if (unitResult.responseType !== "success" || !unitResult.data) {
        setError(unitResult.message ?? "Could not create unit");
        return;
      }
      const newUnit = unitResult.data;

      if (isAnchored) {
        const conversionResult = await createConversion({
          fromUnitId: anchorUnitId!,
          toUnitId: newUnit.id,
          multiplier,
        });
        if (conversionResult.responseType !== "success") {
          invalidateUnitsCache();
          toast({
            variant: "destructive",
            title: "Unit created, but conversion failed",
            description:
              conversionResult.message ??
              "Add the conversion manually from the Units page before using it here.",
          });
          await onCreated(newUnit);
          setOpen(false);
          reset();
          return;
        }
      }

      invalidateUnitsCache();
      toast({ title: "Unit created", description: trimmedName });
      await onCreated(newUnit);
      setOpen(false);
      reset();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md p-0 gap-0 overflow-hidden"
        overlayClassName="bg-foreground/30 backdrop-blur-sm"
      >
        <DialogHeader className="space-y-1.5 px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ruler className="h-3.5 w-3.5" />
            </span>
            New unit
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isAnchored
              ? `Give it a name and abbreviation, and define how it converts from ${anchorUnit?.abbreviation ?? "the anchor unit"} so it's usable here right away.`
              : "Give it a name, abbreviation, and type to attach it here. Pick the right type — it gates which other units this one can convert to."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="new-unit-name"
                className="text-xs font-medium text-muted-foreground"
              >
                UNIT NAME
              </Label>
              <Input
                id="new-unit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sack"
                disabled={isPending}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="new-unit-abbr"
                  className="text-xs font-medium text-muted-foreground"
                >
                  ABBREVIATION
                </Label>
                <Input
                  id="new-unit-abbr"
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                  placeholder="e.g. sack"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  TYPE
                </Label>
                <Select
                  value={effectiveUnitType ?? ""}
                  onValueChange={(v) => setUnitType(v as UnitType)}
                  disabled={isPending || isAnchored}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isAnchored ? "Matches anchor" : "Select"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAnchored && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="new-unit-multiplier"
                  className="text-xs font-medium text-muted-foreground"
                >
                  CONVERSION — 1 {anchorUnit?.abbreviation ?? "anchor"} = ?{" "}
                  {abbreviation.trim() || "new unit"}
                </Label>
                <NumericFormat
                  id="new-unit-multiplier"
                  customInput={Input}
                  value={multiplier}
                  onValueChange={(v) => setMultiplier(v.value)}
                  thousandSeparator
                  decimalScale={10}
                  allowNegative={false}
                  placeholder="e.g. 1000"
                  disabled={isPending}
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-3 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                isPending ||
                !name.trim() ||
                !abbreviation.trim() ||
                (isAnchored &&
                  (!anchorUnit || !multiplier || Number(multiplier) <= 0))
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Create unit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Check, ChevronsUpDown, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCompatibleUnits,
  getUnits,
} from "@/lib/actions/unit-actions";
import type { CompatibleUnit, UnitOfMeasure } from "@/types/unit/type";

interface Props {
  /**
   * The unit to anchor compatibility on (typically the stock variant's
   * tracking unit). When omitted, falls back to a plain "all units" picker
   * so edit-mode forms still resolve before the user re-selects a variant.
   */
  anchorUnitId?: string;
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

// Module-level caches shared across instances so each anchor / "all units"
// fetch happens once per session.
let allUnitsCache: UnitOfMeasure[] | null = null;
let allUnitsPromise: Promise<UnitOfMeasure[]> | null = null;
const compatCache = new Map<string, CompatibleUnit[]>();
const compatPromises = new Map<string, Promise<CompatibleUnit[]>>();

function fetchAllUnits(): Promise<UnitOfMeasure[]> {
  if (allUnitsCache) return Promise.resolve(allUnitsCache);
  if (!allUnitsPromise) {
    allUnitsPromise = getUnits().then((d) => {
      allUnitsCache = d;
      return d;
    });
  }
  return allUnitsPromise;
}

function fetchCompat(anchorId: string): Promise<CompatibleUnit[]> {
  const cached = compatCache.get(anchorId);
  if (cached) return Promise.resolve(cached);
  let p = compatPromises.get(anchorId);
  if (!p) {
    p = getCompatibleUnits(anchorId).then((d) => {
      compatCache.set(anchorId, d);
      return d;
    });
    compatPromises.set(anchorId, p);
  }
  return p;
}

/**
 * Unit picker that narrows to units reachable from `anchorUnitId` in one hop.
 * If no anchor is given, behaves like the plain UnitSelector (full catalog).
 *
 * The "Selected" group only appears when the current `value` doesn't sit in
 * the compatibility list — typically because the anchor changed and the
 * previously-picked unit is no longer reachable. Shown as a warning so the
 * user notices and re-picks rather than silently submitting an unconvertible
 * unit.
 */
const CompatibleUnitSelector: React.FC<Props> = ({
  anchorUnitId,
  placeholder = "Select unit",
  value,
  isDisabled,
  onChange,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const [allUnits, setAllUnits] = useState<UnitOfMeasure[]>(allUnitsCache ?? []);
  const [compat, setCompat] = useState<CompatibleUnit[] | null>(
    anchorUnitId ? compatCache.get(anchorUnitId) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState(
    anchorUnitId ? !compatCache.has(anchorUnitId) : !allUnitsCache,
  );
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

  useEffect(() => {
    const measure = () => {
      if (triggerRef.current) setTriggerWidth(triggerRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (triggerRef.current) ro.observe(triggerRef.current);
    return () => ro.disconnect();
  }, []);

  // Always have all units available — used for the "Selected (not compatible)"
  // fallback row and for the no-anchor path.
  useEffect(() => {
    if (allUnits.length > 0) return;
    fetchAllUnits().then(setAllUnits).catch(() => setAllUnits([]));
  }, [allUnits.length]);

  // Refetch compatibility set whenever the anchor changes.
  useEffect(() => {
    if (!anchorUnitId) {
      setCompat(null);
      setIsLoading(allUnits.length === 0);
      return;
    }
    const cached = compatCache.get(anchorUnitId);
    if (cached) {
      setCompat(cached);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetchCompat(anchorUnitId)
      .then((d) => setCompat(d))
      .catch(() => setCompat([]))
      .finally(() => setIsLoading(false));
  }, [anchorUnitId, allUnits.length]);

  const anchorAbbr = useMemo(() => {
    if (!anchorUnitId) return null;
    const fromCompat = compat?.find((c) => c.unitId === anchorUnitId);
    if (fromCompat) return fromCompat.abbreviation;
    return allUnits.find((u) => u.id === anchorUnitId)?.abbreviation ?? null;
  }, [anchorUnitId, compat, allUnits]);

  const groupsWhenAnchored = useMemo(() => {
    if (!anchorUnitId || !compat) return null;
    const term = search.toLowerCase();
    const filtered = term
      ? compat.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.abbreviation.toLowerCase().includes(term),
        )
      : compat;

    const anchor = filtered.find((c) => c.unitId === anchorUnitId);
    const others = filtered.filter((c) => c.unitId !== anchorUnitId);
    const custom = others
      .filter((c) => !c.systemGenerated)
      .sort((a, b) => a.name.localeCompare(b.name));
    const system = others
      .filter((c) => c.systemGenerated)
      .sort((a, b) => a.name.localeCompare(b.name));

    return { anchor: anchor ?? null, custom, system };
  }, [anchorUnitId, compat, search]);

  const groupsWhenUnanchored = useMemo(() => {
    if (anchorUnitId) return null;
    const term = search.toLowerCase();
    const selectable = allUnits.filter((u) => !u.archivedAt);
    const filtered = term
      ? selectable.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.abbreviation.toLowerCase().includes(term),
        )
      : selectable;
    const groups: Record<string, UnitOfMeasure[]> = {};
    for (const u of filtered) {
      const t = u.unitType || "PIECE";
      (groups[t] ??= []).push(u);
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    const order = ["WEIGHT", "VOLUME", "PIECE", "LENGTH", "AREA"];
    return order
      .filter((t) => groups[t]?.length)
      .map((t) => ({ type: t, units: groups[t] }));
  }, [anchorUnitId, allUnits, search]);

  // Picked unit that's not in the current compatibility list — surface so the
  // user can keep it intentionally or re-pick. Only relevant when anchored.
  const orphanedSelection = useMemo(() => {
    if (!anchorUnitId || !value || !compat) return null;
    const inCompat = compat.some((c) => c.unitId === value);
    if (inCompat) return null;
    return allUnits.find((u) => u.id === value) ?? null;
  }, [anchorUnitId, value, compat, allUnits]);

  const selectedLabel = useMemo(() => {
    if (!value) return null;
    const fromCompat = compat?.find((c) => c.unitId === value);
    if (fromCompat) return `${fromCompat.name} (${fromCompat.abbreviation})`;
    const fromAll = allUnits.find((u) => u.id === value);
    if (fromAll) return `${fromAll.name} (${fromAll.abbreviation})`;
    return null;
  }, [value, compat, allUnits]);

  const handleSelect = useCallback(
    (unitId: string) => {
      onChange(unitId === value ? "" : unitId);
      setOpen(false);
    },
    [value, onChange],
  );

  const popoverWidth = Math.max(triggerWidth, 280);
  const showLoadingText = isLoading && !compat && allUnits.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden font-normal"
          disabled={isDisabled || showLoadingText}
          onBlur={onBlur}
        >
          <span className="truncate text-left flex-1">
            {showLoadingText ? "Loading..." : selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0"
        style={{ width: popoverWidth }}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search units..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>
              {isLoading ? "Loading..." : "No units found."}
            </CommandEmpty>

            {isLoading && !compat && allUnits.length === 0 ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
              </div>
            ) : anchorUnitId && groupsWhenAnchored ? (
              <>
                {orphanedSelection && (
                  <CommandGroup heading="Selected (not compatible)">
                    <CommandItem
                      key={orphanedSelection.id}
                      value={`${orphanedSelection.name} ${orphanedSelection.abbreviation}`}
                      onSelect={() => handleSelect(orphanedSelection.id)}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4 shrink-0 opacity-100" />
                      <span className="flex items-center gap-1.5">
                        {orphanedSelection.name}
                      </span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ml-auto">
                        no conversion to {anchorAbbr ?? "anchor"}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {groupsWhenAnchored.anchor && (
                  <CommandGroup heading="Anchor">
                    <CommandItem
                      key={groupsWhenAnchored.anchor.unitId}
                      value={`${groupsWhenAnchored.anchor.name} ${groupsWhenAnchored.anchor.abbreviation}`}
                      onSelect={() =>
                        handleSelect(groupsWhenAnchored.anchor!.unitId)
                      }
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === groupsWhenAnchored.anchor.unitId
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="flex items-center gap-1.5">
                        {groupsWhenAnchored.anchor.name}
                        {groupsWhenAnchored.anchor.systemGenerated && (
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {groupsWhenAnchored.anchor.abbreviation}
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {groupsWhenAnchored.custom.length > 0 && (
                  <CommandGroup heading="Custom">
                    {groupsWhenAnchored.custom.map((u) => (
                      <CompatItem
                        key={u.unitId}
                        unit={u}
                        anchorAbbr={anchorAbbr}
                        selected={value === u.unitId}
                        onSelect={() => handleSelect(u.unitId)}
                      />
                    ))}
                  </CommandGroup>
                )}

                {groupsWhenAnchored.system.length > 0 && (
                  <CommandGroup heading="System">
                    {groupsWhenAnchored.system.map((u) => (
                      <CompatItem
                        key={u.unitId}
                        unit={u}
                        anchorAbbr={anchorAbbr}
                        selected={value === u.unitId}
                        onSelect={() => handleSelect(u.unitId)}
                      />
                    ))}
                  </CommandGroup>
                )}

                {!groupsWhenAnchored.anchor &&
                  groupsWhenAnchored.custom.length === 0 &&
                  groupsWhenAnchored.system.length === 0 && (
                    <div className="px-3 py-4 text-xs text-muted-foreground">
                      No compatible units. Define a conversion under{" "}
                      <span className="underline">Units of measure</span>.
                    </div>
                  )}
              </>
            ) : (
              groupsWhenUnanchored?.map((group) => (
                <CommandGroup key={group.type} heading={group.type}>
                  {group.units.map((u) => (
                    <CommandItem
                      key={u.id}
                      value={`${u.name} ${u.abbreviation}`}
                      onSelect={() => handleSelect(u.id)}
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === u.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex items-center gap-1.5">
                        {u.name}
                        {u.systemGenerated && (
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {u.abbreviation}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

function CompatItem({
  unit,
  anchorAbbr,
  selected,
  onSelect,
}: {
  unit: CompatibleUnit;
  anchorAbbr: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const factor = formatFactor(unit.factorFromAnchor);
  return (
    <CommandItem
      value={`${unit.name} ${unit.abbreviation}`}
      onSelect={onSelect}
      className="gap-2"
    >
      <Check
        className={cn(
          "h-4 w-4 shrink-0",
          selected ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="flex items-center gap-1.5">
        {unit.name}
        {unit.systemGenerated && (
          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
        )}
      </span>
      <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
        {anchorAbbr
          ? `1 ${anchorAbbr} = ${factor} ${unit.abbreviation}`
          : unit.abbreviation}
      </span>
    </CommandItem>
  );
}

function formatFactor(n: number): string {
  if (!Number.isFinite(n)) return "?";
  return Number(n.toFixed(10))
    .toString()
    .replace(/\.?0+$/, (s) => (s.startsWith(".") ? "" : s));
}

export default CompatibleUnitSelector;

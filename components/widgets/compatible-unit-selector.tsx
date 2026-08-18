"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Check, ChevronDown, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { controlComboboxTriggerClass } from "@/components/ui/field";
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
import { getCompatibleUnits } from "@/lib/actions/unit-actions";
import {
  unitsCache,
  useCachedUnits,
} from "@/lib/cache/reference-data";
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
  /**
   * Caller-side loading — e.g. the stock catalogue that supplies
   * `anchorUnitId` hasn't resolved yet. Rendered exactly like the internal
   * compatibility fetch: spinner in the trigger instead of a silently dead
   * control.
   */
  isLoading?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /**
   * Fires with the full compatible-unit row whenever the selection resolves —
   * including on mount from an existing value. Callers that need
   * `factorFromAnchor` (e.g. to derive a cost per sale unit) use this;
   * `onChange` alone only yields the id. `null` when cleared, while the
   * compatibility set is still loading, or when the selected id isn't in the
   * anchor's compatible set.
   *
   * Memoise this with `useCallback` — it is an effect dependency.
   */
  onUnitMeta?: (unit: CompatibleUnit | null) => void;
}

// Per-anchor compatibility lookups stay local — they're parameterised by
// anchor and therefore not a fit for the shared reference cache. When the
// shared units cache is invalidated (any unit or conversion mutation), every
// compat entry becomes potentially stale, so we clear them in lockstep.
const compatCache = new Map<string, CompatibleUnit[]>();
const compatPromises = new Map<string, Promise<CompatibleUnit[]>>();

// Bumped whenever the shared units cache notifies — that covers both a real
// mutation (invalidate) and the cache merely finishing its own first load.
// Mounted selectors re-fetch on a bump, but only in the background: a picker
// that already has a list must never flip back to a disabled "Loading…".
let compatVersion = 0;
const versionListeners = new Set<() => void>();

unitsCache.subscribe(() => {
  compatCache.clear();
  compatPromises.clear();
  compatVersion += 1;
  for (const listener of versionListeners) listener();
});

function useCompatVersion(): number {
  const [version, setVersion] = useState(compatVersion);
  useEffect(() => {
    const listener = () => setVersion(compatVersion);
    versionListeners.add(listener);
    // Catch a bump that landed between render and effect.
    listener();
    return () => {
      versionListeners.delete(listener);
    };
  }, []);
  return version;
}

function fetchCompat(anchorId: string): Promise<CompatibleUnit[]> {
  const cached = compatCache.get(anchorId);
  if (cached) return Promise.resolve(cached);
  let p = compatPromises.get(anchorId);
  if (!p) {
    p = getCompatibleUnits(anchorId)
      .then((d) => {
        compatCache.set(anchorId, d);
        return d;
      })
      .finally(() => {
        // Never leave a settled promise memoised — a rejected one would be
        // replayed to every later mount and pin the picker to "no units".
        if (compatPromises.get(anchorId) === p) compatPromises.delete(anchorId);
      });
    compatPromises.set(anchorId, p);
  }
  return p;
}

const EMPTY_UNITS: UnitOfMeasure[] = [];

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
  isLoading: externalLoading = false,
  onChange,
  onBlur,
  onUnitMeta,
}) => {
  const [open, setOpen] = useState(false);
  const { data: allUnitsData, loading: allUnitsLoading } = useCachedUnits();
  const allUnits = allUnitsData ?? EMPTY_UNITS;
  const compatEpoch = useCompatVersion();
  // Keyed by anchor so a list fetched for the *previous* anchor is never read
  // as this one's — the old behaviour briefly grouped the wrong units and
  // flagged the freshly-defaulted selection as "not compatible".
  const [compatState, setCompatState] = useState<{
    anchor: string;
    units: CompatibleUnit[];
  } | null>(null);
  const compat =
    anchorUnitId && compatState?.anchor === anchorUnitId
      ? compatState.units
      : null;
  const hasCompatRef = useRef(false);
  hasCompatRef.current = compat !== null;
  const [compatLoading, setCompatLoading] = useState<boolean>(!!anchorUnitId);
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

  // Refetch the compatibility set whenever the anchor changes or the units
  // cache notifies (a mutation clears compatCache via the module-level
  // subscription, so we re-fetch from scratch).
  useEffect(() => {
    if (!anchorUnitId) {
      setCompatLoading(false);
      return;
    }
    const anchor = anchorUnitId;
    const cached = compatCache.get(anchor);
    if (cached) {
      setCompatState({ anchor, units: cached });
      setCompatLoading(false);
      return;
    }
    // Only the first load for this anchor blocks the control. A version bump
    // re-fetches silently over the list already on screen, so a usable picker
    // can't be dragged back into a disabled state by unrelated cache traffic.
    if (!hasCompatRef.current) setCompatLoading(true);
    let cancelled = false;
    fetchCompat(anchor)
      .then((d) => {
        if (!cancelled) setCompatState({ anchor, units: d });
      })
      .catch(() => {
        if (!cancelled) setCompatState({ anchor, units: [] });
      })
      .finally(() => {
        if (!cancelled) setCompatLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [anchorUnitId, compatEpoch]);

  // Surface the resolved row — not just the id — so callers can use
  // factorFromAnchor. Runs on mount too, once `compat` has loaded, so an
  // edit-mode form gets the factor for its pre-existing selection.
  useEffect(() => {
    if (!onUnitMeta) return;
    if (!value || !compat) {
      onUnitMeta(null);
      return;
    }
    onUnitMeta(compat.find((u) => u.unitId === value) ?? null);
  }, [value, compat, onUnitMeta]);

  // Anchored: waiting on this anchor's compatibility set (or on the caller
  // still resolving the anchor itself). Unanchored: waiting on the shared
  // units catalogue.
  const isLoading =
    externalLoading ||
    (anchorUnitId
      ? compatLoading && compat === null
      : allUnitsLoading && allUnits.length === 0);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-busy={isLoading}
          className={cn(controlComboboxTriggerClass, "overflow-hidden")}
          disabled={isDisabled || isLoading}
          onBlur={onBlur}
        >
          {isLoading ? (
            <span className="flex flex-1 items-center gap-2 truncate text-left text-muted-2">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              Loading units…
            </span>
          ) : (
            <span
              className={cn(
                "truncate text-left flex-1",
                !selectedLabel && "text-muted-2",
              )}
            >
              {selectedLabel ?? placeholder}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
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
              {isLoading ? "Loading units…" : "No units found."}
            </CommandEmpty>

            {isLoading ? (
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

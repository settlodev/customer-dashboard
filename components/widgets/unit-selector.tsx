"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { getUnits } from "@/lib/actions/unit-actions";
import type { UnitOfMeasure } from "@/types/unit/type";

const TYPE_LABELS: Record<string, string> = {
  WEIGHT: "Weight",
  VOLUME: "Volume",
  LENGTH: "Length",
  PIECE: "Piece / Packaging",
  AREA: "Area",
};

const TYPE_ORDER = ["WEIGHT", "VOLUME", "PIECE", "LENGTH", "AREA"];

interface UnitSelectorProps {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

// Module-level cache so all instances share the same fetch
let unitCache: UnitOfMeasure[] | null = null;
let unitFetchPromise: Promise<UnitOfMeasure[]> | null = null;

function fetchUnitsCached(): Promise<UnitOfMeasure[]> {
  if (unitCache) return Promise.resolve(unitCache);
  if (!unitFetchPromise) {
    unitFetchPromise = getUnits().then((data) => {
      unitCache = data;
      return data;
    });
  }
  return unitFetchPromise;
}

const UnitSelector = ({
  placeholder = "Select unit",
  value,
  isDisabled,
  onChange,
  onBlur,
}: UnitSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [units, setUnits] = useState<UnitOfMeasure[]>(unitCache ?? []);
  const [isLoading, setIsLoading] = useState(!unitCache);
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

  useEffect(() => {
    if (units.length > 0) return;
    setIsLoading(true);
    fetchUnitsCached()
      .then(setUnits)
      .finally(() => setIsLoading(false));
  }, [units.length]);

  const grouped = useMemo(() => {
    const term = search.toLowerCase();
    // Archived custom units shouldn't be assignable to new stock variants.
    const selectable = units.filter((u) => !u.archivedAt);
    const filtered = term
      ? selectable.filter(
          (u) =>
            u.name.toLowerCase().includes(term) ||
            u.abbreviation.toLowerCase().includes(term),
        )
      : selectable;

    const groups: Record<string, UnitOfMeasure[]> = {};
    for (const u of filtered) {
      const type = u.unitType || "PIECE";
      if (!groups[type]) groups[type] = [];
      groups[type].push(u);
    }

    // Sort within groups
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    return TYPE_ORDER.filter((t) => groups[t]?.length).map((t) => ({
      type: t,
      label: TYPE_LABELS[t] || t,
      units: groups[t],
    }));
  }, [units, search]);

  const selected = useMemo(
    () => (value ? units.find((u) => u.id === value) : null),
    [units, value],
  );

  const handleSelect = useCallback(
    (unitId: string) => {
      onChange(unitId === value ? "" : unitId);
      setOpen(false);
    },
    [value, onChange],
  );

  const displayText = selected
    ? `${selected.name} (${selected.abbreviation})`
    : placeholder;

  const popoverWidth = Math.max(triggerWidth, 260);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden font-normal"
          disabled={isDisabled || isLoading}
          onBlur={onBlur}
        >
          <span className="truncate text-left flex-1">
            {isLoading ? "Loading..." : displayText}
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
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {isLoading ? "Loading..." : "No units found."}
            </CommandEmpty>

            {isLoading && units.length === 0 ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
              </div>
            ) : (
              grouped.map((group) => (
                <CommandGroup
                  key={group.type}
                  heading={group.label}
                >
                  {group.units.map((unit) => (
                    <CommandItem
                      key={unit.id}
                      value={`${unit.name} ${unit.abbreviation}`}
                      onSelect={() => handleSelect(unit.id)}
                      className="gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === unit.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex items-center gap-1.5">
                        {unit.name}
                        {unit.systemGenerated && (
                          <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {unit.abbreviation}
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

export default UnitSelector;

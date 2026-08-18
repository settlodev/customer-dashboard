"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Loader2,
  MapPin,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { controlComboboxTriggerClass } from "@/components/ui/field";
import {
  Command,
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
import { getTransferDestinations } from "@/lib/actions/stock-transfer-actions";
import type { DestinationOption } from "@/types/stock-transfer/type";
import type { DestinationType } from "@/types/catalogue/enums";

interface Props {
  /** Selected destination id. */
  value?: string;
  isDisabled?: boolean;
  placeholder?: string;
  /** Emits the picked destination's id *and* type so the form can set both. */
  onChange: (id: string, type: DestinationType) => void;
  /**
   * Loader for the selectable options. Defaults to `getTransferDestinations`
   * (the stock-transfer picker). The stock-*request* form passes
   * `getRequestSources` so the same widget lists only valid request sources for
   * the active destination.
   */
  loadOptions?: () => Promise<DestinationOption[]>;
}

const TYPE_META: Record<
  DestinationType,
  { label: string; icon: typeof MapPin }
> = {
  LOCATION: { label: "Locations", icon: MapPin },
  WAREHOUSE: { label: "Warehouses", icon: WarehouseIcon },
  STORE: { label: "Stores", icon: StoreIcon },
};

// Stable display order for the grouped list.
const TYPE_ORDER: DestinationType[] = ["LOCATION", "WAREHOUSE", "STORE"];

const DestinationSelector: React.FC<Props> = ({
  value,
  isDisabled,
  placeholder = "Select destination",
  onChange,
  loadOptions,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<DestinationOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const measure = () => {
      if (triggerRef.current) setTriggerWidth(triggerRef.current.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (triggerRef.current) ro.observe(triggerRef.current);
    return () => ro.disconnect();
  }, []);

  // The valid-destination set is small and the user is here specifically to
  // create a transfer, so fetch eagerly on mount rather than on first open.
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setIsLoading(true);
    (loadOptions ?? getTransferDestinations)()
      .then(setOptions)
      .catch(() => setOptions([]))
      .finally(() => setIsLoading(false));
    // The hasFetchedRef guard fixes the loader to its first value (forms never
    // swap loaders), so this intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const visible = term
      ? options.filter(
          (o) =>
            o.name.toLowerCase().includes(term) ||
            (o.subline ?? "").toLowerCase().includes(term),
        )
      : options;
    return TYPE_ORDER.map((type) => ({
      type,
      items: visible.filter((o) => o.type === type),
    })).filter((g) => g.items.length > 0);
  }, [options, searchTerm]);

  const selectedOption = useMemo(
    () => (value ? (options.find((o) => o.id === value) ?? null) : null),
    [options, value],
  );

  const handleSelect = useCallback(
    (option: DestinationOption) => {
      onChange(option.id, option.type);
      setOpen(false);
    },
    [onChange],
  );

  const isResolvingValue = !!value && !selectedOption && isLoading;
  const popoverWidth = Math.max(triggerWidth, 320);
  const SelectedIcon = selectedOption
    ? TYPE_META[selectedOption.type].icon
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(controlComboboxTriggerClass, "overflow-hidden")}
          disabled={isDisabled}
        >
          <span className="flex flex-1 items-center gap-2 truncate text-left">
            {isResolvingValue ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                <span className="text-muted-foreground">Loading...</span>
              </>
            ) : selectedOption && SelectedIcon ? (
              <>
                <SelectedIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{selectedOption.name}</span>
              </>
            ) : (
              <span className="text-muted-2">{placeholder}</span>
            )}
          </span>
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
            placeholder="Search destinations..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            {isLoading && options.length === 0 ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading destinations...
                </p>
              </div>
            ) : grouped.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? `No destinations match "${searchTerm}"`
                  : "No other destinations available."}
              </div>
            ) : (
              grouped.map((group) => {
                const Icon = TYPE_META[group.type].icon;
                return (
                  <CommandGroup
                    key={group.type}
                    heading={TYPE_META[group.type].label}
                  >
                    {group.items.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={`${option.name} ${option.subline ?? ""} ${option.id}`}
                        onSelect={() => handleSelect(option)}
                        className="items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            value === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{option.name}</span>
                          {option.subline && (
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {option.subline}
                            </span>
                          )}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DestinationSelector;

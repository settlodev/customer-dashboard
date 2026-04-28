"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
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
import { getStocks } from "@/lib/actions/stock-actions";
import type { Stock, StockVariant } from "@/types/stock/type";

export interface VariantMeta {
  id: string;
  displayName: string;
  serialTracked: boolean;
}

interface Props {
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onVariantMeta?: (meta: VariantMeta | null) => void;
  disabledValues?: string[];
  /** When provided, the dropdown only surfaces variants whose id is in this list. */
  allowedValues?: string[];
  /**
   * Fired when this selector's internal catalogue fetch starts and finishes.
   * Lets parent forms aggregate loading state across rows so they can disable
   * Submit / Cancel until every selector has resolved its initial value.
   */
  onLoadingChange?: (loading: boolean) => void;
}

const StockVariantSelector: React.FC<Props> = ({
  placeholder = "Select stock item",
  value,
  isDisabled,
  description,
  onChange,
  onVariantMeta,
  disabledValues = [],
  allowedValues,
  onLoadingChange,
}) => {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  // Start in loading state when an initial value is present so the trigger
  // shows a spinner immediately instead of flashing the "Select stock item"
  // placeholder before the catalogue arrives and the matching variant is
  // resolved.
  const [isLoading, setIsLoading] = useState(!!value);
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

  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (!open && !value) return;
    hasFetchedRef.current = true;
    setIsLoading(true);
    getStocks()
      .then(setStocks)
      .catch(() => setStocks([]))
      .finally(() => setIsLoading(false));
  }, [open, value]);

  // Bubble loading state up so parent forms can disable Submit/Cancel until
  // the catalogue arrives — important when the form was pre-filled with
  // existing variant ids (e.g. GRN form pre-linked to an LPO).
  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const allVariantOptions = useMemo(
    () =>
      stocks
        .filter((s) => !s.archived)
        .flatMap((stock) =>
          stock.variants
            .filter((v) => !v.archived)
            .map((variant) => ({
              id: variant.id,
              displayName: variant.displayName || `${stock.name} - ${variant.name}`,
              serialTracked: variant.serialTracked ?? false,
              disabled: disabledValues.includes(variant.id),
              searchString: `${stock.name} ${variant.name} ${variant.sku || ""}`.toLowerCase(),
            })),
        ),
    [stocks, disabledValues],
  );

  const displayedOptions = useMemo(() => {
    const restricted = allowedValues
      ? allVariantOptions.filter((o) => allowedValues.includes(o.id))
      : allVariantOptions;
    if (!searchTerm) return restricted;
    const term = searchTerm.toLowerCase();
    return restricted.filter((o) => o.searchString.includes(term));
  }, [allVariantOptions, allowedValues, searchTerm]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return allVariantOptions.find((o) => o.id === value) ?? null;
  }, [allVariantOptions, value]);

  const handleSelect = useCallback(
    (option: { id: string; displayName: string; serialTracked: boolean }) => {
      const deselecting = option.id === value;
      onChange(deselecting ? "" : option.id);
      onVariantMeta?.(deselecting ? null : { id: option.id, displayName: option.displayName, serialTracked: option.serialTracked });
      setOpen(false);
    },
    [value, onChange, onVariantMeta],
  );

  // While we have a value but haven't resolved it yet, show a loading
  // indicator instead of the placeholder. Once the fetch settles, fall
  // back to the placeholder if the variant truly doesn't exist (e.g.
  // archived or filtered out by the parent) so the user can re-pick.
  const isResolvingValue = !!value && !selectedOption && isLoading;
  const popoverWidth = Math.max(triggerWidth, 300);

  return (
    <div className="space-y-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between overflow-hidden font-normal"
            disabled={isDisabled}
          >
            <span className="truncate text-left flex-1 flex items-center gap-2">
              {isResolvingValue ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                  <span className="text-muted-foreground">Loading...</span>
                </>
              ) : selectedOption ? (
                <span className="truncate">{selectedOption.displayName}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search stock items..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                {isLoading ? "Loading..." : "No stock items found."}
              </CommandEmpty>
              <CommandGroup>
                {isLoading && displayedOptions.length === 0 ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading stock items...</p>
                  </div>
                ) : (
                  displayedOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.searchString}
                      disabled={option.disabled}
                      onSelect={() => handleSelect(option)}
                      className="items-start gap-2"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="break-words">{option.displayName}</span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

export default StockVariantSelector;

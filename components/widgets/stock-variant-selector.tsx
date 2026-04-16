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
}

const StockVariantSelector: React.FC<Props> = ({
  placeholder = "Select stock item",
  value,
  isDisabled,
  description,
  onChange,
  onVariantMeta,
  disabledValues = [],
}) => {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (open && stocks.length === 0) {
      setIsLoading(true);
      getStocks()
        .then(setStocks)
        .catch(() => setStocks([]))
        .finally(() => setIsLoading(false));
    }
  }, [open, stocks.length]);

  const allVariantOptions = useMemo(() => {
    const options = stocks
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
      );

    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((o) => o.searchString.includes(term));
  }, [stocks, disabledValues, searchTerm]);

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

  const displayText = selectedOption?.displayName || placeholder;
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
            className="w-full justify-between overflow-hidden"
            disabled={isDisabled}
          >
            <span className="truncate text-left flex-1">{displayText}</span>
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
                {isLoading && allVariantOptions.length === 0 ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading stock items...</p>
                  </div>
                ) : (
                  allVariantOptions.map((option) => (
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

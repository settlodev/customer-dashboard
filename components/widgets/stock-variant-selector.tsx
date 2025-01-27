"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { fetchStock } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { StockVariant } from "@/types/stockVariant/type";

interface Props {
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  disabledValues?: string[];
}

const StockVariantSelector: React.FC<Props> = ({
  placeholder = "Select stock item",
//   isRequired,
  value,
  isDisabled,
  description,
  onChange,
  disabledValues = [],
}) => {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getDisplayName = (stock: Stock, variant: StockVariant) => {
    return `${stock.name} - ${variant.name}`;
  };

  useEffect(() => {
    async function loadStocks() {
      try {
        setIsLoading(true);
        const fetchedStocks = await fetchStock();
        setStocks(fetchedStocks);
      } catch (error: any) {
        console.log("Error fetching stocks:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStocks();
  }, []);

  const variantOptions = stocks.flatMap((stock) =>
    stock.stockVariants.map((variant) => ({
      id: variant.id,
      displayName: getDisplayName(stock, variant),
      disabled: disabledValues.includes(variant.id),
    }))
  );

  const selectedOption = variantOptions.find((option) => option.id === value);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isDisabled || isLoading}
          >
            {isLoading 
              ? "Loading stock items..." 
              : selectedOption 
                ? selectedOption.displayName 
                : placeholder
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command filter={(value, search) => {
            if (!search) return 1;
            const item = variantOptions.find(option => option.id === value);
            if (!item) return 0;
            return item.displayName.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No stock item found.</CommandEmpty>
              <CommandGroup>
                {variantOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    disabled={option.disabled}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.displayName}
                  </CommandItem>
                ))}
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
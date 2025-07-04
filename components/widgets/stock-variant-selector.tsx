

"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { searchStock, getStockVariantById } from "@/lib/actions/stock-actions";
import { Stock } from "@/types/stock/type";
import { StockVariant } from "@/types/stockVariant/type";
import { ApiResponse } from "@/types/types";
import { UUID } from "crypto";

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
  value,
  isDisabled,
  description,
  onChange,
  disabledValues = [],
}) => {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedVariantInfo, setSelectedVariantInfo] = useState<{
    id: string;
    displayName: string;
  } | null>(null);
  const [isLoadingSelectedVariant, setIsLoadingSelectedVariant] = useState(false);
  const ITEMS_PER_PAGE = 20;

  const getDisplayName = (stock: Stock, variant: StockVariant) => {
    return `${stock.name} - ${variant.name}`;
  };

  // Initialize data loading on component mount
  useEffect(() => {
    if (!hasInitialized) {
      if (value) {
        // For a preselected value, fetch that specific variant first for immediate display
        loadSpecificVariant(value);
      } else {
        // For new records, start loading the first page of data immediately
        loadStocks("", 1);
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, value]);

  // Handle value changes (when form updates the value)
  useEffect(() => {
    if (value && hasInitialized) {
      // Check if we already have this variant in our stocks
      const existingVariant = allVariantOptions.find(option => option.id === value);
      if (existingVariant) {
        setSelectedVariantInfo({
          id: existingVariant.id,
          displayName: existingVariant.displayName
        });
      } else {
        // Load the specific variant info if we don't have it
        loadSpecificVariant(value);
      }
    } else if (!value) {
      setSelectedVariantInfo(null);
    }
  }, [value, hasInitialized]);

  // Handle search with debounce
  useEffect(() => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    if (hasInitialized) {
      const timeout = setTimeout(() => {
        setPage(1);
        setStocks([]);
        loadStocks(searchTerm, 1);
      }, 300);
      
      setDebounceTimeout(timeout);
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [searchTerm, hasInitialized]);

  async function loadSpecificVariant(variantId: string) {
    try {
      setIsLoadingSelectedVariant(true);
      const variantInfo = await getStockVariantById(variantId);
      
      if (variantInfo && variantInfo.variant) {
        // Set the selected variant info for immediate display
        setSelectedVariantInfo({
          id: variantInfo.variant.id,
          displayName: `${variantInfo.stockName || ''} - ${variantInfo.variant.name}`
        });

        // Create a minimal stock structure with just the selected variant
        const stockWithVariant = [{
          id: variantInfo.stockId || 'temp-id',
          name: variantInfo.stockName || '',
          description: '',
          unit: '',
          status: true,
          canDelete: false,
          business: '' as UUID,
          location: '' as UUID,
          isArchived: false,
          stockVariants: [variantInfo.variant]
        }];
        
        setStocks(stockWithVariant);
        
        // Load the initial page of stocks in the background for when user opens dropdown
        loadStocks("", 1, false);
      } else {
        // Fallback to loading all stocks if specific variant can't be found
        loadStocks("", 1);
      }
    } catch (error) {
      console.error("Error loading specific variant:", error);
      loadStocks("", 1); // Fallback
    } finally {
      setIsLoadingSelectedVariant(false);
    }
  }

  async function loadStocks(query: string, currentPage: number, showLoading = true) {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const response: ApiResponse<Stock> = await searchStock(query, currentPage, ITEMS_PER_PAGE);
      
      // Check if it's the first page or appending more results
      if (currentPage === 1) {
        // If we have a selected variant that's not in the new results, preserve it
        if (selectedVariantInfo && !response.content.some(stock => 
          stock.stockVariants.some(variant => variant.id === selectedVariantInfo.id)
        )) {
          // Keep the existing stock with the selected variant
          const existingSelectedStock = stocks.find(stock => 
            stock.stockVariants.some(variant => variant.id === selectedVariantInfo.id)
          );
          
          if (existingSelectedStock) {
            setStocks([existingSelectedStock, ...response.content]);
          } else {
            setStocks(response.content);
          }
        } else {
          setStocks(response.content);
        }
      } else {
        setStocks(prevStocks => [...prevStocks, ...response.content]);
      }
      
      // Check if there are more pages
      setHasMore(!response.last);
      
    } catch (error: any) {
      console.log("Error fetching stocks:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Memoize option processing to prevent recalculations
  const allVariantOptions = useMemo(() => 
    stocks.flatMap((stock) =>
      stock.stockVariants.map((variant) => ({
        id: variant.id,
        displayName: getDisplayName(stock, variant),
        disabled: disabledValues.includes(variant.id),
        searchString: `${stock.name.toLowerCase()} ${variant.name.toLowerCase()}`
      }))
    ),
    [stocks, disabledValues]
  );

  const selectedOption = useMemo(() => 
    allVariantOptions.find((option) => option.id === value) || selectedVariantInfo,
    [allVariantOptions, value, selectedVariantInfo]
  );

  // Load more items when reaching the end of the list
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isNearBottom && !isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadStocks(searchTerm, nextPage, false);
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isDisabled || (isLoading && !selectedOption) || isLoadingSelectedVariant}
          >
            {isLoadingSelectedVariant ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : selectedOption ? (
              selectedOption.displayName 
            ) : isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${placeholder.toLowerCase()}...`} 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList onScroll={handleScroll} className="max-h-[300px]">
              <CommandEmpty>
                {isLoading ? "Searching..." : "No stock items found."}
              </CommandEmpty>
              <CommandGroup>
                {allVariantOptions.length === 0 && isLoading ? (
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
                      onSelect={() => {
                        const newValue = option.id === value ? "" : option.id;
                        onChange(newValue);
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
                  ))
                )}
                {isLoading && allVariantOptions.length > 0 && (
                  <div className="py-2 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin opacity-50" />
                    <p className="text-sm text-muted-foreground">Loading more...</p>
                  </div>
                )}
                {!isLoading && hasMore && allVariantOptions.length > 0 && (
                  <div className="py-2 text-center text-sm text-muted-foreground">
                    Scroll down to load more
                  </div>
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
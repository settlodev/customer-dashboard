"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedVariantInfo, setSelectedVariantInfo] = useState<{
    id: string;
    displayName: string;
  } | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitialValue = useRef(false);
  const hasLoadedStocks = useRef(false);

  const ITEMS_PER_PAGE = 20;

  const getDisplayName = (stock: Stock, variant: StockVariant) => {
    return `${stock.name} - ${variant.name}`;
  };

  // Load the selected variant info immediately when value exists
  useEffect(() => {
    if (value && !hasLoadedInitialValue.current) {
      hasLoadedInitialValue.current = true;
      loadSpecificVariantInfo(value);
    } else if (!value) {
      setSelectedVariantInfo(null);
      hasLoadedInitialValue.current = false;
    }
  }, [value]);

  // Load stocks when popover opens
  useEffect(() => {
    if (open && !hasLoadedStocks.current) {
      hasLoadedStocks.current = true;
      loadStocks("", 1);
    }
  }, [open]);

  // Handle search with debounce
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (!open || !hasLoadedStocks.current) {
      return;
    }

    const timeout = setTimeout(() => {
      setPage(1);
      loadStocks(searchTerm, 1);
    }, 300);

    debounceTimeoutRef.current = timeout;

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, open]);

  const loadSpecificVariantInfo = useCallback(async (variantId: string) => {
    try {
      const variantInfo = await getStockVariantById(variantId);

      if (variantInfo && variantInfo.variant) {
        setSelectedVariantInfo({
          id: variantInfo.variant.id,
          displayName: `${variantInfo.stockName || ""} - ${variantInfo.variant.name}`,
        });
      }
    } catch (error) {
      console.error("Error loading specific variant info:", error);
    }
  }, []);

  const loadStocks = useCallback(
    async (query: string, currentPage: number, showLoading = true) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        }

        const response: ApiResponse<Stock> = await searchStock(
          query,
          currentPage,
          ITEMS_PER_PAGE,
        );

        if (currentPage === 1) {
          setStocks(response.content);
        } else {
          setStocks((prevStocks) => [...prevStocks, ...response.content]);
        }

        setHasMore(!response.last);
      } catch (error: any) {
        console.log("Error fetching stocks:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Memoize option processing
  const allVariantOptions = useMemo(
    () =>
      stocks.flatMap((stock) =>
        stock.stockVariants.map((variant) => ({
          id: variant.id,
          displayName: getDisplayName(stock, variant),
          disabled: disabledValues.includes(variant.id),
          searchString: `${stock.name.toLowerCase()} ${variant.name.toLowerCase()}`,
        })),
      ),
    [stocks, disabledValues],
  );

  const selectedOption = useMemo(() => {
    // First try to find in loaded stocks
    const option = allVariantOptions.find((option) => option.id === value);
    if (option) return option;

    // Fallback to cached variant info
    if (selectedVariantInfo && selectedVariantInfo.id === value) {
      return selectedVariantInfo;
    }

    return null;
  }, [allVariantOptions, value, selectedVariantInfo]);

  // Load more items when scrolling
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
            disabled={isDisabled}
          >
            {selectedOption ? selectedOption.displayName : placeholder}
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
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading stock items...
                    </p>
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
                        if (newValue) {
                          setSelectedVariantInfo({
                            id: option.id,
                            displayName: option.displayName,
                          });
                        } else {
                          setSelectedVariantInfo(null);
                        }
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.displayName}
                    </CommandItem>
                  ))
                )}
                {isLoading && allVariantOptions.length > 0 && (
                  <div className="py-2 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      Loading more...
                    </p>
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

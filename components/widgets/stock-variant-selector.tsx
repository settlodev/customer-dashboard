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

interface Props {
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  disabledValues?: string[];
  initialVariantInfo?: {
    stockName: string;
    variant?: { id?: string; name: string };
  } | null;
}

const StockVariantSelector: React.FC<Props> = ({
  placeholder = "Select stock item",
  value,
  isDisabled,
  description,
  onChange,
  disabledValues = [],
  initialVariantInfo,
}) => {
  const [open, setOpen] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingVariant, setIsLoadingVariant] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedVariantInfo, setSelectedVariantInfo] = useState<{
    id: string;
    displayName: string;
  } | null>(() => {
    if (
      value &&
      initialVariantInfo?.variant?.name &&
      initialVariantInfo.stockName
    ) {
      return {
        id: value,
        displayName: `${initialVariantInfo.stockName} - ${initialVariantInfo.variant.name}`,
      };
    }
    return null;
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState<number>(0);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  // NEW: cache of displayNames we've seen, keyed by variant id.
  // Survives async parent updates that might null out initialVariantInfo.
  const displayNameCacheRef = useRef<Map<string, string>>(new Map());

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const measure = () => {
      if (triggerRef.current) {
        setTriggerWidth(triggerRef.current.offsetWidth);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (triggerRef.current) ro.observe(triggerRef.current);
    return () => ro.disconnect();
  }, []);

  const getDisplayName = useCallback((stock: Stock, variant: StockVariant) => {
    return `${stock.name} - ${variant.name}`;
  }, []);

  // Helper: cache and set
  const setSelectedInfo = useCallback((id: string, displayName: string) => {
    displayNameCacheRef.current.set(id, displayName);
    setSelectedVariantInfo({ id, displayName });
  }, []);

  const loadSpecificVariantInfo = useCallback(
    async (variantId: string) => {
      if (fetchedIdsRef.current.has(variantId)) return;
      fetchedIdsRef.current.add(variantId);

      setIsLoadingVariant(true);
      try {
        const variantInfo = await getStockVariantById(variantId);
        if (variantInfo && variantInfo.variant) {
          const displayName = `${variantInfo.stockName || ""} - ${variantInfo.variant.name}`;
          setSelectedInfo(variantInfo.variant.id, displayName);
        }
      } catch (error) {
        fetchedIdsRef.current.delete(variantId);
        console.error("Error loading specific variant info:", error);
      } finally {
        setIsLoadingVariant(false);
      }
    },
    [setSelectedInfo],
  );

  // Hydrate from initialVariantInfo when it arrives.
  // Only update if it actually adds information (don't overwrite with null).
  useEffect(() => {
    if (!value) return;
    if (!initialVariantInfo?.variant?.name) return;
    if (selectedVariantInfo?.id === value) return;

    const displayName = `${initialVariantInfo.stockName} - ${initialVariantInfo.variant.name}`;
    setSelectedInfo(value, displayName);
    fetchedIdsRef.current.add(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initialVariantInfo]);

  // Main resolver: when `value` changes, figure out the display.
  // CRITICAL: never set selectedVariantInfo to null here unless `value` is empty.
  useEffect(() => {
    if (!value) {
      setSelectedVariantInfo(null);
      return;
    }

    // Already showing this value — done.
    if (selectedVariantInfo?.id === value) return;

    // Check our local cache first — this is the key fix.
    // If we've previously resolved this id (e.g. user just selected it),
    // restore it instantly without any network call or dependency on parent state.
    const cachedName = displayNameCacheRef.current.get(value);
    if (cachedName) {
      setSelectedVariantInfo({ id: value, displayName: cachedName });
      return;
    }

    // Check stocks list (already loaded options)
    for (const stock of stocks) {
      const variant = stock.stockVariants.find((v) => v.id === value);
      if (variant) {
        const displayName = getDisplayName(stock, variant);
        setSelectedInfo(variant.id, displayName);
        return;
      }
    }

    // Check parent-supplied info
    if (initialVariantInfo?.variant?.name) {
      const displayName = `${initialVariantInfo.stockName} - ${initialVariantInfo.variant.name}`;
      setSelectedInfo(value, displayName);
      return;
    }

    // Last resort: fetch
    loadSpecificVariantInfo(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // When stocks load and contain our value, hydrate (cheap, no network).
  useEffect(() => {
    if (!value || selectedVariantInfo?.id === value) return;
    for (const stock of stocks) {
      const variant = stock.stockVariants.find((v) => v.id === value);
      if (variant) {
        const displayName = getDisplayName(stock, variant);
        setSelectedInfo(variant.id, displayName);
        return;
      }
    }
  }, [stocks, value, selectedVariantInfo?.id, getDisplayName, setSelectedInfo]);

  useEffect(() => {
    if (open && stocks.length === 0) {
      loadStocks("", 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    const timeout = setTimeout(() => {
      setPage(1);
      loadStocks(searchTerm, 1);
    }, 300);
    debounceTimeoutRef.current = timeout;
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, open]);

  const loadStocks = useCallback(
    async (query: string, currentPage: number, showLoading = true) => {
      try {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        if (showLoading) setIsLoading(true);

        const response: ApiResponse<Stock> = await searchStock(
          query,
          currentPage,
          ITEMS_PER_PAGE,
        );

        if (currentPage === 1) {
          setStocks(response.content);
        } else {
          setStocks((prev) => [...prev, ...response.content]);
        }
        setHasMore(!response.last);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error fetching stocks:", error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

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
    [stocks, disabledValues, getDisplayName],
  );

  const selectedOption = useMemo(() => {
    if (!value) return null;
    if (selectedVariantInfo && selectedVariantInfo.id === value) {
      return selectedVariantInfo;
    }
    // Fall back to the in-memory cache before anything else
    const cachedName = displayNameCacheRef.current.get(value);
    if (cachedName) return { id: value, displayName: cachedName };
    const option = allVariantOptions.find((o) => o.id === value);
    if (option) return option;
    return null;
  }, [allVariantOptions, value, selectedVariantInfo]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (
        scrollHeight - scrollTop - clientHeight < 50 &&
        !isLoading &&
        hasMore
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadStocks(searchTerm, nextPage, false);
      }
    },
    [isLoading, hasMore, page, searchTerm, loadStocks],
  );

  const handleSelect = useCallback(
    (option: { id: string; displayName: string }) => {
      const newValue = option.id === value ? "" : option.id;

      // Cache the displayName BEFORE calling onChange — that way, even if the
      // parent triggers a re-render with stale initialVariantInfo, our cache
      // already has the truth.
      if (newValue) {
        displayNameCacheRef.current.set(newValue, option.displayName);
        setSelectedVariantInfo({
          id: newValue,
          displayName: option.displayName,
        });
        fetchedIdsRef.current.add(newValue);
      } else {
        setSelectedVariantInfo(null);
      }

      onChange(newValue);
      setOpen(false);
    },
    [value, onChange],
  );

  const displayText = useMemo(() => {
    if (selectedOption) return selectedOption.displayName;
    if (isLoadingVariant && value) return "Loading...";
    return placeholder;
  }, [isLoadingVariant, selectedOption, placeholder, value]);

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
            <span className="flex items-center gap-2 min-w-0 flex-1">
              {isLoadingVariant && !selectedOption && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              )}
              <span className="truncate text-left">{displayText}</span>
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

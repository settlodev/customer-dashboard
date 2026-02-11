// "use client";

// import React, {
//   useEffect,
//   useState,
//   useMemo,
//   useCallback,
//   useRef,
// } from "react";
// import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { searchStock, getStockVariantById } from "@/lib/actions/stock-actions";
// import { Stock } from "@/types/stock/type";
// import { StockVariant } from "@/types/stockVariant/type";
// import { ApiResponse } from "@/types/types";

// interface Props {
//   placeholder?: string;
//   isRequired?: boolean;
//   value?: string;
//   isDisabled?: boolean;
//   description?: string;
//   onChange: (value: string) => void;
//   disabledValues?: string[];
// }

// const StockVariantSelector: React.FC<Props> = ({
//   placeholder = "Select stock item",
//   value,
//   isDisabled,
//   description,
//   onChange,
//   disabledValues = [],
// }) => {
//   const [open, setOpen] = useState(false);
//   const [stocks, setStocks] = useState<Stock[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [isLoadingVariant, setIsLoadingVariant] = useState<boolean>(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [selectedVariantInfo, setSelectedVariantInfo] = useState<{
//     id: string;
//     displayName: string;
//   } | null>(null);

//   const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const abortControllerRef = useRef<AbortController | null>(null);

//   const ITEMS_PER_PAGE = 20;

//   const getDisplayName = useCallback((stock: Stock, variant: StockVariant) => {
//     return `${stock.name} - ${variant.name}`;
//   }, []);

//   const loadSpecificVariantInfo = useCallback(async (variantId: string) => {
//     setIsLoadingVariant(true);
//     try {
//       const variantInfo = await getStockVariantById(variantId);

//       if (variantInfo && variantInfo.variant) {
//         const displayName = `${variantInfo.stockName || ""} - ${variantInfo.variant.name}`;
//         setSelectedVariantInfo({
//           id: variantInfo.variant.id,
//           displayName: displayName,
//         });
//       }
//     } catch (error) {
//       console.error("Error loading specific variant info:", error);
//     } finally {
//       setIsLoadingVariant(false);
//     }
//   }, []);

//   // Load the selected variant info when value changes
//   useEffect(() => {
//     if (value) {
//       // Check if we already have this variant loaded
//       const variantExists = stocks.some((stock) =>
//         stock.stockVariants.some((variant) => variant.id === value),
//       );

//       // Load if not already in the stocks list and not already loaded
//       if (
//         !variantExists &&
//         (!selectedVariantInfo || selectedVariantInfo.id !== value)
//       ) {
//         loadSpecificVariantInfo(value);
//       }
//     } else {
//       // Clear selection when value is empty
//       setSelectedVariantInfo(null);
//     }
//   }, [value, stocks, selectedVariantInfo, loadSpecificVariantInfo]);

//   // Load stocks when popover opens (only once)
//   useEffect(() => {
//     if (open && stocks.length === 0) {
//       loadStocks("", 1);
//     }
//   }, [open]);

//   // Handle search with debounce and abort previous requests
//   useEffect(() => {
//     if (!open) return;

//     // Clear previous timeout
//     if (debounceTimeoutRef.current) {
//       clearTimeout(debounceTimeoutRef.current);
//     }

//     // Debounce search
//     const timeout = setTimeout(() => {
//       setPage(1);
//       loadStocks(searchTerm, 1);
//     }, 300);

//     debounceTimeoutRef.current = timeout;

//     return () => {
//       if (debounceTimeoutRef.current) {
//         clearTimeout(debounceTimeoutRef.current);
//       }
//     };
//   }, [searchTerm, open]);

//   const loadStocks = useCallback(
//     async (query: string, currentPage: number, showLoading = true) => {
//       try {
//         // Cancel previous request
//         if (abortControllerRef.current) {
//           abortControllerRef.current.abort();
//         }

//         // Create new abort controller
//         abortControllerRef.current = new AbortController();

//         if (showLoading) {
//           setIsLoading(true);
//         }

//         const response: ApiResponse<Stock> = await searchStock(
//           query,
//           currentPage,
//           ITEMS_PER_PAGE,
//         );

//         if (currentPage === 1) {
//           setStocks(response.content);
//         } else {
//           setStocks((prevStocks) => [...prevStocks, ...response.content]);
//         }

//         setHasMore(!response.last);
//       } catch (error: any) {
//         // Don't log aborted requests
//         if (error.name !== "AbortError") {
//           console.log("Error fetching stocks:", error);
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [],
//   );

//   // Memoize option processing - only recalculate when stocks or disabledValues change
//   const allVariantOptions = useMemo(
//     () =>
//       stocks.flatMap((stock) =>
//         stock.stockVariants.map((variant) => ({
//           id: variant.id,
//           displayName: getDisplayName(stock, variant),
//           disabled: disabledValues.includes(variant.id),
//           searchString: `${stock.name.toLowerCase()} ${variant.name.toLowerCase()}`,
//         })),
//       ),
//     [stocks, disabledValues, getDisplayName],
//   );

//   const selectedOption = useMemo(() => {
//     if (!value) return null;

//     // First try to find in loaded stocks
//     const option = allVariantOptions.find((option) => option.id === value);
//     if (option) return option;

//     // Fallback to cached variant info
//     if (selectedVariantInfo && selectedVariantInfo.id === value) {
//       return selectedVariantInfo;
//     }

//     return null;
//   }, [allVariantOptions, value, selectedVariantInfo]);

//   // Optimized scroll handler with throttling
//   const handleScroll = useCallback(
//     (e: React.UIEvent<HTMLDivElement>) => {
//       const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
//       const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

//       if (isNearBottom && !isLoading && hasMore) {
//         const nextPage = page + 1;
//         setPage(nextPage);
//         loadStocks(searchTerm, nextPage, false);
//       }
//     },
//     [isLoading, hasMore, page, searchTerm, loadStocks],
//   );

//   const handleSelect = useCallback(
//     (option: { id: string; displayName: string }) => {
//       const newValue = option.id === value ? "" : option.id;
//       onChange(newValue);

//       if (newValue) {
//         setSelectedVariantInfo({
//           id: option.id,
//           displayName: option.displayName,
//         });
//       } else {
//         setSelectedVariantInfo(null);
//       }
//       setOpen(false);
//     },
//     [value, onChange],
//   );

//   // Display text logic
//   const displayText = useMemo(() => {
//     if (isLoadingVariant) {
//       return "Loading...";
//     }
//     if (selectedOption) {
//       return selectedOption.displayName;
//     }
//     return placeholder;
//   }, [isLoadingVariant, selectedOption, placeholder]);

//   return (
//     <div className="space-y-2">
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="outline"
//             role="combobox"
//             aria-expanded={open}
//             className="w-full justify-between"
//             disabled={isDisabled}
//           >
//             <span className="flex items-center gap-2">
//               {isLoadingVariant && <Loader2 className="h-4 w-4 animate-spin" />}
//               {displayText}
//             </span>
//             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-[400px] p-0">
//           <Command shouldFilter={false}>
//             <CommandInput
//               placeholder={`Search ${placeholder.toLowerCase()}...`}
//               value={searchTerm}
//               onValueChange={setSearchTerm}
//             />
//             <CommandList onScroll={handleScroll} className="max-h-[300px]">
//               <CommandEmpty>
//                 {isLoading ? "Searching..." : "No stock items found."}
//               </CommandEmpty>
//               <CommandGroup>
//                 {allVariantOptions.length === 0 && isLoading ? (
//                   <div className="py-6 text-center">
//                     <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
//                     <p className="mt-2 text-sm text-muted-foreground">
//                       Loading stock items...
//                     </p>
//                   </div>
//                 ) : (
//                   allVariantOptions.map((option) => (
//                     <CommandItem
//                       key={option.id}
//                       value={option.searchString}
//                       disabled={option.disabled}
//                       onSelect={() => handleSelect(option)}
//                     >
//                       <Check
//                         className={cn(
//                           "mr-2 h-4 w-4",
//                           value === option.id ? "opacity-100" : "opacity-0",
//                         )}
//                       />
//                       {option.displayName}
//                     </CommandItem>
//                   ))
//                 )}
//                 {isLoading && allVariantOptions.length > 0 && (
//                   <div className="py-2 text-center">
//                     <Loader2 className="mx-auto h-4 w-4 animate-spin opacity-50" />
//                     <p className="text-sm text-muted-foreground">
//                       Loading more...
//                     </p>
//                   </div>
//                 )}
//                 {!isLoading && hasMore && allVariantOptions.length > 0 && (
//                   <div className="py-2 text-center text-sm text-muted-foreground">
//                     Scroll down to load more
//                   </div>
//                 )}
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//       {description && <p className="text-sm text-gray-500">{description}</p>}
//     </div>
//   );
// };

// export default StockVariantSelector;

import { Recipe } from "@/types/recipe/type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEffect, useState } from "react";
import { fetchRecipes } from "@/lib/actions/recipe-actions";

interface RecipeProps {
  label?: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

function RecipeSelector({
  placeholder,
  value,
  isDisabled,
  onChange,
}: RecipeProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  console.log("📋 [RECIPE_SELECTOR] Component rendered with:", {
    value,
    isDisabled,
    recipesCount: recipes.length,
    isLoading,
  });

  useEffect(() => {
    console.log("📋 [RECIPE_SELECTOR] Mount - fetching recipes");

    async function loadRecipes() {
      try {
        setIsLoading(true);
        const fetchedRecipes = await fetchRecipes();
        console.log("📋 [RECIPE_SELECTOR] Recipes fetched:", {
          count: fetchedRecipes.length,
          recipes: fetchedRecipes.map((r) => ({ id: r.id, name: r.name })),
        });
        setRecipes(fetchedRecipes);
      } catch (error: any) {
        console.error("❌ [RECIPE_SELECTOR] Error fetching recipes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  return (
    <div className="space-y-2">
      <Select
        defaultValue={value}
        disabled={isDisabled || isLoading}
        value={value}
        onValueChange={(newValue) => {
          console.log("📋 [RECIPE_SELECTOR] Value changed:", {
            from: value,
            to: newValue,
          });
          onChange(newValue);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder || "Select recipe"} />
        </SelectTrigger>
        <SelectContent>
          {recipes.map((recipe) => (
            <SelectItem key={recipe.id} value={recipe.id}>
              {recipe.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default RecipeSelector;


"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
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
import { getCachedProducts } from "@/lib/cache/reference-data";
import type { Product, ProductVariant } from "@/types/product/type";

/**
 * What a picked catalogue item carries back to the form. `productId` is what
 * the Accounting Service stores on the line (its revenue-account mapping is
 * keyed on the product, not the variant); `stockVariantId` rides along so
 * DIRECT-linked items still raise the inventory reservation on send/accept.
 */
export interface ProductItemMeta {
  productId: string;
  variantId: string;
  displayName: string;
  /** Variant selling price in `currency`. */
  price: number;
  currency: string;
  /** Set only for DIRECT stock-linked variants — null for unlimited/recipe. */
  stockVariantId: string | null;
  /** Variant's tax rate as a percentage (e.g. 18), when a tax type is set. */
  taxRatePercent: number | null;
  /** Whether the variant's price already includes tax (product-level flag). */
  taxInclusive: boolean;
}

interface Props {
  placeholder?: string;
  /** The product variant persisted on the line. */
  value?: string | null;
  isDisabled?: boolean;
  description?: string;
  onChange: (meta: ProductItemMeta | null) => void;
  /** Mirrors StockVariantSelector — lets parent forms gate submit on load. */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Collapses the awkward product/variant name combinations the same way the
 * products list does — "Coca-Cola" rather than "Coca-Cola - Default", and no
 * "Coca-Cola Coca-Cola 300ml".
 */
function variantDisplayName(
  productName: string,
  variantName: string,
  isOnlyVariant: boolean,
): string {
  const p = (productName ?? "").trim();
  const v = (variantName ?? "").trim();
  if (!v) return p;
  if (v.toLowerCase() === p.toLowerCase()) return p;
  if (isOnlyVariant && v.toLowerCase() === "default") return p;
  if (v.toLowerCase().includes(p.toLowerCase())) return v;
  return `${p} ${v}`;
}

interface Option extends ProductItemMeta {
  searchString: string;
}

function toOption(
  product: Product,
  variant: ProductVariant,
  isOnlyVariant: boolean,
): Option {
  return {
    productId: product.id,
    variantId: variant.id,
    displayName: variantDisplayName(product.name, variant.name, isOnlyVariant),
    price: Number(variant.price ?? 0),
    currency: variant.nativeCurrency || product.nativeCurrency || "",
    stockVariantId: variant.stockVariantId ?? null,
    taxRatePercent:
      variant.taxRatePercent != null ? Number(variant.taxRatePercent) : null,
    taxInclusive: !!product.taxInclusive,
    searchString: `${product.name} ${variant.name} ${variant.sku ?? ""}`.toLowerCase(),
  };
}

const ProductItemSelector: React.FC<Props> = ({
  placeholder = "Select a product",
  value,
  isDisabled,
  description,
  onChange,
  onLoadingChange,
}) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  // Start loading when the line already references a product so the trigger
  // shows a spinner instead of flashing the placeholder before the catalogue
  // arrives and resolves the name.
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
    getCachedProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [open, value]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const allOptions = useMemo(
    () =>
      products
        .filter((p) => p.active && !p.archivedAt)
        .flatMap((product) => {
          const variants = (product.variants ?? []).filter(
            (v) => v.active && !v.archivedAt,
          );
          return variants.map((variant) =>
            toOption(product, variant, variants.length === 1),
          );
        }),
    [products],
  );

  const displayedOptions = useMemo(() => {
    if (!searchTerm) return allOptions;
    const term = searchTerm.toLowerCase();
    return allOptions.filter((o) => o.searchString.includes(term));
  }, [allOptions, searchTerm]);

  const selectedOption = useMemo(
    () => (value ? allOptions.find((o) => o.variantId === value) ?? null : null),
    [allOptions, value],
  );

  const handleSelect = useCallback(
    (option: Option) => {
      const deselecting = option.variantId === value;
      onChange(
        deselecting
          ? null
          : {
              productId: option.productId,
              variantId: option.variantId,
              displayName: option.displayName,
              price: option.price,
              currency: option.currency,
              stockVariantId: option.stockVariantId,
              taxRatePercent: option.taxRatePercent,
              taxInclusive: option.taxInclusive,
            },
      );
      setOpen(false);
    },
    [value, onChange],
  );

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
            className={cn(controlComboboxTriggerClass, "overflow-hidden")}
            disabled={isDisabled}
          >
            <span className="truncate text-left flex-1 flex items-center gap-2">
              {isResolvingValue ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                  <span className="text-muted-2">Loading...</span>
                </>
              ) : selectedOption ? (
                <span className="truncate">{selectedOption.displayName}</span>
              ) : (
                <span className="text-muted-2">{placeholder}</span>
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search products..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                {isLoading ? "Loading..." : "No products found."}
              </CommandEmpty>
              <CommandGroup>
                {isLoading && displayedOptions.length === 0 ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Loading products...
                    </p>
                  </div>
                ) : (
                  displayedOptions.map((option) => (
                    <CommandItem
                      key={option.variantId}
                      value={option.variantId}
                      onSelect={() => handleSelect(option)}
                      className="items-start gap-2"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          value === option.variantId ? "opacity-100" : "opacity-0",
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

export default ProductItemSelector;


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
import { Product } from "@/types/product/type";
import { fectchAllProducts } from "@/lib/actions/product-actions";
import { Variant } from "@/types/variant/type";

interface Props {
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  disabledValues?: string[];
}

const ProductVariantSelector: React.FC<Props> = ({
  placeholder = "Select stock item",
//   isRequired,
  value,
  isDisabled,
  description,
  onChange,
  disabledValues = [],
}) => {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getDisplayName = (product: Product, variant: Variant) => {
    return `${product.name} - ${variant.name}`;
  };

  useEffect(() => {
    async function loadProducts() {
        try {
            setIsLoading(true);
            const fetchedProducts = await fectchAllProducts();
            setProducts(fetchedProducts);
        } catch (error: any) {
            console.log("Error fetching products:", error);
        } finally {
            setIsLoading(false);
        }
    }
    loadProducts();
}, []);

  const variantOptions = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      displayName: getDisplayName(product, variant),
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
              ? "Loading product items..." 
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
              <CommandEmpty>No product item found.</CommandEmpty>
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

export default ProductVariantSelector;

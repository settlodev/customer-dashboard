"use client";

import { useEffect, useRef, useState } from "react";
import { itemDisplayName } from "@/lib/display-name";
import { Check, ChevronDown, Loader2 } from "lucide-react";

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
import { controlComboboxTriggerClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { getProduct, searchProducts } from "@/lib/actions/product-actions";
import { getCategory, searchCategories } from "@/lib/actions/category-actions";
import type { DiscountTargetEntityType } from "@/types/discount/enums";

export interface PickerOption {
  id: string;
  label: string;
  sublabel?: string;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

async function searchByEntityType(
  entityType: DiscountTargetEntityType,
  q: string,
): Promise<PickerOption[]> {
  if (entityType === "CATEGORY") {
    const res = await searchCategories(q, 1, PAGE_SIZE);
    return (res?.content ?? []).map((c) => ({
      id: c.id,
      label: c.name,
      sublabel: c.parentName ?? undefined,
    }));
  }
  const res = await searchProducts(q, 1, PAGE_SIZE);
  if (entityType === "PRODUCT_VARIANT") {
    return (res?.content ?? []).flatMap((p) =>
      (p.variants ?? []).map((v) => ({
        id: v.id,
        label: itemDisplayName({
          parentName: p.name,
          variantName: v.name,
          displayName: v.displayName,
          collapseDefault: (p.variants ?? []).length === 1,
        }),
        sublabel: v.sku ?? undefined,
      })),
    );
  }
  return (res?.content ?? []).map((p) => ({ id: p.id, label: p.name }));
}

/**
 * Resolves a trigger label when only an id is known (edit mode). There's no
 * dedicated by-id lookup for a single product variant — only whole products
 * — so a variant id resolves to null and the trigger falls back to showing
 * the raw id until the user searches and re-picks it.
 */
async function resolveByEntityType(
  entityType: DiscountTargetEntityType,
  id: string,
): Promise<PickerOption | null> {
  try {
    if (entityType === "CATEGORY") {
      const c = await getCategory(id);
      return c ? { id: c.id, label: c.name, sublabel: c.parentName ?? undefined } : null;
    }
    if (entityType === "PRODUCT") {
      const p = await getProduct(id);
      return p ? { id: p.id, label: p.name } : null;
    }
    return null;
  } catch {
    return null;
  }
}

const ENTITY_SEARCH_PLACEHOLDER: Record<DiscountTargetEntityType, string> = {
  PRODUCT: "Search products…",
  PRODUCT_VARIANT: "Search products or variants…",
  CATEGORY: "Search categories…",
};

const ENTITY_EMPTY_LABEL: Record<DiscountTargetEntityType, string> = {
  PRODUCT: "No product found.",
  PRODUCT_VARIANT: "No variant found.",
  CATEGORY: "No category found.",
};

interface DiscountEntityPickerProps {
  entityType: DiscountTargetEntityType;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}

/**
 * Debounced server-search combobox for a discount target's entity id.
 * Backing entity (product / product variant / category) switches on the
 * `entityType` prop, following the same shape as `customer-selector.tsx`.
 */
function DiscountEntityPicker({
  entityType,
  value,
  onChange,
  onBlur,
  isDisabled,
  placeholder = "Select…",
}: DiscountEntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PickerOption | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const lastQueryRef = useRef("");

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    let cancelled = false;
    resolveByEntityType(entityType, value).then((option) => {
      if (!cancelled && option) setSelected(option);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, entityType]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = setTimeout(() => {
      lastQueryRef.current = trimmed;
      searchByEntityType(entityType, trimmed)
        .then((options) => {
          if (cancelled || lastQueryRef.current !== trimmed) return;
          setResults(options);
          setHasSearched(true);
          setSearching(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setHasSearched(true);
          setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open, entityType]);

  const triggerLabel = selected
    ? selected.label
    : value
      ? `ID: ${value}`
      : placeholder;

  const handleSelect = (option: PickerOption) => {
    setSelected(option);
    onChange(option.id);
    setOpen(false);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setResults([]);
          setHasSearched(false);
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled}
          className={controlComboboxTriggerClass}
        >
          <span className={cn("truncate", !selected && !value && "text-muted-2")}>
            {triggerLabel}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={ENTITY_SEARCH_PLACEHOLDER[entityType]}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {searching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : !query.trim() ? (
              <CommandEmpty>Type to search…</CommandEmpty>
            ) : hasSearched && results.length === 0 ? (
              <CommandEmpty>{ENTITY_EMPTY_LABEL[entityType]}</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.id}
                    onSelect={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default DiscountEntityPicker;

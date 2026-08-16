"use client";

import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { Check, ChevronDown, Loader2, XIcon } from "lucide-react";

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
import {
  getCustomer,
  getCustomerGroup,
  searchCustomer,
  searchCustomerGroups,
} from "@/lib/actions/customer-actions";
import type { PickerOption } from "./discount-entity-picker";

export type DiscountScope =
  | "PRODUCT_SCOPE"
  | "CATEGORY_SCOPE"
  | "CUSTOMER_SCOPE"
  | "CUSTOMER_GROUP_SCOPE";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

type UuidLike = `${string}-${string}-${string}-${string}-${string}`;

function customerLabel(customer: { firstName: string; lastName: string }): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

async function searchByScope(scope: DiscountScope, q: string): Promise<PickerOption[]> {
  switch (scope) {
    case "PRODUCT_SCOPE": {
      const res = await searchProducts(q, 1, PAGE_SIZE);
      return (res?.content ?? []).map((p) => ({ id: p.id, label: p.name }));
    }
    case "CATEGORY_SCOPE": {
      const res = await searchCategories(q, 1, PAGE_SIZE);
      return (res?.content ?? []).map((c) => ({
        id: c.id,
        label: c.name,
        sublabel: c.parentName ?? undefined,
      }));
    }
    case "CUSTOMER_SCOPE": {
      const res = await searchCustomer(q, 1, PAGE_SIZE, true);
      return (res?.content ?? []).map((c) => ({
        id: c.id,
        label: customerLabel(c),
        sublabel: c.phoneNumber ?? undefined,
      }));
    }
    case "CUSTOMER_GROUP_SCOPE": {
      const res = await searchCustomerGroups(q, 1, PAGE_SIZE);
      return (res?.content ?? []).map((g) => ({ id: g.id, label: g.name }));
    }
  }
}

async function resolveByScope(scope: DiscountScope, id: string): Promise<PickerOption | null> {
  try {
    switch (scope) {
      case "PRODUCT_SCOPE": {
        const p = await getProduct(id);
        return p ? { id: p.id, label: p.name } : null;
      }
      case "CATEGORY_SCOPE": {
        const c = await getCategory(id);
        return c ? { id: c.id, label: c.name } : null;
      }
      case "CUSTOMER_SCOPE": {
        const c = await getCustomer(id as UuidLike);
        return c ? { id: c.id, label: customerLabel(c) } : null;
      }
      case "CUSTOMER_GROUP_SCOPE": {
        const g = await getCustomerGroup(id as UuidLike);
        return g ? { id: g.id, label: g.name } : null;
      }
    }
  } catch {
    return null;
  }
}

const SCOPE_SEARCH_PLACEHOLDER: Record<DiscountScope, string> = {
  PRODUCT_SCOPE: "Search products…",
  CATEGORY_SCOPE: "Search categories…",
  CUSTOMER_SCOPE: "Search customers…",
  CUSTOMER_GROUP_SCOPE: "Search customer groups…",
};

interface DiscountScopePickerProps {
  scope: DiscountScope;
  value: string[];
  onChange: (value: string[]) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

/**
 * Debounced server-search multi-select for a discount condition's
 * `valueIds`. Backing entity (product / category / customer / customer
 * group) switches on the `scope` prop. Chips resolve their label from
 * search results as picked, or via a by-id lookup for ids that arrive
 * already selected (edit mode) — mirrors `discount-entity-picker.tsx`'s
 * resolve-on-mount behavior, extended to a whole array.
 */
function DiscountScopePicker({
  scope,
  value,
  onChange,
  isDisabled,
  placeholder = "Select…",
}: DiscountScopePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const lastQueryRef = useRef("");

  useEffect(() => {
    const unresolved = value.filter((id) => !(id in labels));
    if (unresolved.length === 0) return;
    let cancelled = false;
    Promise.all(unresolved.map((id) => resolveByScope(scope, id))).then((options) => {
      if (cancelled) return;
      setLabels((prev) => {
        const next = { ...prev };
        options.forEach((option, i) => {
          if (option) next[unresolved[i]] = option.label;
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, scope]);

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
      searchByScope(scope, trimmed)
        .then((options) => {
          if (cancelled || lastQueryRef.current !== trimmed) return;
          setResults(options);
          setHasSearched(true);
          setSearching(false);
          setLabels((prev) => {
            const next = { ...prev };
            options.forEach((o) => {
              next[o.id] = o.label;
            });
            return next;
          });
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
  }, [query, open, scope]);

  const toggle = (id: string) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id];
    onChange(next);
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  const stopTrigger = (event: SyntheticEvent) => event.stopPropagation();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setResults([]);
          setHasSearched(false);
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
          className={cn(controlComboboxTriggerClass, "h-auto min-h-11 py-2")}
        >
          {value.length > 0 ? (
            <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
              {value.map((id) => (
                <span
                  key={id}
                  className="inline-flex max-w-full items-center gap-1 rounded-[7px] border border-line-2 bg-canvas py-0.5 pl-2 pr-1 text-[12px] font-medium text-ink"
                >
                  <span className="truncate">{labels[id] ?? `ID: ${id}`}</span>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Remove"
                    className="grid h-4 w-4 shrink-0 place-items-center rounded-[4px] text-muted-2 transition-colors hover:bg-line hover:text-ink"
                    onPointerDown={stopTrigger}
                    onClick={(event) => {
                      stopTrigger(event);
                      remove(id);
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="flex-1 text-left text-muted-2">{placeholder}</span>
          )}
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
            placeholder={SCOPE_SEARCH_PLACEHOLDER[scope]}
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
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((option) => {
                  const isSelected = value.includes(option.id);
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => toggle(option.id)}
                    >
                      <Check
                        className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
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
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default DiscountScopePicker;

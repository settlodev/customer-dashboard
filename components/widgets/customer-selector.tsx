"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { Customer } from "@/types/customer/type";
import {
  getCustomer,
  searchCustomer,
} from "@/lib/actions/customer-actions";

interface CustomerProps {
  label?: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  /**
   * Fires with the full customer record when the user picks one (not on
   * mount-hydration). Lets a form prefill name/phone/email/TIN. Optional —
   * existing callers that only need the id are unaffected.
   */
  onSelectCustomer?: (customer: Customer) => void;
  onBlur?: () => void;
}

function customerLabel(customer: Customer): string {
  return [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/**
 * Typeahead-driven customer picker. Used to load the whole customer list
 * upfront, which broke on B2C catalogues into the tens of thousands. Now:
 *
 *  - On mount, if `value` is set, resolves the customer by id so the
 *    trigger renders the right name without holding the full list.
 *  - When the popover opens, the input is empty and we render "Type to
 *    search…" — no fetch until the user starts typing.
 *  - On query change (debounced 300 ms), hits `searchCustomer` server-side
 *    paginated. The first 20 matches show; if the user wants more they
 *    refine the query.
 *
 * The cmdk filter is disabled (`shouldFilter={false}`) because we are now
 * the search backend — cmdk filtering on top of server-paged results would
 * hide rows that don't happen to match cmdk's heuristic.
 */
function CustomerSelector({
  placeholder,
  value,
  isDisabled,
  onChange,
  onSelectCustomer,
}: CustomerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const lastQueryRef = useRef<string>("");

  // Hydrate the trigger's display name when value is set on mount or
  // changes externally (e.g. parent loaded a customer from an order).
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    let cancelled = false;
    // getCustomer's server-side typing expects the node:crypto branded
    // UUID; the value coming from a form field is just `string`. Cast to
    // the same literal shape so TS is happy without dragging the
    // server-only import into a client component.
    getCustomer(value as `${string}-${string}-${string}-${string}-${string}`)
      .then((c) => {
        if (!cancelled && c) setSelected(c);
      })
      .catch(() => {
        /* leave selected null; trigger falls back to placeholder */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Debounced server-side search. Empty query clears results — we don't
  // prefetch the first page because that's the bloated behaviour we just
  // moved away from.
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
      searchCustomer(trimmed, 1, PAGE_SIZE, true)
        .then((res) => {
          if (cancelled || lastQueryRef.current !== trimmed) return;
          setResults(res?.content ?? []);
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
  }, [query, open]);

  const triggerLabel = selected
    ? customerLabel(selected) || placeholder || "Select customer"
    : placeholder || "Select customer";

  const handleSelect = (customer: Customer) => {
    setSelected(customer);
    onChange(customer.id);
    onSelectCustomer?.(customer);
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
          className={cn(
            "w-full justify-between h-10 font-normal",
            !selected && "text-muted-foreground",
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or phone…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!query.trim() ? (
              <CommandEmpty>Type to search customers…</CommandEmpty>
            ) : searching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : hasSearched && results.length === 0 ? (
              <CommandEmpty>No customer found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((customer) => {
                  const name = customerLabel(customer);
                  return (
                    <CommandItem
                      key={customer.id}
                      value={customer.id}
                      onSelect={() => handleSelect(customer)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === customer.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{name || "Unnamed"}</span>
                        {customer.phoneNumber ? (
                          <span className="truncate text-[11px] text-muted-foreground">
                            {customer.phoneNumber}
                          </span>
                        ) : null}
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

export default CustomerSelector;

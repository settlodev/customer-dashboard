"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Business-scoped supplier picker. Used across LPO, GRN, reorder config,
 * requisition, RFQ, and stock forms — keep the prop signature stable.
 *
 * Implemented as a Popover + Command combobox (mirroring the stock variant
 * picker) so the trigger renders the selected supplier name reliably even
 * when the value is set before the supplier list loads — e.g. the GRN form
 * pre-linked to an LPO. The Radix {@link Select} we used previously had a
 * known footgun where {@link SelectValue} snapshots "no match" if items
 * aren't yet rendered when the value is set.
 *
 * Archived suppliers are still returned by the API but grouped into their
 * own block so operators don't accidentally assign new work to a dormant
 * supplier.
 */
function SupplierSelector({
  placeholder,
  value,
  isDisabled,
  description,
  onChange,
  onBlur,
}: Props) {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = useState(0);

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
    let cancelled = false;
    setIsLoading(true);
    fetchAllSuppliers()
      .then((list) => {
        if (!cancelled) setSuppliers(list);
      })
      .catch(() => {
        if (!cancelled) setSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { active, archived } = useMemo(() => {
    const sorted = [...suppliers].sort((a, b) => a.name.localeCompare(b.name));
    return {
      active: sorted.filter((s) => !s.archivedAt),
      archived: sorted.filter((s) => !!s.archivedAt),
    };
  }, [suppliers]);

  const filterFor = useCallback(
    (list: Supplier[]) => {
      if (!searchTerm) return list;
      const term = searchTerm.toLowerCase();
      return list.filter((s) => s.name.toLowerCase().includes(term));
    },
    [searchTerm],
  );

  const filteredActive = useMemo(
    () => filterFor(active),
    [active, filterFor],
  );
  const filteredArchived = useMemo(
    () => filterFor(archived),
    [archived, filterFor],
  );

  const selected = useMemo(
    () => (value ? suppliers.find((s) => s.id === value) ?? null : null),
    [suppliers, value],
  );

  const handleSelect = useCallback(
    (supplierId: string) => {
      const deselecting = supplierId === value;
      onChange(deselecting ? "" : supplierId);
      onBlur();
      setOpen(false);
      setSearchTerm("");
    },
    [value, onChange, onBlur],
  );

  const popoverWidth = Math.max(triggerWidth, 280);

  return (
    <div className="space-y-2 w-full">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (isDisabled) return;
          setOpen(next);
          if (!next) setSearchTerm("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={isDisabled}
            className="w-full justify-between overflow-hidden font-normal"
          >
            <span className="truncate text-left flex-1 flex items-center gap-2">
              {isLoading && !selected ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                  <span className="text-muted-foreground">
                    Loading suppliers
                  </span>
                </>
              ) : selected ? (
                <>
                  {selected.name}
                  {selected.linkedToSettloSupplier && (
                    <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder || "Select supplier"}
                </span>
              )}
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
              placeholder="Search suppliers..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-[300px]">
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading suppliers...
                  </p>
                </div>
              ) : suppliers.length === 0 ? (
                <CommandEmpty>
                  No suppliers yet. Add one from the Suppliers page.
                </CommandEmpty>
              ) : filteredActive.length === 0 && filteredArchived.length === 0 ? (
                <CommandEmpty>No suppliers match.</CommandEmpty>
              ) : (
                <>
                  {filteredActive.length > 0 && (
                    <CommandGroup heading="Active">
                      {filteredActive.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => handleSelect(s.id)}
                          className="items-start gap-2"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              value === s.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="break-words flex items-center gap-2">
                            {s.name}
                            {s.linkedToSettloSupplier && (
                              <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                            )}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {filteredActive.length > 0 && filteredArchived.length > 0 && (
                    <CommandSeparator />
                  )}
                  {filteredArchived.length > 0 && (
                    <CommandGroup heading="Archived">
                      {filteredArchived.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.name}
                          onSelect={() => handleSelect(s.id)}
                          className="items-start gap-2 opacity-70"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4 shrink-0",
                              value === s.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="break-words">{s.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}

export default SupplierSelector;

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { fetchAllVendors } from "@/lib/actions/vendor-actions";
import type { Vendor } from "@/types/vendor/type";

interface Props {
  value?: string | null;
  placeholder?: string;
  onChange: (value: string, vendor: Vendor | null) => void;
  isDisabled?: boolean;
  /** Allow clearing the selection — useful when the field is optional. */
  clearable?: boolean;
}

export function VendorSelector({
  value,
  placeholder,
  onChange,
  isDisabled,
  clearable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (open && vendors.length === 0) {
      setLoading(true);
      fetchAllVendors()
        .then((all) => {
          if (cancelled) return;
          setVendors(all.filter((v) => v.active));
        })
        .catch(() => !cancelled && setVendors([]))
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
  }, [open, vendors.length]);

  const sorted = useMemo(
    () => [...vendors].sort((a, b) => a.name.localeCompare(b.name)),
    [vendors],
  );

  const selected = vendors.find((v) => v.id === value) ?? null;
  const popoverWidth = Math.max(triggerWidth, 280);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(controlComboboxTriggerClass, "overflow-hidden")}
          disabled={isDisabled}
          type="button"
        >
          <span
            className={cn(
              "truncate text-left flex-1",
              !selected && "text-muted-2",
            )}
          >
            {selected ? selected.name : placeholder ?? "Select vendor"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
        <Command>
          <CommandInput placeholder="Search vendors…" />
          <CommandList className="max-h-[320px]">
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading vendors…
                </p>
              </div>
            ) : (
              <>
                <CommandEmpty>No vendors found.</CommandEmpty>
                {clearable && value && (
                  <CommandGroup>
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onChange("", null);
                        setOpen(false);
                      }}
                    >
                      <span className="text-muted-foreground">— Clear selection —</span>
                    </CommandItem>
                  </CommandGroup>
                )}
                <CommandGroup heading="Vendors">
                  {sorted.map((v) => (
                    <CommandItem
                      key={v.id}
                      value={`${v.name} ${v.email ?? ""} ${v.phone ?? ""}`}
                      onSelect={() => {
                        onChange(v.id, v);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === v.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">{v.name}</span>
                        {(v.email || v.phone) && (
                          <span className="text-[11px] text-muted-foreground">
                            {[v.email, v.phone].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

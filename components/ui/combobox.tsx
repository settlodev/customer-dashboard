"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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
import { cn } from "@/lib/utils";

/**
 * Generic single-select combobox — a searchable replacement for the Radix
 * {@link Select} when the option list is long enough to need typeahead or rich
 * (two-line) items. Built on Popover + Command (the shadcn pattern, mirroring
 * {@link SupplierSelector}).
 *
 * Filtering is done here (`shouldFilter={false}`) so we can match against the
 * label, the secondary `description`, *and* hidden `keywords` — letting a row
 * be found by, say, its UUID even though the UUID is only shown as fine print.
 */
export interface ComboboxOption {
  value: string;
  /** Primary text — shown in the trigger and as the item's first line. */
  label: string;
  /** Secondary muted line under the label (e.g. a UUID). Also searchable. */
  description?: string;
  /** Extra (hidden) strings to match against when searching. */
  keywords?: string[];
  /** Optional heading to bucket this option under (insertion order kept). */
  group?: string;
  /** Render the primary label monospace (handy for enum / id values). */
  mono?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  /** Selected value, or null when nothing is chosen. */
  value: string | null;
  /** Fires with the chosen value, or null when the active row is re-selected. */
  onChange: (value: string | null) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** Leading icon rendered inside the trigger. */
  icon?: React.ReactNode;
  /** Extra classes for the trigger button — set the control width here. */
  className?: string;
  /** Extra classes for the popover panel — set the dropdown width here. */
  contentClassName?: string;
  align?: "start" | "center" | "end";
  ariaLabel?: string;
}

function optionMatches(option: ComboboxOption, term: string): boolean {
  const haystack = [option.label, option.description, ...(option.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  disabled,
  icon,
  className,
  contentClassName,
  align = "start",
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [term, setTerm] = React.useState("");

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = React.useMemo(() => {
    const t = term.trim().toLowerCase();
    return t ? options.filter((o) => optionMatches(o, t)) : options;
  }, [options, term]);

  // Bucket into groups, preserving the order each heading first appears in.
  // Ungrouped options collect under the "" key and render heading-less.
  const groups = React.useMemo(() => {
    const order: string[] = [];
    const byGroup = new Map<string, ComboboxOption[]>();
    for (const o of filtered) {
      const g = o.group ?? "";
      if (!byGroup.has(g)) {
        byGroup.set(g, []);
        order.push(g);
      }
      byGroup.get(g)!.push(o);
    }
    return order.map((g) => ({ heading: g, items: byGroup.get(g)! }));
  }, [filtered]);

  const handleSelect = (next: string) => {
    onChange(next === value ? null : next);
    setOpen(false);
    setTerm("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setTerm("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(controlComboboxTriggerClass, className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <span
              className={cn(
                "truncate",
                selected?.mono && "font-mono text-[12px]",
                !selected && "text-muted-2",
              )}
            >
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn("p-0", contentClassName)}
        style={{ minWidth: "var(--radix-popover-trigger-width)" }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={term}
            onValueChange={setTerm}
          />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              groups.map((g, gi) => (
                <CommandGroup
                  key={g.heading || `__ungrouped-${gi}`}
                  heading={g.heading || undefined}
                >
                  {g.items.map((o) => (
                    <CommandItem
                      key={o.value}
                      value={o.value}
                      onSelect={() => handleSelect(o.value)}
                      className="items-start gap-2"
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          value === o.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex min-w-0 flex-col">
                        <span
                          className={cn(
                            "truncate",
                            o.mono && "font-mono text-[12px]",
                          )}
                        >
                          {o.label}
                        </span>
                        {o.description && (
                          <span className="truncate font-mono text-[11px] text-muted-foreground">
                            {o.description}
                          </span>
                        )}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

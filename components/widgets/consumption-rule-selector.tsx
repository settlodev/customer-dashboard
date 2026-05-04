"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

import { getBomRules } from "@/lib/actions/bom-rule-actions";
import {
  BOM_LIFECYCLE_LABELS,
  BomLifecycleStatus,
  BomRule,
} from "@/types/bom/type";

interface Props {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
  /** Hide these rule ids from the dropdown — typically the current rule. */
  excludeIds?: string[];
  /**
   * Lifecycle statuses to include. Defaults to ACTIVE + DRAFT — operators
   * shouldn't be referencing deprecated rules from new authoring.
   */
  allowedStatuses?: BomLifecycleStatus[];
}

const DEFAULT_STATUSES: BomLifecycleStatus[] = ["ACTIVE", "DRAFT"];

const STATUS_TONE: Record<BomLifecycleStatus, string> = {
  ACTIVE: "text-emerald-600 dark:text-emerald-400",
  DRAFT: "text-amber-600 dark:text-amber-400",
  DEPRECATED: "text-red-600 dark:text-red-400",
};

const ConsumptionRuleSelector: React.FC<Props> = ({
  placeholder = "Select a consumption rule",
  value,
  isDisabled,
  onChange,
  excludeIds,
  allowedStatuses = DEFAULT_STATUSES,
}) => {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<BomRule[]>([]);
  // Spin while resolving an initial value so the trigger doesn't flash
  // the placeholder before the catalogue arrives.
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
    getBomRules()
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setIsLoading(false));
  }, [open, value]);

  const allOptions = useMemo(() => {
    const excluded = new Set(excludeIds ?? []);
    const statuses = new Set(allowedStatuses);
    return rules
      .filter((r) => !excluded.has(r.id) && statuses.has(r.lifecycleStatus))
      .map((r) => ({
        id: r.id,
        name: r.name,
        revisionNumber: r.revisionNumber,
        lifecycleStatus: r.lifecycleStatus,
        searchString: `${r.name} ${r.revisionNumber}`.toLowerCase(),
      }));
  }, [rules, excludeIds, allowedStatuses]);

  const displayedOptions = useMemo(() => {
    if (!searchTerm) return allOptions;
    const term = searchTerm.toLowerCase();
    return allOptions.filter((o) => o.searchString.includes(term));
  }, [allOptions, searchTerm]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return allOptions.find((o) => o.id === value) ?? null;
  }, [allOptions, value]);

  const handleSelect = useCallback(
    (option: { id: string }) => {
      onChange(option.id === value ? "" : option.id);
      setOpen(false);
    },
    [value, onChange],
  );

  const isResolvingValue = !!value && !selectedOption && isLoading;
  const popoverWidth = Math.max(triggerWidth, 320);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden font-normal"
          disabled={isDisabled}
        >
          <span className="flex flex-1 items-center gap-2 truncate text-left">
            {isResolvingValue ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin opacity-60" />
                <span className="text-muted-foreground">Loading...</span>
              </>
            ) : selectedOption ? (
              <>
                <span className="truncate">{selectedOption.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedOption.revisionNumber}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
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
            placeholder="Search consumption rules..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {isLoading ? "Loading..." : "No consumption rules found."}
            </CommandEmpty>
            <CommandGroup>
              {isLoading && displayedOptions.length === 0 ? (
                <div className="py-6 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading consumption rules...
                  </p>
                </div>
              ) : (
                displayedOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.searchString}
                    onSelect={() => handleSelect(option)}
                    className="items-start gap-2"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        value === option.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="break-words">{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.revisionNumber} ·{" "}
                        <span className={STATUS_TONE[option.lifecycleStatus]}>
                          {BOM_LIFECYCLE_LABELS[option.lifecycleStatus]}
                        </span>
                      </span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ConsumptionRuleSelector;

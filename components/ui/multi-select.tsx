"use client";

import * as React from "react";
import { CheckIcon, ChevronDown, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { controlComboboxTriggerClass } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * Multi-select on the Settlo control-box design system (see
 * `components/ui/field.tsx`). The trigger matches a plain `<Select>` — 44px
 * control box, hairline border, orange focus/open ring — and grows to wrap the
 * selected items as compact chips. The dropdown is a searchable command list
 * with checkbox rows.
 *
 * Reusable across the dashboard (stock / product / recipe / rfq / email forms).
 * Uncontrolled by design: seed with `defaultValue`, observe via `onValueChange`.
 */
interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Options to choose from. Each has a label, value, and optional icon. */
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  /** Fired with the full array of selected values on every change. */
  onValueChange: (value: string[]) => void;
  /** Initially-selected values (seeds internal state on mount). */
  defaultValue?: string[];
  /** Trigger text when nothing is selected. Defaults to "Select options". */
  placeholder?: string;
  /** How many chips to show before collapsing the rest into "+N more". */
  maxCount?: number;
  /** Radix modal popover — traps focus/outside interaction. Defaults to false. */
  modalPopover?: boolean;
  /** Render the trigger as a child instead of the built-in Button. */
  asChild?: boolean;
  /** Extra classes for the trigger. */
  className?: string;
  /** Replace the default styling of the selected-item chips. */
  badgeClassName?: string;
  /** Class for the chip's remove (×) control. */
  badgeIconClassName?: string;
}

/** One selected-item chip. */
const chipClass =
  "inline-flex max-w-full items-center gap-1 rounded-md border border-line-2 bg-canvas py-0.5 pl-2 pr-1 text-[12px] font-medium text-ink";

/** A small inline remove (×) control shared by the chips and the clear button. */
const removeControlClass =
  "grid shrink-0 place-items-center rounded-[4px] text-muted-2 transition-colors hover:bg-line hover:text-ink";

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      defaultValue = [],
      placeholder = "Select options",
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      className,
      badgeClassName,
      badgeIconClassName,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] =
      React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const next = [...selectedValues];
        next.pop();
        setSelectedValues(next);
        onValueChange(next);
      }
    };

    const toggleOption = (value: string) => {
      const next = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(next);
      onValueChange(next);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const clearExtraOptions = () => {
      const next = selectedValues.slice(0, maxCount);
      setSelectedValues(next);
      onValueChange(next);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const all = options.map((o) => o.value);
        setSelectedValues(all);
        onValueChange(all);
      }
    };

    // Stop the chip/clear controls (nested inside the trigger button) from
    // also toggling the popover — both on click (React) and pointerdown (Radix).
    const stopTrigger = (event: React.SyntheticEvent) => {
      event.stopPropagation();
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild>
          {asChild ? (
            <div className={cn(className)} />
          ) : (
            <Button
              ref={ref}
              {...props}
              type="button"
              variant="outline"
              onClick={() => setIsPopoverOpen((prev) => !prev)}
              className={cn(
                controlComboboxTriggerClass,
                "h-auto min-h-11 py-1.5",
                className,
              )}
            >
              {selectedValues.length > 0 ? (
                <div className="flex flex-1 flex-wrap items-center gap-1.5 overflow-hidden">
                  {selectedValues.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value);
                    const IconComponent = option?.icon;
                    return (
                      <span key={value} className={cn(chipClass, badgeClassName)}>
                        {IconComponent && (
                          <IconComponent className="h-3.5 w-3.5 shrink-0 text-muted-2" />
                        )}
                        <span className="truncate">
                          {option?.label ?? value}
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={`Remove ${option?.label ?? value}`}
                          className={cn(
                            "h-4 w-4",
                            removeControlClass,
                            badgeIconClassName,
                          )}
                          onPointerDown={stopTrigger}
                          onClick={(event) => {
                            stopTrigger(event);
                            toggleOption(value);
                          }}
                        >
                          <XIcon className="h-3 w-3" />
                        </span>
                      </span>
                    );
                  })}
                  {selectedValues.length > maxCount && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-dashed border-line-2 bg-card py-0.5 pl-2 pr-1 text-[12px] font-medium text-muted-foreground">
                      +{selectedValues.length - maxCount} more
                      <span
                        role="button"
                        tabIndex={-1}
                        aria-label="Remove extra selections"
                        className={cn("h-4 w-4", removeControlClass)}
                        onPointerDown={stopTrigger}
                        onClick={(event) => {
                          stopTrigger(event);
                          clearExtraOptions();
                        }}
                      >
                        <XIcon className="h-3 w-3" />
                      </span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="flex-1 text-left text-muted-2">
                  {placeholder}
                </span>
              )}
              <span className="flex shrink-0 items-center gap-1 self-center pl-1">
                {selectedValues.length > 0 && (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="Clear all"
                    className="grid h-5 w-5 place-items-center rounded-[6px] text-muted-2 transition-colors hover:bg-canvas hover:text-ink"
                    onPointerDown={stopTrigger}
                    onClick={(event) => {
                      stopTrigger(event);
                      handleClear();
                    }}
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-2" />
              </span>
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0"
          align="start"
          onEscapeKeyDown={() => setIsPopoverOpen(false)}
        >
          <Command>
            <CommandInput
              placeholder="Search..."
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  key="all"
                  onSelect={toggleAll}
                  className="cursor-pointer"
                >
                  <Checkbox
                    checked={selectedValues.length === options.length}
                  />
                  <span>(Select all)</span>
                </CommandItem>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      className="cursor-pointer"
                    >
                      <Checkbox checked={isSelected} />
                      {option.icon && (
                        <option.icon className="mr-2 h-4 w-4 text-muted-2" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {selectedValues.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleClear}
                      className="cursor-pointer justify-center text-center text-muted-foreground"
                    >
                      Clear selection
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

/** The square check indicator used on each command row. */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "mr-2 grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-line-2 [&_svg]:invisible",
      )}
    >
      <CheckIcon className="h-3 w-3" />
    </span>
  );
}

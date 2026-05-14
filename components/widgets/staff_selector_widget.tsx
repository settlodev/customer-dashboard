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
import { Staff } from "@/types/staff";
import {
  fetchStaffPage,
  getStaff,
  searchStaffByName,
} from "@/lib/actions/staff-actions";

interface StaffProps {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function staffLabel(staff: Staff): string {
  return [staff.firstName, staff.lastName].filter(Boolean).join(" ").trim();
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

/**
 * Typeahead-driven staff picker. Previously loaded all staff for the
 * current location into a `<Select>`; switched to popover+command to:
 *
 *  - Hydrate the trigger label from `getStaff(value)` instead of holding
 *    the whole roster in memory.
 *  - Browse the first page (sorted by firstName) when the popover opens
 *    with no query — typical locations have 10–50 staff so the first page
 *    is usually the whole list.
 *  - Server-side search via `searchStaffByName` once the user starts
 *    typing, debounced 300 ms.
 *
 * The original widget auto-selected the first staff on mount when no
 * value was given. We keep that behaviour by fetching one staff member
 * up-front when value is empty — that single-row call is cheap and lets
 * existing parents (GRN, proforma invoice, stock transfer status actions)
 * keep their "default to anyone" UX.
 */
function StaffSelectorWidget({
  placeholder,
  value,
  isDisabled,
  onChange,
}: StaffProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Staff[]>([]);
  const [searching, setSearching] = useState(false);
  const lastQueryRef = useRef<string>("");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Auto-select the first staff when no value is set yet. Mirrors the
  // pre-refactor behaviour where consumers relied on a default.
  useEffect(() => {
    if (valueRef.current) return;
    let cancelled = false;
    fetchStaffPage(1, 1)
      .then((res) => {
        if (cancelled) return;
        const first = res?.content?.[0];
        if (first && !valueRef.current) {
          setSelected(first);
          onChangeRef.current(first.id);
        }
      })
      .catch(() => {
        /* leave value empty — parent's required-validation handles it */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate trigger label when value changes externally.
  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    let cancelled = false;
    getStaff(value)
      .then((s) => {
        if (!cancelled && s) setSelected(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Server-side search / browse-first-page when popover open.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    let cancelled = false;

    if (!trimmed) {
      setSearching(true);
      fetchStaffPage(1, PAGE_SIZE)
        .then((res) => {
          if (cancelled) return;
          setResults(res?.content ?? []);
          setSearching(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setSearching(false);
        });
      return () => {
        cancelled = true;
      };
    }

    setSearching(true);
    const handle = setTimeout(() => {
      lastQueryRef.current = trimmed;
      searchStaffByName(trimmed)
        .then((res) => {
          if (cancelled || lastQueryRef.current !== trimmed) return;
          setResults(res ?? []);
          setSearching(false);
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setSearching(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  const triggerLabel = selected
    ? staffLabel(selected) || placeholder || "Select staff"
    : placeholder || "Select staff";

  const handleSelect = (staff: Staff) => {
    setSelected(staff);
    onChange(staff.id);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setResults([]);
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
            placeholder="Search staff by name…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {searching ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>No staff found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {results.map((staff) => (
                  <CommandItem
                    key={staff.id}
                    value={staff.id}
                    onSelect={() => handleSelect(staff)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === staff.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">
                      {staffLabel(staff) || "Unnamed"}
                    </span>
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

export default StaffSelectorWidget;

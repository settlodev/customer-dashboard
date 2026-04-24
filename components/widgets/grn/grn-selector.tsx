"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { getGrns } from "@/lib/actions/grn-actions";
import type { Grn } from "@/types/grn/type";
import { GRN_STATUS_LABELS } from "@/types/grn/type";

interface Props {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  /** When set, only GRNs belonging to this supplier are shown. */
  supplierId?: string;
  onChange: (value: string, grn: Grn | null) => void;
  onBlur?: () => void;
}

const FETCH_SIZE = 100;

function formatReceivedDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

const GrnSelector: React.FC<Props> = ({
  placeholder = "Select GRN",
  value,
  isDisabled,
  supplierId,
  onChange,
  onBlur,
}) => {
  const [open, setOpen] = useState(false);
  const [grns, setGrns] = useState<Grn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    if (!open || grns.length > 0) return;
    setIsLoading(true);
    getGrns(0, FETCH_SIZE)
      .then((res) => setGrns(res.content ?? []))
      .catch(() => setGrns([]))
      .finally(() => setIsLoading(false));
  }, [open, grns.length]);

  const options = useMemo(() => {
    const base = grns
      .filter((g) => g.status !== "CANCELLED")
      .filter((g) => !supplierId || g.supplierId === supplierId);

    const enriched = base.map((g) => ({
      id: g.id,
      grn: g,
      searchString: `${g.grnNumber} ${g.supplierName ?? ""} ${g.status}`.toLowerCase(),
    }));

    if (!searchTerm) return enriched;
    const term = searchTerm.toLowerCase();
    return enriched.filter((o) => o.searchString.includes(term));
  }, [grns, supplierId, searchTerm]);

  const selectedGrn = useMemo(() => {
    if (!value) return null;
    return grns.find((g) => g.id === value) ?? null;
  }, [grns, value]);

  const handleSelect = useCallback(
    (grn: Grn) => {
      const deselecting = grn.id === value;
      onChange(deselecting ? "" : grn.id, deselecting ? null : grn);
      setOpen(false);
      onBlur?.();
    },
    [value, onChange, onBlur],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("", null);
      onBlur?.();
    },
    [onChange, onBlur],
  );

  const popoverWidth = Math.max(triggerWidth, 320);

  const displayContent = selectedGrn ? (
    <span className="flex items-center gap-2 truncate">
      <span className="font-mono text-xs font-semibold">
        {selectedGrn.grnNumber}
      </span>
      {selectedGrn.supplierName && (
        <span className="text-muted-foreground truncate">
          · {selectedGrn.supplierName}
        </span>
      )}
    </span>
  ) : (
    <span className="text-muted-foreground">{placeholder}</span>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden font-normal"
          disabled={isDisabled}
        >
          <span className="truncate text-left flex-1">{displayContent}</span>
          <span className="ml-2 flex items-center gap-1 shrink-0">
            {selectedGrn && !isDisabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear selection"
                onClick={handleClear}
                className="rounded p-0.5 hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 opacity-60" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by GRN number or supplier…"
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList className="max-h-[320px]">
            <CommandEmpty>
              {isLoading
                ? "Loading GRNs…"
                : supplierId
                  ? "No GRNs found for this supplier."
                  : "No GRNs found."}
            </CommandEmpty>
            <CommandGroup>
              {isLoading && options.length === 0 ? (
                <div className="py-6 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Loading GRNs…
                  </p>
                </div>
              ) : (
                options.map(({ id, grn, searchString }) => (
                  <CommandItem
                    key={id}
                    value={searchString}
                    onSelect={() => handleSelect(grn)}
                    className="items-start gap-2"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        value === id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold">
                          {grn.grnNumber}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {GRN_STATUS_LABELS[grn.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {grn.supplierName ?? "Supplier —"}
                        {" · "}
                        {formatReceivedDate(grn.receivedDate)}
                      </p>
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

export default GrnSelector;

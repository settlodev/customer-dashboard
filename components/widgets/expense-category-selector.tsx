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
import { fetchExpenseCategories } from "@/lib/actions/expense-categories-actions";
import type { ExpenseCategory } from "@/types/expense-category/type";

interface Props {
  value?: string | null;
  placeholder?: string;
  onChange: (value: string, category: ExpenseCategory | null) => void;
  isDisabled?: boolean;
  clearable?: boolean;
}

export function ExpenseCategorySelector({
  value,
  placeholder,
  onChange,
  isDisabled,
  clearable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
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
    if (open && categories.length === 0) {
      setLoading(true);
      fetchExpenseCategories()
        .then((all) => {
          if (cancelled) return;
          setCategories(all.filter((c) => c.active));
        })
        .catch(() => !cancelled && setCategories([]))
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
  }, [open, categories.length]);

  const { roots, byParent } = useMemo(() => {
    const r: ExpenseCategory[] = [];
    const m = new Map<string, ExpenseCategory[]>();
    for (const c of categories) {
      if (!c.parentId) {
        r.push(c);
      } else {
        const list = m.get(c.parentId) ?? [];
        list.push(c);
        m.set(c.parentId, list);
      }
    }
    r.sort((a, b) => a.name.localeCompare(b.name));
    return { roots: r, byParent: m };
  }, [categories]);

  const selected = categories.find((c) => c.id === value) ?? null;
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
            {selected ? selected.name : placeholder ?? "Select category"}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
        <Command>
          <CommandInput placeholder="Search categories…" />
          <CommandList className="max-h-[320px]">
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading categories…
                </p>
              </div>
            ) : (
              <>
                <CommandEmpty>No categories found.</CommandEmpty>
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
                {roots.map((root) => {
                  const children = byParent.get(root.id) ?? [];
                  return (
                    <CommandGroup key={root.id} heading={root.name}>
                      <CommandItem
                        value={`${root.name} ${root.code ?? ""}`}
                        onSelect={() => {
                          onChange(root.id, root);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === root.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="text-sm font-medium">{root.name}</span>
                      </CommandItem>
                      {children.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={`${root.name} ${c.name} ${c.code ?? ""}`}
                          onSelect={() => {
                            onChange(c.id, c);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === c.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="ml-3 text-sm">{c.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

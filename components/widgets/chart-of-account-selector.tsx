"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
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
import { listChartOfAccounts } from "@/lib/actions/accounting-mapping-actions";
import type {
  ChartOfAccount,
  AccountType,
} from "@/types/accounting-mapping/type";
import { ACCOUNT_TYPE_LABELS } from "@/types/accounting-mapping/type";

interface Props {
  /** Optional — restrict the picker to one account type (ASSET for cash, REVENUE for sales, etc.). */
  accountType?: AccountType;
  value?: string;
  placeholder?: string;
  onChange: (value: string, account: ChartOfAccount | null) => void;
  isDisabled?: boolean;
}

export function ChartOfAccountSelector({
  accountType,
  value,
  placeholder,
  onChange,
  isDisabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
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
    if (open && accounts.length === 0) {
      setLoading(true);
      listChartOfAccounts(accountType)
        .then((all) => {
          if (cancelled) return;
          setAccounts(all.filter((a) => a.active));
        })
        .catch(() => !cancelled && setAccounts([]))
        .finally(() => !cancelled && setLoading(false));
    }
    return () => {
      cancelled = true;
    };
  }, [open, accountType, accounts.length]);

  // Group by account type for nicer scan
  const grouped = useMemo(() => {
    const groups = new Map<AccountType, ChartOfAccount[]>();
    for (const a of accounts) {
      const list = groups.get(a.accountType) ?? [];
      list.push(a);
      groups.set(a.accountType, list);
    }
    return Array.from(groups.entries()).map(([type, list]) => ({
      type,
      list: list.sort((x, y) => x.code.localeCompare(y.code)),
    }));
  }, [accounts]);

  const selected = accounts.find((a) => a.id === value) ?? null;

  const popoverWidth = Math.max(triggerWidth, 320);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden"
          disabled={isDisabled}
          type="button"
        >
          <span className="truncate text-left flex-1">
            {selected
              ? `${selected.code} · ${selected.name}`
              : placeholder ?? "Select chart of account"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: popoverWidth }} align="start">
        <Command>
          <CommandInput placeholder="Search by code or name…" />
          <CommandList className="max-h-[320px]">
            {loading ? (
              <div className="py-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">Loading accounts…</p>
              </div>
            ) : (
              <>
                <CommandEmpty>No accounts found.</CommandEmpty>
                {grouped.map(({ type, list }) => (
                  <CommandGroup key={type} heading={ACCOUNT_TYPE_LABELS[type]}>
                    {list.map((a) => (
                      <CommandItem
                        key={a.id}
                        value={`${a.code} ${a.name}`}
                        onSelect={() => {
                          onChange(a.id, a);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === a.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm">
                            <span className="font-mono mr-2 text-muted-foreground">
                              {a.code}
                            </span>
                            {a.name}
                          </span>
                          {a.description && (
                            <span className="text-[11px] text-muted-foreground">
                              {a.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

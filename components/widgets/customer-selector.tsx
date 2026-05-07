"use client";

import { useEffect, useMemo, useState } from "react";
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
import { fetchAllCustomers } from "@/lib/actions/customer-actions";

interface CustomerProps {
    label?: string;
    placeholder: string;
    isRequired?: boolean;
    value?: string;
    isDisabled?: boolean;
    description?: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
}

function customerLabel(customer: Customer): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
}

function CustomerSelector({
    placeholder,
    value,
    isDisabled,
    onChange,
}: CustomerProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadCustomers() {
            try {
                setIsLoading(true);
                const fetchedCustomers = await fetchAllCustomers();
                if (!cancelled) setCustomers(fetchedCustomers);
            } catch (error: unknown) {
                console.log("Error fetching customers:", error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }
        loadCustomers();
        return () => {
            cancelled = true;
        };
    }, []);

    const selected = useMemo(
      () => customers.find((c) => c.id === value),
      [customers, value],
    );

    const triggerLabel = selected
      ? customerLabel(selected) || placeholder || "Select customer"
      : placeholder || "Select customer";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isDisabled || isLoading}
                    className={cn(
                        "w-full justify-between h-10 font-normal",
                        !selected && "text-muted-foreground",
                    )}
                >
                    <span className="truncate">{triggerLabel}</span>
                    {isLoading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-0"
                style={{ width: "var(--radix-popover-trigger-width)" }}
                align="start"
            >
                <Command
                    filter={(itemValue, search) => {
                        // `itemValue` is the lowercased haystack we set on each
                        // CommandItem; cmdk does substring matching for us.
                        return itemValue.includes(search.toLowerCase()) ? 1 : 0;
                    }}
                >
                    <CommandInput placeholder="Search by name or phone…" />
                    <CommandList>
                        <CommandEmpty>No customer found.</CommandEmpty>
                        <CommandGroup>
                            {customers.map((customer) => {
                                const name = customerLabel(customer);
                                const haystack = [
                                    name,
                                    customer.phoneNumber ?? "",
                                    customer.email ?? "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .toLowerCase();
                                return (
                                    <CommandItem
                                        key={customer.id}
                                        value={haystack}
                                        onSelect={() => {
                                            onChange(customer.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === customer.id
                                                    ? "opacity-100"
                                                    : "opacity-0",
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
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
export default CustomerSelector

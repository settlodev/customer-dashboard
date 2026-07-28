import { Supplier } from "@/types/supplier/type";
import { useEffect, useState, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { searchSuppliers } from "@/lib/actions/supplier-actions";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface SupplierProps {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function SupplierSelector({
  placeholder,
  value,
  isDisabled,
  onChange,
  onBlur,
}: SupplierProps) {
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");

  const size = 20;
  const page = 0;

  // Debounced fetch on search query change
  useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        setIsLoading(true);
        const fetchedSuppliers = await searchSuppliers(searchQuery, page, size);
        setSuppliers(fetchedSuppliers.content);
      } catch (error: any) {
        console.log("Error fetching suppliers:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const selectedSupplier = suppliers.find((s) => s.id === value);

  const handleSelect = useCallback(
    (supplierId: string) => {
      onChange(supplierId === value ? "" : supplierId);
      setOpen(false);
    },
    [onChange, value],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) onBlur();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isDisabled || isLoading}
          className="w-full justify-between font-normal"
        >
          <span
            className={cn(
              "truncate",
              !selectedSupplier && "text-muted-foreground",
            )}
          >
            {selectedSupplier
              ? selectedSupplier.name
              : placeholder || "Select supplier"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search suppliers..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <CommandEmpty>No supplier found.</CommandEmpty>
                <CommandGroup>
                  {suppliers.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => handleSelect(item.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{item.name}</span>
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

export default SupplierSelector;

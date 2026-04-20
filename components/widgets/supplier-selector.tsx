"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchAllSuppliers } from "@/lib/actions/supplier-actions";
import type { Supplier } from "@/types/supplier/type";

interface Props {
  label: string;
  placeholder: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Business-scoped supplier picker. Used across LPO, GRN, reorder config,
 * requisition, RFQ, and stock forms — keep the prop signature stable.
 *
 * Archived suppliers are still returned by the API but grouped into their own
 * block so operators don't accidentally assign new work to a dormant supplier.
 */
function SupplierSelector({
  placeholder,
  value,
  isDisabled,
  onChange,
  onBlur,
}: Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchAllSuppliers()
      .then((list) => {
        if (!cancelled) setSuppliers(list);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { active, archived } = useMemo(() => {
    const sorted = [...suppliers].sort((a, b) => a.name.localeCompare(b.name));
    return {
      active: sorted.filter((s) => !s.archivedAt),
      archived: sorted.filter((s) => !!s.archivedAt),
    };
  }, [suppliers]);

  return (
    <Select
      value={value || ""}
      onValueChange={(v) => {
        onChange(v);
        onBlur();
      }}
      disabled={isDisabled || isLoading}
    >
      <SelectTrigger>
        {isLoading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading suppliers
          </span>
        ) : (
          <SelectValue placeholder={placeholder || "Select supplier"} />
        )}
      </SelectTrigger>
      <SelectContent>
        {active.length > 0 && (
          <SelectGroup>
            <SelectLabel>Active</SelectLabel>
            {active.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="flex items-center gap-2">
                  {s.name}
                  {s.linkedToSettloSupplier && (
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {archived.length > 0 && (
          <SelectGroup>
            <SelectLabel>Archived</SelectLabel>
            {archived.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {!isLoading && suppliers.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No suppliers yet. Add one from the Suppliers page.
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

export default SupplierSelector;

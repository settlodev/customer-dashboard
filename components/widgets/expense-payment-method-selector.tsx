"use client";

import React, { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLocationPaymentMethods } from "@/lib/actions/payment-method-actions";
import type { PaymentMethod, PaymentMethodChild } from "@/types/payments/type";

interface Props {
  value?: string;
  placeholder?: string;
  isDisabled?: boolean;
  onChange: (value: string, label: string) => void;
}

interface FlatOption {
  id: string;
  label: string;
  code: string;
}

/**
 * Flat selector listing every enabled payment method at the location —
 * including nested provider rows under Bank / Mobile Money. Used by
 * the expense-payment form so the operator can pick "M-Pesa", "Cash",
 * "BNG Bank Card", etc., without caring whether the row is a parent or
 * a provider child.
 */
export function ExpensePaymentMethodSelector({
  value,
  placeholder,
  isDisabled,
  onChange,
}: Props) {
  const [options, setOptions] = useState<FlatOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLocationPaymentMethods()
      .then((methods: PaymentMethod[] | null) => {
        if (cancelled) return;
        const flat: FlatOption[] = [];
        for (const m of methods ?? []) {
          if (!m.enabled) continue;
          const children: PaymentMethodChild[] = m.children ?? [];
          if (children.length > 0) {
            for (const child of children) {
              if (!child.enabled) continue;
              flat.push({
                id: child.id,
                label: `${m.displayName} · ${child.displayName}`,
                code: child.code,
              });
            }
          } else {
            flat.push({ id: m.id, label: m.displayName, code: m.code });
          }
        }
        setOptions(flat);
      })
      .catch(() => !cancelled && setOptions([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        const opt = options.find((o) => o.id === v);
        onChange(v, opt?.label ?? "");
      }}
      disabled={isDisabled || loading}
    >
      <SelectTrigger className="h-10 w-full">
        <SelectValue
          placeholder={
            loading
              ? "Loading payment methods…"
              : (placeholder ?? "Select payment method")
          }
        >
          {selected?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 && !loading ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            No active payment methods at this location
          </div>
        ) : (
          options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

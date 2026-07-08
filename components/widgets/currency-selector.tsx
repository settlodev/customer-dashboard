"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { controlSelectTriggerClass } from "@/components/ui/field";
import { getCachedCountries } from "@/lib/cache/reference-data";

const COMMON_CURRENCIES: { code: string; name: string }[] = [
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "BIF", name: "Burundian Franc" },
  { code: "ZAR", name: "South African Rand" },
  { code: "ZMW", name: "Zambian Kwacha" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "AED", name: "UAE Dirham" },
  { code: "INR", name: "Indian Rupee" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
];

interface Props {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  className?: string;
  /** When true, fetch unique currencies from the countries endpoint in addition
   *  to the built-in common list. Useful for forms that may need rarer codes. */
  includeAllCountries?: boolean;
  /** Codes to remove from the picker — for cases where the form already
   *  has those currencies covered (e.g. price overrides shouldn't allow
   *  picking the variant's own native currency). The current `value` is
   *  always kept visible so the trigger can still display it. */
  excludeCodes?: string[];
}

const CurrencySelector: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Select currency",
  isDisabled,
  isRequired,
  className,
  includeAllCountries = false,
  excludeCodes,
}) => {
  const [extra, setExtra] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    if (!includeAllCountries) return;
    let cancelled = false;
    getCachedCountries()
      .then((countries) => {
        if (cancelled || !Array.isArray(countries)) return;
        const seen = new Set(COMMON_CURRENCIES.map((c) => c.code));
        const derived: { code: string; name: string }[] = [];
        for (const country of countries as Array<{ name: string; currencyCode: string }>) {
          const code = country?.currencyCode?.toUpperCase?.();
          if (!code || seen.has(code)) continue;
          seen.add(code);
          derived.push({ code, name: country.name });
        }
        if (!cancelled) setExtra(derived);
      })
      .catch(() => {
        if (!cancelled) setExtra([]);
      });
    return () => {
      cancelled = true;
    };
  }, [includeAllCountries]);

  const options = useMemo(() => {
    const merged = [...COMMON_CURRENCIES, ...extra];
    // If the current value is unknown, append it so the Select can display it
    if (value) {
      const code = value.toUpperCase();
      if (!merged.some((o) => o.code === code)) {
        merged.push({ code, name: code });
      }
    }
    // Filter out excluded codes (preserving the current value so the
    // trigger can render it even if the parent meant to hide it).
    const exclude = new Set(
      (excludeCodes ?? [])
        .map((c) => c?.toUpperCase?.())
        .filter((c): c is string => !!c),
    );
    const filtered = merged.filter(
      (o) => o.code === value?.toUpperCase() || !exclude.has(o.code),
    );
    filtered.sort((a, b) => a.code.localeCompare(b.code));
    return filtered;
  }, [extra, value, excludeCodes]);

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={isDisabled}
      {...(isRequired && { required: true })}
    >
      <SelectTrigger className={cn(controlSelectTriggerClass, "w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="font-mono text-xs font-semibold mr-2">{c.code}</span>
            <span className="text-sm text-muted-foreground">{c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;

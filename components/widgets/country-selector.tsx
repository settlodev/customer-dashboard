"use client";

import React, { useEffect } from "react";
import { Combobox } from "@/components/ui/combobox";
import { Country } from "@/types/country/type";
import { useCachedCountries } from "@/lib/cache/reference-data";

interface Props {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  valueKey?: keyof Country;
  /**
   * ISO country code to auto-select once the country list loads if the caller
   * hasn't already set a value. Example: `"TZ"` to default to Tanzania.
   */
  defaultCode?: string;
}

const CountrySelector: React.FC<Props> = ({
  placeholder,
  value,
  isDisabled,
  description,
  onChange,
  valueKey = "id",
  defaultCode,
}) => {
  const { data: countriesData, loading: isLoading } = useCachedCountries();
  const countries = countriesData ?? [];

  // When `defaultCode` is supplied and the caller hasn't picked a value yet,
  // auto-select the matching country as soon as the list loads. Never
  // overwrites an existing selection.
  useEffect(() => {
    if (value || !defaultCode || countries.length === 0) return;
    const match = countries.find(
      (c) => c.code?.toUpperCase() === defaultCode.toUpperCase(),
    );
    if (match) onChange(String(match[valueKey]));
  }, [countries, defaultCode, value, valueKey, onChange]);

  return (
    <div className="space-y-2">
      <Combobox
        options={countries.map((country) => ({
          value: String(country[valueKey]),
          label: `${country.name}${valueKey === "currencyCode" ? ` (${country.currencyCode})` : ""}`,
          keywords: [country.code].filter(Boolean) as string[],
        }))}
        value={value ?? null}
        onChange={(v) => onChange(v ?? "")}
        placeholder={placeholder ?? "Select country"}
        searchPlaceholder="Search countries…"
        emptyText={isLoading ? "Loading countries…" : "No countries found."}
        disabled={isDisabled || isLoading}
        ariaLabel="Country"
      />
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

export default CountrySelector;

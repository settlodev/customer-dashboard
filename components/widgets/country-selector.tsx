"use client";

import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  isRequired,
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
      <Select
        defaultValue={value}
        disabled={isDisabled || isLoading}
        value={value}
        {...(isRequired && { required: true })}
        onValueChange={onChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? "Select country"} />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country.id} value={String(country[valueKey])}>
              {country.name}{valueKey === "currencyCode" ? ` (${country.currencyCode})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
};

export default CountrySelector;

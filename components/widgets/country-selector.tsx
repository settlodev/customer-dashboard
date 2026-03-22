"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country } from "@/types/country/type";
import { fetchCountries } from "@/lib/actions/countries-actions";

interface Props {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  value?: string;
  isDisabled?: boolean;
  description?: string;
  onChange: (value: string) => void;
  valueKey?: keyof Country;
}

const CountrySelector: React.FC<Props> = ({
  placeholder,
  isRequired,
  value,
  isDisabled,
  description,
  onChange,
  valueKey = "id",
}) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCountries() {
      try {
        setIsLoading(true);
        const fetchedCountries = await fetchCountries();
        setCountries(fetchedCountries);
      } catch (error: any) {
        console.log("Error fetching countries:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCountries();
  }, []);

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

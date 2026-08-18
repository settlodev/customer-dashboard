"use client";

import React, { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { fetchAllStores } from "@/lib/actions/store-actions";
import type { Store } from "@/types/store/type";

interface StoreSelectorProps {
  placeholder?: string;
  value?: string;
  isDisabled?: boolean;
  businessId?: string;
  locationId?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function StoreSelector({
  placeholder = "Select store",
  value,
  isDisabled,
  businessId,
  locationId,
  onChange,
  onBlur,
}: StoreSelectorProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchAllStores(businessId, locationId);
        setStores(data.filter((s) => s.active));
      } catch {
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [businessId, locationId]);

  return (
    <Combobox
      options={stores.map((store) => ({
        value: store.id,
        label: store.name,
        description: store.code || undefined,
      }))}
      value={value ?? null}
      onChange={(v) => onChange(v ?? "")}
      placeholder={placeholder}
      searchPlaceholder="Search stores…"
      emptyText={isLoading ? "Loading stores…" : "No stores available"}
      disabled={isDisabled || isLoading}
      ariaLabel="Store"
      onOpenChange={(open) => {
        if (!open) onBlur?.();
      }}
    />
  );
}

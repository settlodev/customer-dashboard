"use client";

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <Select value={value} disabled={isDisabled || isLoading} onValueChange={onChange} onOpenChange={onBlur}>
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
            {store.code && <span className="text-xs text-muted-foreground ml-1">({store.code})</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

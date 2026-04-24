"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStorageZones } from "@/lib/actions/warehouse/storage-zone-actions";
import type { StorageZone } from "@/types/warehouse/storage-zone";

interface Props {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isDisabled?: boolean;
  placeholder?: string;
}

export default function ZoneSelector({
  value,
  onChange,
  onBlur,
  isDisabled,
  placeholder = "Select a zone",
}: Props) {
  const [zones, setZones] = useState<StorageZone[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStorageZones()
      .then((result) => {
        if (!cancelled) setZones(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Couldn't load zones");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = zones === null && !error;
  const list = zones ?? [];
  const active = list.filter((z) => z.active !== false && !z.archivedAt);

  return (
    <div className="space-y-1">
      <Select
        value={value ?? ""}
        onValueChange={onChange}
        onOpenChange={(open) => {
          if (!open) onBlur?.();
        }}
        disabled={isDisabled || loading || active.length === 0}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              loading
                ? "Loading zones…"
                : active.length === 0
                  ? "No zones configured"
                  : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {active.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              <div className="flex flex-col items-start">
                <span>{zone.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {zone.code}
                  {zone.binCount ? ` · ${zone.binCount} bin${zone.binCount === 1 ? "" : "s"}` : ""}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {!loading && !error && active.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Configure a zone for this warehouse before starting a zone count.
        </p>
      )}
    </div>
  );
}

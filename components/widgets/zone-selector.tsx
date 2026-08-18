"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
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
      <Combobox
        options={active.map((zone) => ({
          value: zone.id,
          label: zone.name,
          description: `${zone.code}${zone.binCount ? ` · ${zone.binCount} bin${zone.binCount === 1 ? "" : "s"}` : ""}`,
        }))}
        value={value ?? null}
        onChange={(v) => onChange(v ?? "")}
        placeholder={placeholder}
        searchPlaceholder="Search zones…"
        emptyText={loading ? "Loading zones…" : "No zones configured"}
        disabled={isDisabled || loading || active.length === 0}
        ariaLabel="Zone"
        onOpenChange={(open) => {
          if (!open) onBlur?.();
        }}
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      {!loading && !error && active.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Configure a zone for this warehouse before starting a zone count.
        </p>
      )}
    </div>
  );
}

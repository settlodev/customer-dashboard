"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  SettingsSection,
  SettingsField,
} from "../../shared/settings-section";
import { PanelHeader } from "../../shared/panel-header";
import { useToast } from "@/hooks/use-toast";
import { updateStore } from "@/lib/actions/store-actions";
import type { Store } from "@/types/store/type";

/** Editable subset of the store record. Everything else is system-owned. */
const FIELDS = [
  "name",
  "code",
  "storeNumber",
  "address",
  "region",
  "district",
  "ward",
  "postalCode",
  "capacity",
] as const;

type FieldKey = (typeof FIELDS)[number];
type Draft = { [K in FieldKey]?: string };

export function StoreProfilePanel({
  store,
  onSaved,
}: {
  store: Store;
  onSaved: (next: Store) => void;
}) {
  const seed = useMemo<Draft>(() => {
    const out: Draft = {};
    for (const k of FIELDS) {
      const raw = store[k];
      out[k] = raw === undefined || raw === null ? "" : String(raw);
    }
    return out;
  }, [store]);

  const [values, setValues] = useState<Draft>(seed);
  const [baseline, setBaseline] = useState<Draft>(seed);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isDirty = FIELDS.some((k) => (values[k] ?? "") !== (baseline[k] ?? ""));
  const set = (k: FieldKey, next: string) =>
    setValues((prev) => ({ ...prev, [k]: next }));

  const save = () => {
    if (!values.name?.trim()) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: "Store name is required.",
      });
      return;
    }
    startTransition(async () => {
      const capacity = values.capacity?.trim();
      const payload = {
        // Ownership is fixed — a store can't be moved between businesses or
        // parent locations from here, but the schema requires both.
        businessId: store.businessId,
        locationId: store.locationId,
        name: values.name!.trim(),
        code: values.code?.trim() || undefined,
        storeNumber: values.storeNumber?.trim() || undefined,
        address: values.address?.trim() || undefined,
        region: values.region?.trim() || undefined,
        district: values.district?.trim() || undefined,
        ward: values.ward?.trim() || undefined,
        postalCode: values.postalCode?.trim() || undefined,
        capacity: capacity ? Number(capacity) : undefined,
      };

      const res = await updateStore(store.id, payload);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
        return;
      }
      toast({ title: "Saved", description: res.message });
      setBaseline(values);
      onSaved({ ...store, ...payload } as Store);
    });
  };

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Store"
        description="This store's own record — the name it appears under on transfers, requests and stock reports."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {store.identifier && (
              <Badge variant="outline">{store.identifier}</Badge>
            )}
            <Badge variant={store.active ? "default" : "secondary"}>
              {store.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        }
      />

      <SettingsSection
        title="Details"
        description="Shown wherever this store is named across the dashboard."
        onSave={save}
        isPending={isPending}
        isDirty={isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsField label="Store name">
            <Input
              value={values.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Code">
            <Input
              value={values.code ?? ""}
              onChange={(e) => set("code", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Store number">
            <Input
              value={values.storeNumber ?? ""}
              onChange={(e) => set("storeNumber", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Capacity" hint="Optional — units this store holds.">
            <Input
              type="number"
              min={0}
              value={values.capacity ?? ""}
              onChange={(e) => set("capacity", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Address"
        description="Where deliveries to this store go."
        onSave={save}
        isPending={isPending}
        isDirty={isDirty}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SettingsField label="Street address">
            <Input
              value={values.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Region">
            <Input
              value={values.region ?? ""}
              onChange={(e) => set("region", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="District">
            <Input
              value={values.district ?? ""}
              onChange={(e) => set("district", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Ward">
            <Input
              value={values.ward ?? ""}
              onChange={(e) => set("ward", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
          <SettingsField label="Postal code">
            <Input
              value={values.postalCode ?? ""}
              onChange={(e) => set("postalCode", e.target.value)}
              disabled={isPending}
            />
          </SettingsField>
        </div>
      </SettingsSection>
    </div>
  );
}

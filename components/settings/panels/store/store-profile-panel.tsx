"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Hash, Home, Map, MapPin, Compass, Store as StoreIcon, Warehouse } from "lucide-react";
import {
  ControlInput,
  StandaloneField as Field,
} from "@/components/ui/field";
import { SettingsSection } from "../../shared/settings-section";
import { PanelHeader } from "../../shared/panel-header";
import { SettingsSaveBar } from "../../shared/settings-save-bar";
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

  const dirtyCount = FIELDS.filter(
    (k) => (values[k] ?? "") !== (baseline[k] ?? ""),
  ).length;
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
        icon={<StoreIcon className="h-4 w-4" />}
        title="Details"
        description="Shown wherever this store is named across the dashboard."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Store name"
            hint="Shown wherever this store is named.">
            {(id) => (
              <ControlInput
                id={id}
                prefix={<StoreIcon className="h-3.5 w-3.5" />}
              placeholder="e.g. Masaki stockroom"
                value={values.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Code"
            hint="Short code used on transfer documents.">
            {(id) => (
              <ControlInput
                id={id}
              mono
                prefix={<Hash className="h-3.5 w-3.5" />}
              placeholder="MSK"
                value={values.code ?? ""}
                onChange={(e) => set("code", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Store number"
            hint="Your own numbering, if you use one.">
            {(id) => (
              <ControlInput
                id={id}
              mono
                prefix={<Hash className="h-3.5 w-3.5" />}
                value={values.storeNumber ?? ""}
                onChange={(e) => set("storeNumber", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Capacity"
            hint="Units this store can hold.">
            {(id) => (
              <ControlInput
                id={id}
              type="number"
              inputMode="numeric"
              min={0}
              mono
                prefix={<Warehouse className="h-3.5 w-3.5" />}
              placeholder="—"
                value={values.capacity ?? ""}
                onChange={(e) => set("capacity", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={<MapPin className="h-4 w-4" />}
        title="Address"
        description="Where deliveries to this store go."
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Street address">
            {(id) => (
              <ControlInput
                id={id}
                prefix={<Home className="h-3.5 w-3.5" />}
              placeholder="Street, building, floor"
                value={values.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Region">
            {(id) => (
              <ControlInput
                id={id}
                prefix={<MapPin className="h-3.5 w-3.5" />}
              placeholder="e.g. Dar es Salaam"
                value={values.region ?? ""}
                onChange={(e) => set("region", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="District">
            {(id) => (
              <ControlInput
                id={id}
                prefix={<Map className="h-3.5 w-3.5" />}
              placeholder="e.g. Kinondoni"
                value={values.district ?? ""}
                onChange={(e) => set("district", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Ward">
            {(id) => (
              <ControlInput
                id={id}
                prefix={<Compass className="h-3.5 w-3.5" />}
              placeholder="e.g. Masaki"
                value={values.ward ?? ""}
                onChange={(e) => set("ward", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
          <Field label="Postal code">
            {(id) => (
              <ControlInput
                id={id}
              mono
                prefix={<Hash className="h-3.5 w-3.5" />}
              placeholder="e.g. 14111"
                value={values.postalCode ?? ""}
                onChange={(e) => set("postalCode", e.target.value)}
                disabled={isPending}
              />
            )}
          </Field>
        </div>
      </SettingsSection>

      <SettingsSaveBar
        dirtyCount={dirtyCount}
        isPending={isPending}
        onSave={save}
        onDiscard={() => setValues(baseline)}
      />
    </div>
  );
}

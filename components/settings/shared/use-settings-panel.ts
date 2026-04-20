"use client";

import { useMemo, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateLocationSettings } from "@/lib/actions/location-settings-actions";
import type { LocationSettings } from "@/types/location-settings/type";
import type { LocationSettingsUpdate } from "@/types/location-settings/schema";

/**
 * Shared controller for a section-level settings form. Given the starting
 * values and the current persisted state, it exposes:
 *  - `values`: local edit state
 *  - `setField(name, value)`: typed setter
 *  - `isDirty`: true when local state diverges from persisted
 *  - `save()`: validates + PUTs only the fields in the section
 *  - `reset()`: re-seed local state from the persisted object
 *
 * Keeps each panel lean and avoids dozens of useForm boilerplate blocks.
 */
export function useSettingsPanel<K extends keyof LocationSettings>(
  keys: readonly K[],
  initial: LocationSettings | null,
  onSaved?: (next: LocationSettings) => void,
) {
  type PartialValues = { [P in K]?: LocationSettings[P] | null };

  const seed = useMemo<PartialValues>(() => {
    if (!initial) return {} as PartialValues;
    const out: PartialValues = {} as PartialValues;
    for (const k of keys) out[k] = initial[k] as LocationSettings[K];
    return out;
  }, [initial, keys]);

  const [values, setValues] = useState<PartialValues>(seed);
  const [baseline, setBaseline] = useState<PartialValues>(seed);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const isDirty = useMemo(() => {
    for (const k of keys) {
      const a = values[k];
      const b = baseline[k];
      if (Array.isArray(a) || Array.isArray(b)) {
        if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) return true;
      } else if ((a ?? null) !== (b ?? null)) {
        return true;
      }
    }
    return false;
  }, [values, baseline, keys]);

  const setField = <P extends K>(name: P, next: LocationSettings[P] | null | undefined) => {
    setValues((prev) => ({ ...prev, [name]: next as LocationSettings[P] }));
  };

  const save = () => {
    startTransition(async () => {
      const payload: LocationSettingsUpdate = {};
      for (const k of keys) {
        const current = values[k];
        const prior = baseline[k];
        if ((current ?? null) === (prior ?? null)) continue;
        (payload as Record<string, unknown>)[k as string] = current ?? undefined;
      }
      if (Object.keys(payload).length === 0) return;

      const res = await updateLocationSettings(payload);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't save",
          description: res.message,
        });
        return;
      }
      toast({ title: "Saved", description: res.message });
      if (res.data) {
        const refreshed: PartialValues = {} as PartialValues;
        for (const k of keys) refreshed[k] = res.data[k] as LocationSettings[K];
        setValues(refreshed);
        setBaseline(refreshed);
        onSaved?.(res.data);
      }
    });
  };

  const reset = (source?: LocationSettings | null) => {
    const src = source ?? initial;
    if (!src) return;
    const next: PartialValues = {} as PartialValues;
    for (const k of keys) next[k] = src[k] as LocationSettings[K];
    setValues(next);
    setBaseline(next);
  };

  return { values, setField, isDirty, isPending, save, reset };
}

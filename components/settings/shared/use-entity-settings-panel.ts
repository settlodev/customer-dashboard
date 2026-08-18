"use client";

import { useMemo, useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import type { FormResponse } from "@/types/types";

/**
 * Shared controller for a section-level settings form, independent of *whose*
 * settings record is being edited (a location, a store, a warehouse…). Given
 * the keys this section owns and the persisted record, it exposes:
 *  - `values`: local edit state
 *  - `setField(name, value)`: typed setter
 *  - `isDirty`: true when local state diverges from persisted
 *  - `save()`: PUTs only the changed fields in this section
 *  - `reset()`: re-seed local state from the persisted object
 *
 * `save` is injected so the same controller drives every settings surface —
 * see `useSettingsPanel` (location) and `useStoreSettingsPanel` (store).
 */
export function useEntitySettingsPanel<T extends object, K extends keyof T>(
  keys: readonly K[],
  initial: T | null,
  persist: (patch: Partial<T>) => Promise<FormResponse<T>>,
  onSaved?: (next: T) => void,
) {
  type PartialValues = { [P in K]?: T[P] | null };

  const seed = useMemo<PartialValues>(() => {
    if (!initial) return {} as PartialValues;
    const out: PartialValues = {} as PartialValues;
    for (const k of keys) out[k] = initial[k] as T[K];
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

  const setField = <P extends K>(name: P, next: T[P] | null | undefined) => {
    setValues((prev) => ({ ...prev, [name]: next as T[P] }));
  };

  const save = () => {
    startTransition(async () => {
      const payload: Partial<T> = {};
      for (const k of keys) {
        const current = values[k];
        const prior = baseline[k];
        if ((current ?? null) === (prior ?? null)) continue;
        (payload as Record<string, unknown>)[k as string] = current ?? undefined;
      }
      if (Object.keys(payload).length === 0) return;

      const res = await persist(payload);
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
        for (const k of keys) refreshed[k] = res.data[k] as T[K];
        setValues(refreshed);
        setBaseline(refreshed);
        onSaved?.(res.data);
      }
    });
  };

  const reset = (source?: T | null) => {
    const src = source ?? initial;
    if (!src) return;
    const next: PartialValues = {} as PartialValues;
    for (const k of keys) next[k] = src[k] as T[K];
    setValues(next);
    setBaseline(next);
  };

  return { values, setField, isDirty, isPending, save, reset };
}

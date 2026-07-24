"use client";

import { updateLocationSettings } from "@/lib/actions/location-settings-actions";
import { updateStoreSettings } from "@/lib/actions/store-settings-actions";
import type { LocationSettings } from "@/types/location-settings/type";
import type { LocationSettingsUpdate } from "@/types/location-settings/schema";
import type { StoreSettings } from "@/types/store/type";
import { useEntitySettingsPanel } from "./use-entity-settings-panel";

/**
 * Section controller bound to the active LOCATION's settings record.
 * See {@link useEntitySettingsPanel} for the behaviour.
 */
export function useSettingsPanel<K extends keyof LocationSettings>(
  keys: readonly K[],
  initial: LocationSettings | null,
  onSaved?: (next: LocationSettings) => void,
) {
  return useEntitySettingsPanel<LocationSettings, K>(
    keys,
    initial,
    (patch) => updateLocationSettings(patch as LocationSettingsUpdate),
    onSaved,
  );
}

/**
 * Section controller bound to a STORE's settings record. `storeId` is optional
 * — omit it in store mode and the action resolves the active store cookie.
 */
export function useStoreSettingsPanel<K extends keyof StoreSettings>(
  keys: readonly K[],
  initial: StoreSettings | null,
  storeId?: string,
  onSaved?: (next: StoreSettings) => void,
) {
  return useEntitySettingsPanel<StoreSettings, K>(
    keys,
    initial,
    (patch) => updateStoreSettings(patch, storeId),
    onSaved,
  );
}

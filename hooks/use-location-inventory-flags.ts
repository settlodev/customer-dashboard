"use client";

import { useEffect, useState } from "react";
import { getLocationSettings } from "@/lib/actions/location-settings-actions";

export interface LocationInventoryFlags {
  autoReorderEnabled: boolean;
  enableLowStockAlerts: boolean;
}

let cached: LocationInventoryFlags | null = null;
let inFlight: Promise<LocationInventoryFlags> | null = null;

async function fetchFlags(): Promise<LocationInventoryFlags> {
  const settings = await getLocationSettings();
  return {
    autoReorderEnabled: settings?.autoReorderEnabled ?? false,
    enableLowStockAlerts: settings?.enableLowStockAlerts ?? false,
  };
}

/**
 * Client hook resolving the current location's `autoReorderEnabled` /
 * `enableLowStockAlerts` flags. Cached in module scope like
 * `useLocationCurrency`. Returns `null` until the first fetch resolves so
 * callers can distinguish "unknown yet" from "confirmed off".
 */
export function useLocationInventoryFlags(): LocationInventoryFlags | null {
  const [flags, setFlags] = useState<LocationInventoryFlags | null>(cached);

  useEffect(() => {
    if (cached) {
      setFlags(cached);
      return;
    }
    if (!inFlight) {
      inFlight = fetchFlags()
        .then((value) => {
          cached = value;
          return value;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    let cancelled = false;
    inFlight.then((value) => {
      if (!cancelled) setFlags(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return flags;
}

/** Update the cached flags after a successful patch, without a re-fetch. */
export function markLocationInventoryFlags(patch: Partial<LocationInventoryFlags>) {
  if (!cached) return;
  cached = { ...cached, ...patch };
}

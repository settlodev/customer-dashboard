"use client";

import { useEffect, useState } from "react";
import { getLocationConfig } from "@/lib/actions/location-config-actions";
import type { LocationConfig } from "@/types/location-config/type";

/**
 * Module-scope cache of the current location's config. Because this drives
 * UI feature gating, a couple of seconds of staleness is acceptable in
 * exchange for never re-fetching on every page mount.
 */
let cached: LocationConfig | null = null;
let inFlight: Promise<LocationConfig | null> | null = null;

export function useLocationConfig(): {
  config: LocationConfig | null;
  loading: boolean;
} {
  const [config, setConfig] = useState<LocationConfig | null>(cached);
  const [loading, setLoading] = useState<boolean>(cached == null);

  useEffect(() => {
    if (cached) {
      setConfig(cached);
      setLoading(false);
      return;
    }
    if (!inFlight) {
      inFlight = getLocationConfig()
        .then((value) => {
          cached = value;
          return value;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    let cancelled = false;
    inFlight
      .then((value) => {
        if (!cancelled) {
          setConfig(value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { config, loading };
}

export function resetLocationConfigCache() {
  cached = null;
  inFlight = null;
}

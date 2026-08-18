"use client";

import { useEffect, useState } from "react";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

let cachedCurrency: string | null = null;
let inFlight: Promise<string> | null = null;

/**
 * Client hook that resolves the current location's base currency. Results are
 * cached in module scope so switching between pages doesn't re-fetch settings.
 *
 * Returns `DEFAULT_CURRENCY` (TZS) while the first fetch is in flight to avoid
 * empty state in form defaults.
 */
export function useLocationCurrency(): string {
  const [currency, setCurrency] = useState<string>(cachedCurrency ?? DEFAULT_CURRENCY);

  useEffect(() => {
    if (cachedCurrency) {
      setCurrency(cachedCurrency);
      return;
    }
    if (!inFlight) {
      inFlight = getLocationCurrency()
        .then((value) => {
          cachedCurrency = value;
          return value;
        })
        .catch(() => DEFAULT_CURRENCY)
        .finally(() => {
          inFlight = null;
        });
    }
    let cancelled = false;
    inFlight.then((value) => {
      if (!cancelled) setCurrency(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return currency;
}

export function resetLocationCurrencyCache() {
  cachedCurrency = null;
  inFlight = null;
}

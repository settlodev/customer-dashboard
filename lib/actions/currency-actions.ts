"use server";

import { cache } from "react";
import { fetchLocationSettings } from "./settings-actions";
import { DEFAULT_CURRENCY } from "@/lib/helpers";

/**
 * Resolve the base currency for the currently-selected location. Mirrors the
 * backend `LocationCurrencyResolver` fallback — falls back to TZS when the
 * settings lookup fails or the value is blank.
 *
 * Cached per request so multiple callers in the same render don't hit the API.
 */
export const getLocationCurrency = cache(async (): Promise<string> => {
  try {
    const settings = await fetchLocationSettings();
    const currency =
      typeof settings?.currency === "string" && settings.currency.trim() !== ""
        ? settings.currency.trim().toUpperCase()
        : null;
    return currency ?? DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
});

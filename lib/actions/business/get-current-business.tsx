"use server";

import { cache } from "react";
import { parseStringify } from "@/lib/utils";
import { cookies } from "next/headers";
import { Business } from "@/types/business/type";
import ApiClient from "@/lib/settlo-api-client";
import { Location } from "@/types/location/type";
import { getBusiness } from "@/lib/actions/business/get";
import { signOut } from "@/auth";
import { fetchAllBusinesses } from "@/lib/actions/business-actions";
import { redirect } from "next/navigation";

// Deduped per request — multiple parallel callers in a single render share
// one cookie parse / one fallback fetch.
const _getCurrentBusiness = cache(async (): Promise<Business | undefined> => {
  try {
    // getCurrentBusiness runs inside Server Component renders (layouts,
    // pages) where cookie *mutation* throws. It must therefore stay
    // read-only — never delete or set cookies here. The currentBusiness
    // cookie is written only by refreshBusiness, a real Server Action.
    const cookieStore = await cookies();
    const raw = cookieStore.get("currentBusiness")?.value;

    // A freshly-deleted cookie reads back as an empty string within the
    // same request — e.g. right after clearBusiness() when its
    // revalidatePath re-renders this page. Guard it: JSON.parse("")
    // throws "Unexpected end of JSON input", which previously crashed the
    // whole select-location render and bounced the user to sign-out.
    if (raw && raw.trim()) {
      try {
        return JSON.parse(raw) as Business;
      } catch (error) {
        console.error("Failed to parse business cookie:", error);
        // Fall through to read-only recovery below — do NOT delete here.
      }
    }

    // No usable cookie — recover without writing anything.
    // 1) Resolve from the active location's businessId, if we have one.
    const currentLocation = await getCurrentLocation();
    if (currentLocation?.businessId) {
      const business = await getBusiness(currentLocation.businessId);
      if (business) return parseStringify(business);
    }

    // 2) Fall back to the account's businesses.
    const userBusinesses = await fetchAllBusinesses();
    if (!userBusinesses || userBusinesses.length === 0) {
      redirect("/business-registration");
    }
    if (userBusinesses.length === 1) {
      // Single business — return it directly. Persisting the cookie is
      // left to refreshBusiness so this stays render-safe.
      return userBusinesses[0];
    }
    // Several businesses and none selected — let the user choose.
    redirect("/select-business");
  } catch (error) {
    // redirect() throws NEXT_REDIRECT — it must propagate, not get
    // swallowed into a sign-out.
    if (
      error instanceof Error &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("Error in getting current business - logging out :", error);
    await signOut();
  }
});

export const getCurrentBusiness = async (): Promise<Business | undefined> => {
  return _getCurrentBusiness();
};

export const getCurrentLocation = async (): Promise<Location | undefined> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("currentLocation")?.value;

  // A freshly-deleted cookie reads back as an empty string within the same
  // request (e.g. mid business-switch). Guard before JSON.parse so we don't
  // log a noisy "Unexpected end of JSON input".
  if (!raw || !raw.trim()) return undefined;

  let location: Location;
  try {
    location = JSON.parse(raw) as Location;
  } catch (error) {
    console.error("Failed to parse location cookie:", error);
    return undefined;
  }

  // The active location MUST belong to the active business. After a business
  // switch the previous business's location cookie can briefly linger (and
  // revalidatePath re-renders the dashboard mid-switch). Serving it would
  // send a cross-business locationId to business-scoped services — the
  // Reports Service answers 403 "Not authorized to access location", which is
  // exactly the storm seen on switch. Treat a mismatch as "no active
  // location" so callers skip the scoped call instead of erroring.
  const businessId = await getCurrentBusinessId();
  if (businessId && location.businessId && location.businessId !== businessId) {
    return undefined;
  }

  return location;
};

/**
 * Lightweight, render-safe read of the *selected* business id from the
 * currentBusiness cookie — the canonical "which business is active" source
 * of truth (the same cookie ApiClient reads for the X-Business-Id header).
 * Returns null when nothing is selected or the cookie is empty/malformed.
 */
export const getCurrentBusinessId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("currentBusiness")?.value;
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { id?: string };
    return parsed?.id ?? null;
  } catch {
    return null;
  }
};

// Per-request memoisation only — `unstable_cache` can't be used here
// because `ApiClient` reads cookies (auth token, destination headers)
// inside its interceptors, and Next.js forbids dynamic data sources
// inside a cache scope. React's `cache()` dedupes parallel callers in
// a single render without touching cross-request storage.
//
// Returns `[]` when the user genuinely has no businesses. Throws on
// transport / auth failures so callers can distinguish "no data" from
// "couldn't reach the server" — the /select-business page in
// particular must not treat an API error as "no businesses created".
const _getBusinessDropDown = cache(async (): Promise<Business[]> => {
  const apiClient = new ApiClient();
  // /me/businesses is scoped server-side to what the caller can access
  // (owner → all; invited member → their subset) — one path for every user.
  const data = await apiClient.get<Business[] | null>(`/api/v1/me/businesses`);
  return parseStringify(data ?? []);
});

export const getBusinessDropDown = async (): Promise<Business[]> => {
  return _getBusinessDropDown();
};

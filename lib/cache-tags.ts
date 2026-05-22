/**
 * Centralised tag identifiers for the protected layout's
 * reference-data caches. Each fetcher in the layout's parallel
 * fan-out (businesses, locations, stores, warehouses, entitlements)
 * is wrapped in `unstable_cache` with one of these tags, and the
 * relevant mutation paths call `revalidateTag` so the cached list
 * picks up the change on the next render. The cache itself has a
 * short TTL (~60s) as a backstop in case a mutation site is missed.
 *
 * <p>Lives in a plain module rather than a "use server" file
 * because Next.js only lets a "use server" module export async
 * functions — non-function exports cause a build error.
 */
export const LAYOUT_TAGS = {
  businesses: "settlo:businesses",
  locations: "settlo:locations",
  stores: "settlo:stores",
  warehouses: "settlo:warehouses",
  entitlements: "settlo:entitlements",
} as const;

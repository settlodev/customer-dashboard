import { cache } from "react";

import { getMyPermissions } from "@/lib/actions/permissions-actions";

/**
 * Per-request memoized `/me` permission keys (`GET /api/v1/permissions/me`) —
 * the server-authoritative source the dashboard gates on. React `cache()` (NOT
 * `unstable_cache`, which would freeze the cookie-derived auth headers — see the
 * unstable_cache+ApiClient rule) dedupes the call so the layout, pages and route
 * guards in one request share a single Accounts round-trip.
 *
 * Returns `null` when `/me` is unavailable so callers can fall back to the JWT
 * claim (which is being retired) or fail open as appropriate.
 */
export const getMyPermissionsCached = cache(
  async (): Promise<string[] | null> => {
    try {
      return await getMyPermissions();
    } catch {
      return null;
    }
  },
);

/**
 * Whether the caller holds `reports:read_all` (location-wide reports), resolved
 * from `/me`. Fails OPEN when `/me` is unavailable — matches the prior
 * cookie-derived default and avoids zeroing an owner's reports on a transient
 * blip (an owner short a permission is the bug we must not reintroduce).
 */
export const hasReportsReadAll = cache(async (): Promise<boolean> => {
  const perms = await getMyPermissionsCached();
  if (perms === null) return true;
  return perms.includes("reports:read_all");
});

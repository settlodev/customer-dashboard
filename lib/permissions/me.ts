import { cache } from "react";

import { getMyPermissions } from "@/lib/actions/permissions-actions";
import { DASHBOARD_REPORTS_READ_ALL } from "@/lib/reports-access";

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
 * Whether the caller holds the dashboard all-reports tier
 * (`dashboard_reports:read_all`), resolved from `/me`. Gates the report-backed
 * cards on the home dashboard. Fails OPEN (via hasAnyPermissionOf) when `/me`
 * is unavailable.
 */
export const hasReportsReadAll = cache(async (): Promise<boolean> => {
  return hasAnyPermissionOf([DASHBOARD_REPORTS_READ_ALL]);
});

/**
 * Whether the caller holds ANY of the given permission keys, resolved from
 * `/me`. Fails OPEN when `/me` is unavailable — matches the prior
 * cookie-derived default and avoids zeroing an owner's reports on a transient
 * blip (an owner short a permission is the bug we must not reintroduce). The
 * backend gates remain the real enforcement.
 */
export const hasAnyPermissionOf = async (keys: string[]): Promise<boolean> => {
  const perms = await getMyPermissionsCached();
  if (perms === null) return true;
  return keys.some((key) => perms.includes(key));
};

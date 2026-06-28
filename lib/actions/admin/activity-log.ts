"use server";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import { omsInternalGet } from "@/lib/oms-internal-client";
import { parseStringify } from "@/lib/utils";
import type {
  ClientActivityPage,
  ListClientActivityParams,
} from "@/types/admin/activity-log";

/**
 * Browse the OMS `client_activity` audit stream cross-location. Hits the
 * internal-secret-gated OMS endpoint via {@link omsInternalGet} (no JWT).
 * Page is 0-indexed here — the page component maps the DataTable's
 * 1-indexed `?page` down (same convention as the accounts action).
 */
export async function listClientActivity(
  params: ListClientActivityParams = {},
): Promise<ClientActivityPage> {
  await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
  const query: Record<string, string | number | undefined> = {
    page: Math.max(0, params.page ?? 0),
    size: params.size ?? 20,
    // Free-text search maps to the OMS `order` param (UUID → exact target_id,
    // otherwise a case-insensitive order_number substring trace).
    order: params.search?.trim() || undefined,
    locationId: params.locationId || undefined,
    deviceId: params.deviceId || undefined,
    staffId: params.staffId || undefined,
    eventType: params.eventType || undefined,
    from: params.from || undefined,
    to: params.to || undefined,
  };

  const data = await omsInternalGet<ClientActivityPage>(
    "/api/v1/admin/client-activity",
    query,
  );
  return parseStringify(data);
}

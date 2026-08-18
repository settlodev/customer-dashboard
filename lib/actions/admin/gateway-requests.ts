"use server";

import { requireOperatorPermission } from "@/lib/admin/operator-auth";
import { PERM } from "@/lib/admin/permissions";
import { activitiesInternalGet } from "@/lib/activities-internal-client";
import { parseStringify } from "@/lib/utils";
import type {
  GatewayRequestPage,
  ListGatewayRequestsParams,
} from "@/types/admin/gateway-requests";

/**
 * Tail of raw requests passing through the API gateway (routing/config
 * diagnostics), not the OMS business-activity stream. Hits the Activities
 * service via {@link activitiesInternalGet} — the client view polls this on
 * an interval to drive the live tail, so the shared secret (once issued)
 * never leaves the server.
 */
export async function listGatewayRequests(
  params: ListGatewayRequestsParams = {},
): Promise<GatewayRequestPage> {
  await requireOperatorPermission(PERM.ACTIVITY_LOG_READ);
  const data = await activitiesInternalGet<GatewayRequestPage>(
    "/api/v1/gateway-requests",
    {
      page: Math.max(0, params.page ?? 0),
      size: params.size ?? 20,
      upstreamServerName: params.upstreamServerName || undefined,
      httpMethod: params.httpMethod || undefined,
      upstreamStatusCode: params.upstreamStatusCode ?? undefined,
      hasUpstreamError: params.hasUpstreamError ?? undefined,
    },
  );
  return parseStringify(data);
}

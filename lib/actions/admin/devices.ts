"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { AdminDeviceSummary } from "@/types/admin/device";

function staffClient() {
  return new ApiClient("accounts", "staff");
}

/**
 * Look up a single device by id via the Accounts admin endpoint
 * `GET /api/v1/admin/devices/{deviceId}`.
 *
 * Best-effort: returns `null` on any error (404, network, endpoint not yet
 * deployed, etc.) so callers can fall back gracefully without blocking the UI.
 */
export async function getAdminDevice(
  deviceId: string,
): Promise<AdminDeviceSummary | null> {
  try {
    const data = await staffClient().get<AdminDeviceSummary>(
      `/api/v1/admin/devices/${encodeURIComponent(deviceId)}`,
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

"use server";

import ApiClient from "@/lib/settlo-api-client";

const BASE = "/api/v1/devices/push-tokens";

/**
 * Registers (upserts) this browser's FCM token as an OWNER_APP device on the
 * Communications Service. Scope (business/user) is resolved server-side from the JWT.
 */
export async function registerPushToken(input: {
  fcmToken: string;
  deviceId: string;
  appVersion?: string;
}): Promise<{ ok: boolean }> {
  try {
    const apiClient = new ApiClient("communications");
    await apiClient.post(BASE, {
      fcmToken: input.fcmToken,
      platform: "WEB",
      deviceId: input.deviceId,
      appVersion: input.appVersion ?? null,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Removes this browser's OWNER_APP token (by deviceId) on the Communications Service. */
export async function deletePushToken(deviceId: string): Promise<{ ok: boolean }> {
  try {
    const apiClient = new ApiClient("communications");
    await apiClient.delete(`${BASE}/${encodeURIComponent(deviceId)}`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

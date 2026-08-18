"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getCurrentBusinessId } from "@/lib/actions/business/get-current-business";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { OwnerNotification } from "@/types/notification";

const comms = () => new ApiClient("communications");

const emptyNotificationPage = (
  page: number,
  size: number,
): ApiResponse<OwnerNotification> =>
  ({
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: page,
    size,
    first: true,
    last: true,
  }) as unknown as ApiResponse<OwnerNotification>;

export async function getUnreadCount(): Promise<number> {
  // Defense in depth: the communications service requires a `business_id` JWT
  // claim, which only exists once a business is selected. The notification
  // providers are scoped to the authenticated shells (see
  // AppNotificationProviders), so this shouldn't be called pre-selection — but
  // guard anyway so any stray/early caller no-ops instead of 400ing ("Missing
  // required JWT claim: business_id"). currentBusiness is the same cookie
  // ApiClient reads for the X-Business-Id header, so it tracks the claim.
  if (!(await getCurrentBusinessId())) return 0;
  try {
    const data = await comms().get<{ count: number }>(
      "/api/v1/notifications/unread-count",
    );
    return data?.count ?? 0;
  } catch (error) {
    console.error("getUnreadCount failed", error);
    return 0;
  }
}

export async function listNotifications(
  page = 0,
  size = 20,
): Promise<ApiResponse<OwnerNotification>> {
  // No active business → no business_id claim → comm 400s. See getUnreadCount.
  if (!(await getCurrentBusinessId())) return emptyNotificationPage(page, size);
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const data = await comms().get<ApiResponse<OwnerNotification>>(
      `/api/v1/notifications?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listNotifications failed", error);
    return emptyNotificationPage(page, size);
  }
}

export async function markRead(id: string): Promise<{ ok: boolean }> {
  try {
    await comms().post(`/api/v1/notifications/${id}/read`, {});
    return { ok: true };
  } catch (error) {
    console.error("markRead failed", error);
    return { ok: false };
  }
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  try {
    await comms().post("/api/v1/notifications/read-all", {});
    return { ok: true };
  } catch (error) {
    console.error("markAllRead failed", error);
    return { ok: false };
  }
}

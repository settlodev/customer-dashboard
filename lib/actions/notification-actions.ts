"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse } from "@/types/types";
import { OwnerNotification } from "@/types/notification";

const comms = () => new ApiClient("communications");

export async function getUnreadCount(): Promise<number> {
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
  try {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    const data = await comms().get<ApiResponse<OwnerNotification>>(
      `/api/v1/notifications?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("listNotifications failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: page,
      size,
      first: true,
      last: true,
    } as unknown as ApiResponse<OwnerNotification>;
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

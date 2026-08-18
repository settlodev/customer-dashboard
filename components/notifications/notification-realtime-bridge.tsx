"use client";

import { useCallback } from "react";

import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useNotifications } from "@/context/notificationContext";

export function NotificationRealtimeBridge({
  businessId,
}: {
  businessId?: string;
}) {
  const { applyIncoming } = useNotifications();
  const handler = useCallback(() => applyIncoming(), [applyIncoming]);
  useRealtimeChannel(
    businessId ? `business:${businessId}:notifications` : null,
    handler,
  );
  return null;
}

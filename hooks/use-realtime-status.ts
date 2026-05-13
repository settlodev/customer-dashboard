"use client";

import { useEffect, useState } from "react";

import { getGatewayClient } from "@/lib/realtime/gateway-client";
import type { RealtimeStatus } from "@/lib/realtime/types";

/**
 * Read the live status of the singleton gateway connection. Returns
 * "idle" before the first connect attempt; components can use this to
 * surface a Live / Reconnecting / Offline indicator and to trigger a
 * polling fallback when the socket gives up.
 */
export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const client = getGatewayClient();
      return client.onStatusChange(setStatus);
    } catch {
      // NEXT_PUBLIC_WEBSOCKET_GATEWAY_URL not configured — stay idle so
      // pages still render and any polling fallback can take over.
      return;
    }
  }, []);

  return status;
}

"use client";

import { useEffect, useRef } from "react";

import { getGatewayClient } from "@/lib/realtime/gateway-client";

/**
 * Run {@code onReconnect} whenever the realtime socket RE-connects after a drop
 * (not on the first connect). USER (dashboard) sessions get no server-side
 * replay, so a live surface can silently go stale for anything that changed
 * while the socket was down — this is how it catches up (e.g. a
 * {@code router.refresh()} or a client refetch).
 */
export function useRealtimeReconnect(onReconnect: () => void): void {
  const cbRef = useRef(onReconnect);
  cbRef.current = onReconnect;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const client = getGatewayClient();
      return client.onReconnect(() => cbRef.current());
    } catch {
      // NEXT_PUBLIC_WEBSOCKET_GATEWAY_URL not configured — no-op (matches
      // useRealtimeStatus): the app still renders and polling can take over.
      return;
    }
  }, []);
}

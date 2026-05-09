"use client";

import { useEffect, useRef } from "react";
import { getGatewayClient } from "@/lib/realtime/gateway-client";
import type { ChannelHandler, WsMessage } from "@/lib/realtime/types";

/**
 * Subscribe to one or more gateway channels and run {@code handler}
 * for every event arriving on any of them.
 *
 * <p>Pass a stable {@code handler} (memoized via {@code useCallback})
 * or accept that subscribing/unsubscribing on every render is fine —
 * the underlying client de-dupes via a per-channel ref count, so
 * multiple subscribers are cheap. Channel changes (new id list) tear
 * down old subscriptions and re-issue.
 *
 * <p>Empty / null channels are ignored, so it's safe to call this
 * with channels that are still loading: the hook starts subscribing
 * the moment the array becomes non-empty.
 */
export function useRealtimeChannel<P = unknown>(
  channels: (string | null | undefined)[] | string | null | undefined,
  handler: ChannelHandler<P>,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const list = (Array.isArray(channels) ? channels : [channels])
    .filter((c): c is string => typeof c === "string" && c.length > 0);
  const key = list.slice().sort().join("|");

  useEffect(() => {
    if (!key) return;
    const client = getGatewayClient();
    const wrapped: ChannelHandler = (msg: WsMessage) => {
      handlerRef.current(msg as WsMessage<P>);
    };
    const unsubscribers = list.map((c) => client.subscribe(c, wrapped));
    void client.connect();
    return () => {
      for (const u of unsubscribers) u();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

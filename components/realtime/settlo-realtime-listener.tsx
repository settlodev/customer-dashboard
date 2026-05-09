"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import type { WsMessage } from "@/lib/realtime/types";

/**
 * Mounted once at the layout level — stays alive across navigation,
 * sharing the singleton WebSocket connection. On any event arriving
 * on a subscribed channel, triggers a Next.js {@code router.refresh()}
 * (debounced 500 ms) so server-rendered pages re-fetch without
 * unmounting client state.
 *
 * <p>Channels are passed in directly so the same component can serve
 * inventory ({@code location:{id}:inventory}), orders, cash, etc. The
 * WebSocket Gateway partitions events by channel, so an event arriving
 * on {@code :inventory} is by definition inventory-related — filtering
 * by event type is only useful to narrow further on heavy pages.
 */
export function SettloRealtimeListener({
  channels,
  eventTypes,
}: {
  channels: string[];
  eventTypes?: ReadonlySet<string>;
}) {
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handler = useCallback(
    (msg: WsMessage) => {
      if (eventTypes && !eventTypes.has(msg.type)) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.refresh();
      }, 500);
    },
    [router, eventTypes],
  );

  useRealtimeChannel(channels, handler);
  return null;
}

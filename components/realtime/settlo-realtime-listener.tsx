"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import type { WsMessage } from "@/lib/realtime/types";

/**
 * Mounted once at the layout level — stays alive across navigation,
 * sharing the singleton WebSocket connection. On any event arriving
 * on a subscribed channel, triggers a Next.js {@code router.refresh()}
 * so server-rendered pages re-fetch without unmounting client state.
 *
 * <p>Refresh cadence is throttled to at most one call per
 * {@link COOLDOWN_MS}. The original 500ms trailing debounce coalesced
 * a single burst nicely but did nothing to cap sustained activity —
 * a busy POS feed could still drive `router.refresh()` ~twice a
 * second, and each refresh re-runs the protected layout's ~5
 * parallel reference-data fetches plus the active page's own server
 * fetches, which is enough to start tripping the upstream gateway's
 * per-second rate limit. With the throttle, an event arriving in a
 * quiet window fires a refresh immediately (leading edge); events
 * during the cooldown coalesce into a single follow-up refresh at
 * the end of the cooldown, so the screen never stalls but cannot
 * thrash either.
 *
 * <p>Channels are passed in directly so the same component can serve
 * inventory ({@code location:{id}:inventory}), orders, cash, etc. The
 * WebSocket Gateway partitions events by channel, so an event arriving
 * on {@code :inventory} is by definition inventory-related — filtering
 * by event type is only useful to narrow further on heavy pages.
 */
const COOLDOWN_MS = 5_000;

export function SettloRealtimeListener({
  channels,
  eventTypes,
}: {
  channels: string[];
  eventTypes?: ReadonlySet<string>;
}) {
  const router = useRouter();
  const lastRefreshAtRef = useRef<number>(0);
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handler = useCallback(
    (msg: WsMessage) => {
      if (eventTypes && !eventTypes.has(msg.type)) return;
      if (pendingRefreshRef.current) return;
      const elapsed = Date.now() - lastRefreshAtRef.current;
      const delay = Math.max(0, COOLDOWN_MS - elapsed);
      pendingRefreshRef.current = setTimeout(() => {
        pendingRefreshRef.current = null;
        lastRefreshAtRef.current = Date.now();
        router.refresh();
      }, delay);
    },
    [router, eventTypes],
  );

  useEffect(() => {
    return () => {
      if (pendingRefreshRef.current) {
        clearTimeout(pendingRefreshRef.current);
        pendingRefreshRef.current = null;
      }
    };
  }, []);

  useRealtimeChannel(channels, handler);
  return null;
}

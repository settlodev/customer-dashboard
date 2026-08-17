"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeReconnect } from "@/hooks/use-realtime-reconnect";
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
  const pathname = usePathname();
  const lastRefreshAtRef = useRef<number>(0);
  const pendingRefreshRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handler = useCallback(
    (msg: WsMessage) => {
      // Billing data is not affected by inventory or customer events. Refreshing here re-ran the
      // layout AND the billing page — eight billing requests per refresh, every 5s, which is what
      // exhausted the account's rate-limit budget. Billing mutations already call router.refresh()
      // from their own dialogs, and payment confirmation is handled by usePaymentPolling.
      if (pathname?.startsWith("/billing")) return;
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
    [router, eventTypes, pathname],
  );

  useEffect(() => {
    return () => {
      if (pendingRefreshRef.current) {
        clearTimeout(pendingRefreshRef.current);
        pendingRefreshRef.current = null;
      }
    };
  }, []);

  // On reconnect, catch up on whatever changed while the socket was down. USER
  // sessions get no server-side replay, so without this the server-rendered
  // tree stays stale until a later live event happens to touch it. Stamp
  // lastRefreshAt so a burst of events right after reconnect doesn't double-fire.
  useRealtimeReconnect(() => {
    if (pathname?.startsWith("/billing")) return;
    lastRefreshAtRef.current = Date.now();
    router.refresh();
  });

  useRealtimeChannel(channels, handler);
  return null;
}

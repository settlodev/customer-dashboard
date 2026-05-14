"use client";

import { useCallback, useRef } from "react";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { invalidateStocksCache } from "@/lib/cache/reference-data";

/**
 * Invalidates the client-side stocks cache when inventory events arrive on
 * the gateway. Lives next to {@link SettloRealtimeListener} in the protected
 * layout so it shares the singleton WebSocket connection.
 *
 * Throttled with a 30-second leading-edge cooldown: the first event in a
 * window invalidates immediately, subsequent events for 30 seconds are
 * dropped. A busy restaurant can emit dozens of inventory events per minute
 * from POS sales — without the cooldown, the cache would thrash on every
 * sale and the next picker open would re-fetch all 5,000 stocks. With it,
 * we get the freshness of "cleared within 30 seconds of a real change"
 * without paying that re-fetch cost more than twice a minute.
 *
 * Local mutations (this user's own stock edits) bypass this binder entirely
 * — they call {@link invalidateStocksCache} synchronously from the
 * mutation success handlers, so the cache reflects the change instantly.
 */
const COOLDOWN_MS = 30_000;

export function StockCacheRealtimeBinder({
  locationId,
}: {
  locationId?: string | null;
}) {
  const lastInvalidatedAtRef = useRef<number>(0);

  const handler = useCallback(() => {
    const now = Date.now();
    if (now - lastInvalidatedAtRef.current < COOLDOWN_MS) return;
    lastInvalidatedAtRef.current = now;
    invalidateStocksCache();
  }, []);

  useRealtimeChannel(
    locationId ? `location:${locationId}:inventory` : null,
    handler,
  );

  return null;
}

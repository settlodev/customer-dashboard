"use client";

import { useCallback, useRef } from "react";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { invalidateCustomersCache } from "@/lib/cache/reference-data";

/**
 * Mirrors {@link StockCacheRealtimeBinder} for customers. Subscribes to the
 * business-wide customers channel (the same one the
 * {@link SettloRealtimeListener} already uses for `router.refresh()`) and
 * clears the client-side customers cache on events.
 *
 * 30-second leading-edge cooldown so a busy POS / orders feed can't thrash
 * the cache — local mutations from this user already call
 * {@link invalidateCustomersCache} directly, so this binder only catches
 * cross-session changes.
 */
const COOLDOWN_MS = 30_000;

export function CustomerCacheRealtimeBinder({
  businessId,
}: {
  businessId?: string | null;
}) {
  const lastInvalidatedAtRef = useRef<number>(0);

  const handler = useCallback(() => {
    const now = Date.now();
    if (now - lastInvalidatedAtRef.current < COOLDOWN_MS) return;
    lastInvalidatedAtRef.current = now;
    invalidateCustomersCache();
  }, []);

  useRealtimeChannel(
    businessId ? `business:${businessId}:customers` : null,
    handler,
  );

  return null;
}

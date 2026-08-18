"use client";

import { useCallback, useRef } from "react";
import { useRealtimeChannel } from "./use-realtime-channel";

/**
 * Subscribes to the location's inventory channel and runs {@code onEvent}
 * with a leading-edge cooldown so a POS-driven event burst (one event per
 * sale on a busy restaurant) doesn't refetch on every tick.
 *
 * Intended for open forms that display balances and need to reflect intakes
 * / sales / adjustments happening elsewhere. Each consumer manages its own
 * fetch — this hook only decides _when_ to call it.
 *
 * 10-second cooldown is the default because users actively read these
 * numbers while filling the form; if a balance changed elsewhere, we want
 * to surface it within a few seconds rather than waiting on the user to
 * refresh.
 */
export function useInventoryEventRefresh(
  locationId: string | null | undefined,
  onEvent: () => void,
  cooldownMs: number = 10_000,
): void {
  const lastRanRef = useRef<number>(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const handler = useCallback(() => {
    const now = Date.now();
    if (now - lastRanRef.current < cooldownMs) return;
    lastRanRef.current = now;
    onEventRef.current();
  }, [cooldownMs]);

  useRealtimeChannel(
    locationId ? `location:${locationId}:inventory` : null,
    handler,
  );
}

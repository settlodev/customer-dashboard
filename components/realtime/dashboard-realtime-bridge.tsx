"use client";

import { useCallback, useEffect, useRef } from "react";

import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import type { WsMessage } from "@/lib/realtime/types";

/**
 * Brings the dashboard's sales surface live. The big cards + the sales
 * KPI strip + the charts are all fed by a client-side fetch of the
 * Reports Service overview (so they react to the date picker), which
 * means the layout-level {@code SettloRealtimeListener}'s
 * {@code router.refresh()} can't update them — that only re-runs server
 * components. So this bridge subscribes to the location's {@code :orders}
 * channel (the gateway funnels {@code ORDER_*}, {@code REFUND_*} and
 * {@code PAYMENT_TRANSACTION_*} topics there) and calls {@code onRefresh}
 * — the parent's overview refetch — on every relevant event.
 *
 * <p>Resilience mirrors {@code OrdersRealtimeBridge}:
 * <ul>
 *   <li>Bursts coalesce into one refetch via a 700 ms debounce.</li>
 *   <li>When the socket gives up (status {@code fallback}/{@code
 *       disconnected}) a 15 s polling loop keeps the numbers fresh.</li>
 *   <li>The singleton WebSocket is shared with the layout listener, so
 *       this doesn't open a second connection.</li>
 * </ul>
 *
 * <p>Inventory/prepayment are server-rendered and already refreshed by
 * the layout listener on {@code :inventory}, so this bridge deliberately
 * does not also call {@code router.refresh()} (avoids doubling the
 * upstream gateway load). Renders nothing.
 */
const SALES_EVENT_PREFIXES = [
  "ORDER_",
  "REFUND_",
  "PAYMENT_TRANSACTION_",
] as const;

const COALESCE_DEBOUNCE_MS = 700;
const FALLBACK_POLL_MS = 15_000;

type Props = {
  locationId: string;
  /** The parent's overview refetch, run on relevant order events. */
  onRefresh: () => void;
};

export function DashboardRealtimeBridge({ locationId, onRefresh }: Props) {
  const status = useRealtimeStatus();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest callback without re-subscribing on every render.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const handler = useCallback((msg: WsMessage<Record<string, unknown>>) => {
    const type = msg.type ?? "";
    if (!SALES_EVENT_PREFIXES.some((p) => type.startsWith(p))) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onRefreshRef.current();
    }, COALESCE_DEBOUNCE_MS);
  }, []);

  useRealtimeChannel(`location:${locationId}:orders`, handler);

  // Polling fallback — only when the socket can't recover.
  useEffect(() => {
    if (status !== "fallback" && status !== "disconnected") return;
    const interval = setInterval(() => {
      onRefreshRef.current();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [status]);

  // Clear any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return null;
}

export default DashboardRealtimeBridge;

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import type { WsMessage } from "@/lib/realtime/types";

/**
 * Mounts on the orders list and order detail pages to bring them
 * live. Subscribes to the location's {@code :orders} channel — the
 * gateway funnels {@code ORDER_*}, {@code REFUND_*} and
 * {@code ORDER_TRANSACTION_*} Kafka topics into that channel — and
 * triggers a Next.js {@code router.refresh()} on every relevant event
 * so the server-rendered tree pulls fresh data without unmounting
 * client state.
 *
 * <p>Resilience strategy:
 * <ul>
 *   <li>Bursts of events coalesce into a single refresh via a 700 ms
 *       debounce (200 ms on a detail page so individual order changes
 *       feel instantaneous).</li>
 *   <li>When the underlying socket gives up — status flips to
 *       {@code fallback} or {@code disconnected} — we kick off a 15 s
 *       polling loop so the screen self-heals even without WS.</li>
 *   <li>The same singleton WebSocket is shared with the layout-level
 *       listener (inventory, customers), so adding orders here doesn't
 *       open a second connection.</li>
 * </ul>
 *
 * <p>Renders nothing — it's a pure side-effect component. Mount it
 * anywhere inside the order pages' React tree.
 */
const ORDER_EVENT_PREFIXES = [
  "ORDER_",
  "REFUND_",
  "PAYMENT_TRANSACTION_",
] as const;

const COALESCE_DEBOUNCE_MS = 700;
const QUICK_DEBOUNCE_MS = 200;
const FALLBACK_POLL_MS = 15_000;

type Props = {
  locationId: string;
  /**
   * When set, the bridge only refreshes for events whose payload
   * touches this order id ({@code payload.id} for ORDER_*,
   * {@code payload.orderId} for transactions and refunds). Use on the
   * detail page; leave undefined on the list page.
   */
  orderId?: string;
};

export function OrdersRealtimeBridge({ locationId, orderId }: Props) {
  const router = useRouter();
  const status = useRealtimeStatus();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handler = useCallback(
    (msg: WsMessage<Record<string, unknown>>) => {
      const type = msg.type ?? "";
      if (!ORDER_EVENT_PREFIXES.some((p) => type.startsWith(p))) return;

      if (orderId) {
        const payload = msg.payload ?? {};
        const payloadOrderId =
          (typeof payload.id === "string" ? payload.id : undefined) ??
          (typeof payload.orderId === "string" ? payload.orderId : undefined);
        if (payloadOrderId !== orderId) return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      const delay = orderId ? QUICK_DEBOUNCE_MS : COALESCE_DEBOUNCE_MS;
      debounceRef.current = setTimeout(() => {
        router.refresh();
      }, delay);
    },
    [orderId, router],
  );

  useRealtimeChannel(`location:${locationId}:orders`, handler);

  // Polling fallback. Kicks in only when the socket can't recover.
  useEffect(() => {
    if (status !== "fallback" && status !== "disconnected") return;
    const interval = setInterval(() => {
      router.refresh();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [status, router]);

  // Clear pending debounce on unmount so a refresh doesn't fire after
  // the user navigates away.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return null;
}

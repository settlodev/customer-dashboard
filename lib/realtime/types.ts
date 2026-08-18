/**
 * On-the-wire envelope used by the Settlo WebSocket Gateway. Mirrors
 * `co.tz.settlo.wsgateway.model.WsMessage` on the server.
 */
export interface WsMessage<P = unknown> {
  id?: string;
  type: string;
  version?: string;
  timestamp?: string;
  source?: "server" | "client";
  locationId?: string | null;
  staffId?: string | null;
  deviceId?: string | null;
  correlationId?: string | null;
  sequence?: number | null;
  payload?: P;
  meta?: Record<string, unknown>;
}

/**
 * Connection status surfaced by the realtime client. Components can
 * render this as a "live / reconnecting / offline" badge and decide
 * whether to fall back to polling.
 */
export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "fallback";

/** Subscription handler shape. Receives the raw WsMessage frame. */
export type ChannelHandler<P = unknown> = (message: WsMessage<P>) => void;

/** Result returned to the client when SUBSCRIBE completes. */
export interface SubscribeResultPayload {
  granted: string[];
  denied: { channel: string; reason: string }[];
}

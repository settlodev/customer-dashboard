import type {
  ChannelHandler,
  RealtimeStatus,
  SubscribeResultPayload,
  WsMessage,
} from "./types";

/**
 * Client for the Settlo WebSocket Gateway.
 *
 * <p>Single connection per browser tab is shared across every
 * component that calls {@link subscribe}. Subscriptions are
 * reference-counted: `subscribe` returns an `unsubscribe()` and the
 * underlying SUBSCRIBE/UNSUBSCRIBE frames are only sent when the ref
 * count for that channel hits zero. This lets independent screens
 * subscribe to the same channel without stepping on each other.
 *
 * <p>Reconnect uses exponential backoff with jitter, capped at 30 s.
 * After {@link FALLBACK_AFTER_FAILED_ATTEMPTS} consecutive failed
 * attempts the status flips to {@code fallback} and the component
 * tree is expected to switch to manual refresh / polling. We keep
 * trying in the background so connectivity returns automatically
 * without the user having to do anything.
 *
 * <p>Server-spec: this client speaks the gateway's bespoke JSON
 * protocol — frames are {type, payload, ...} as defined by
 * `WsMessage` on the server. Not STOMP.
 */

const HEARTBEAT_INTERVAL_MS = 25_000;
const FALLBACK_AFTER_FAILED_ATTEMPTS = 3;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_500;

interface SubscriptionEntry {
  refCount: number;
  handlers: Set<ChannelHandler>;
}

interface PendingSubscribe {
  resolve: (granted: string[], denied: SubscribeResultPayload["denied"]) => void;
  channels: string[];
  timer: ReturnType<typeof setTimeout>;
}

export class GatewayClient {
  private socket: WebSocket | null = null;
  private url: string;
  private tokenProvider: () => Promise<string | null>;

  private status: RealtimeStatus = "idle";
  private statusListeners = new Set<(s: RealtimeStatus) => void>();

  private subscriptions = new Map<string, SubscriptionEntry>();
  private pendingSubscribes = new Map<string, PendingSubscribe>();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private explicitlyClosed = false;
  private connecting: Promise<void> | null = null;

  constructor(url: string, tokenProvider: () => Promise<string | null>) {
    this.url = url;
    this.tokenProvider = tokenProvider;
  }

  // ── Public API ─────────────────────────────────────────────────

  getStatus(): RealtimeStatus {
    return this.status;
  }

  onStatusChange(listener: (s: RealtimeStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  /**
   * Subscribe a handler to a channel. Returns an unsubscribe.
   * Multiple subscribers to the same channel share a single
   * server-side SUBSCRIBE; the SUBSCRIBE frame is sent on the
   * first subscriber and UNSUBSCRIBE on the last.
   */
  subscribe<P = unknown>(channel: string, handler: ChannelHandler<P>): () => void {
    let entry = this.subscriptions.get(channel);
    if (!entry) {
      entry = { refCount: 0, handlers: new Set() };
      this.subscriptions.set(channel, entry);
    }
    entry.refCount += 1;
    entry.handlers.add(handler as ChannelHandler);

    if (entry.refCount === 1) {
      this.ensureConnected().then(() => this.sendSubscribe([channel]));
    }

    return () => {
      const e = this.subscriptions.get(channel);
      if (!e) return;
      e.handlers.delete(handler as ChannelHandler);
      e.refCount -= 1;
      if (e.refCount <= 0) {
        this.subscriptions.delete(channel);
        if (this.isOpen()) {
          this.sendFrame({ type: "UNSUBSCRIBE", payload: { channels: [channel] } });
        }
      }
    };
  }

  connect(): Promise<void> {
    this.explicitlyClosed = false;
    return this.ensureConnected();
  }

  close(): void {
    this.explicitlyClosed = true;
    this.cancelReconnect();
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  // ── Connection lifecycle ───────────────────────────────────────

  private async ensureConnected(): Promise<void> {
    if (this.isOpen()) return;
    if (this.connecting) return this.connecting;
    this.connecting = this.openSocket().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private async openSocket(): Promise<void> {
    const token = await this.tokenProvider();
    if (!token) {
      this.setStatus("disconnected");
      throw new Error("No auth token available");
    }

    this.setStatus(
      this.reconnectAttempt > 0 ? "reconnecting" : "connecting",
    );

    return new Promise<void>((resolve, reject) => {
      let socket: WebSocket;
      try {
        socket = new WebSocket(this.url);
      } catch (e) {
        this.scheduleReconnect();
        reject(e);
        return;
      }
      this.socket = socket;

      socket.onopen = () => {
        this.sendFrame({
          type: "CONNECT",
          payload: { token },
        });
      };

      socket.onmessage = (event) => {
        let message: WsMessage;
        try {
          message = JSON.parse(event.data as string);
        } catch {
          return;
        }
        this.handleFrame(message, () => {
          // Resolve the connect promise once the server has
          // acknowledged us — at that point status flips to
          // "connected" and inflight subscribes can flush.
          resolve();
        });
      };

      socket.onerror = () => {
        // Errors are followed by close; let onclose drive reconnect.
      };

      socket.onclose = () => {
        this.stopHeartbeat();
        this.socket = null;
        if (this.explicitlyClosed) {
          this.setStatus("disconnected");
          return;
        }
        this.scheduleReconnect();
      };
    });
  }

  private handleFrame(message: WsMessage, onConnected: () => void): void {
    switch (message.type) {
      case "CONNECTED": {
        this.reconnectAttempt = 0;
        this.setStatus("connected");
        this.startHeartbeat();
        // Re-issue all current subscriptions in one frame after
        // (re)connect so a flap doesn't lose listeners.
        const channels = Array.from(this.subscriptions.keys());
        if (channels.length > 0) this.sendSubscribe(channels);
        onConnected();
        return;
      }
      case "HEARTBEAT":
        return;
      case "SUBSCRIBE_RESULT": {
        const payload = message.payload as SubscribeResultPayload | undefined;
        if (!payload) return;
        // Resolve any pending subscribe Promises that match.
        for (const channel of [...payload.granted,
                                ...payload.denied.map((d) => d.channel)]) {
          const pending = this.pendingSubscribes.get(channel);
          if (pending) {
            clearTimeout(pending.timer);
            this.pendingSubscribes.delete(channel);
            pending.resolve(payload.granted, payload.denied);
          }
        }
        // Surface denials to subscribers via a console warning. The
        // app-level fallback is to keep showing server-rendered data
        // and let the user refresh manually.
        if (payload.denied.length > 0) {
          console.warn(
            "[realtime] subscription denied",
            payload.denied,
          );
        }
        return;
      }
      case "ERROR":
        console.warn("[realtime] gateway error", message.payload);
        return;
      default: {
        // Domain event — fan to every handler on the message's channel.
        // The server's WsMessage doesn't carry the channel name, so we
        // walk handlers and let the application decide what's relevant
        // based on `type` and `locationId`/`staffId`/`deviceId` claims.
        for (const [, entry] of this.subscriptions) {
          for (const handler of entry.handlers) {
            try {
              handler(message);
            } catch (e) {
              console.error("[realtime] handler threw", e);
            }
          }
        }
      }
    }
  }

  private sendSubscribe(channels: string[]): void {
    if (!this.isOpen()) return;
    this.sendFrame({ type: "SUBSCRIBE", payload: { channels } });
  }

  private sendFrame(frame: WsMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    try {
      this.socket.send(JSON.stringify(frame));
    } catch (e) {
      console.error("[realtime] send failed", e);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendFrame({ type: "HEARTBEAT", payload: {} });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.explicitlyClosed) return;
    this.reconnectAttempt += 1;

    if (this.reconnectAttempt >= FALLBACK_AFTER_FAILED_ATTEMPTS) {
      this.setStatus("fallback");
    } else {
      this.setStatus("reconnecting");
    }

    const exp = Math.min(
      MAX_RECONNECT_DELAY_MS,
      BASE_RECONNECT_DELAY_MS * Math.pow(1.7, this.reconnectAttempt - 1),
    );
    const jitter = Math.random() * 0.3 * exp;
    const delay = Math.floor(exp + jitter);

    this.cancelReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.openSocket().catch(() => {
        // openSocket already scheduled the next attempt via onclose;
        // nothing to do here.
      });
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(next: RealtimeStatus): void {
    if (next === this.status) return;
    this.status = next;
    for (const listener of this.statusListeners) {
      try {
        listener(next);
      } catch (e) {
        console.error("[realtime] status listener threw", e);
      }
    }
  }

  private isOpen(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// ── Singleton wiring ─────────────────────────────────────────────

let singleton: GatewayClient | null = null;

/**
 * Browser-tab-wide singleton. Fetches the JWT once via
 * /api/realtime/token and caches it for the lifetime of the
 * connection. On reconnect we re-fetch in case the token has been
 * rotated.
 */
export function getGatewayClient(): GatewayClient {
  if (typeof window === "undefined") {
    throw new Error("getGatewayClient called on the server");
  }
  if (singleton) return singleton;

  const url = process.env.NEXT_PUBLIC_WEBSOCKET_GATEWAY_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_WEBSOCKET_GATEWAY_URL is not configured",
    );
  }

  const fetchToken = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/realtime/token", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken?: string };
      return data.accessToken ?? null;
    } catch {
      return null;
    }
  };

  singleton = new GatewayClient(url, fetchToken);
  return singleton;
}

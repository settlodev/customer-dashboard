"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  LockKeyhole,
  Minus,
  PlayCircle,
  PlusCircle,
  RotateCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import type { DaySessionSummary } from "@/lib/actions/day-session-summary-actions";
import {
  closeDaySession,
  extendDaySession,
  openDaySession,
} from "@/lib/actions/location-day-sessions-actions";
import { useRealtimeChannel } from "@/hooks/use-realtime-channel";
import { useRealtimeReconnect } from "@/hooks/use-realtime-reconnect";
import { useRealtimeStatus } from "@/hooks/use-realtime-status";
import type { WsMessage } from "@/lib/realtime/types";

/**
 * Refresh model — the socket leads, the timer is only a safety net.
 *
 * <p>Every poll costs TWO upstream calls (Accounts {@code /current} +
 * Reports {@code /current}, see {@code getDaySessionSummary}), and this
 * widget is mounted in the protected layout, so it polls on every page,
 * in every open tab, for as long as the tab lives. At the old flat 60s
 * that was the single loudest caller of {@code day-sessions/current} in
 * the whole product — including tabs left open overnight on a closed
 * day.
 *
 * <p>So:
 * <ul>
 *   <li><b>Lifecycle rides the gateway</b> — {@code DAY_SESSION_*} on
 *       {@code location:{id}:day-sessions} reloads immediately, so
 *       open / close / extend from a till still lands in about a
 *       second, faster than any poll was.</li>
 *   <li><b>Totals ride the gateway too, throttled</b> —
 *       {@code DAILY_LOCATION_METRICS_UPDATED} on
 *       {@code location:{id}:reports} is debounced 4s server-side, so
 *       a busy till can emit it ~15×/min. It's only worth a refetch
 *       when the expanded card is actually showing totals, and never
 *       more than once per {@link TOTALS_MIN_INTERVAL_MS}.</li>
 *   <li><b>The timer is the backstop</b> at {@link REFRESH_INTERVAL_MS},
 *       covering a missed event, and drops to
 *       {@link DEGRADED_REFRESH_INTERVAL_MS} when the socket has given
 *       up (mirrors {@code DashboardRealtimeBridge}).</li>
 *   <li><b>A hidden tab costs nothing</b> — the timer stops and events
 *       set a flag instead of fetching; becoming visible flushes it.</li>
 * </ul>
 */
const REFRESH_INTERVAL_MS = 5 * 60_000;
const DEGRADED_REFRESH_INTERVAL_MS = 60_000;
const TOTALS_MIN_INTERVAL_MS = 60_000;
/** Coalesce a lifecycle burst (e.g. OPENED then MERGED) into one reload. */
const EVENT_COALESCE_MS = 400;
const EXPANDED_STORAGE_KEY = "daySessionWidget.expanded";
const MINIMIZED_STORAGE_KEY = "daySessionWidget.minimized";
export const DAY_SESSION_CHANGED_EVENT = "settlo:day-session-changed";

// ─── Animation variants (paper unroll) ─────────────────────────────────
// Right-anchored maxWidth animation: the right edge stays put while the
// widget rolls out to the left (and rolls back in on exit). AnimatePresence
// mode="popLayout" pops the exiting element out of flow so the incoming
// element occupies the same spot — the two roll animations overlap at the
// shared right edge, producing a single continuous "unroll/roll-up"
// transition between states instead of a scale-based zoom.
//
// Expo-out for the unroll (fast at the start, glides to rest), ease-in for
// the roll-up (gentle start, crisp close).
const paperIn = { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const };
const paperOut = { duration: 0.45, ease: [0.55, 0, 0.75, 0.2] as const };

const pillVariants: Variants = {
  initial: { maxWidth: 0, opacity: 0 },
  animate: {
    maxWidth: 640,
    opacity: 1,
    transition: {
      maxWidth: paperIn,
      opacity: { duration: 0.3, delay: 0.12 },
    },
  },
  exit: {
    maxWidth: 0,
    opacity: 0,
    transition: {
      maxWidth: paperOut,
      opacity: { duration: 0.3 },
    },
  },
};

// The dot uses scale (anchored to the right edge) instead of maxWidth so
// the circle stays circular as it grows — an intermediate 20×40 pill would
// look wrong for a dot.
const dotVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      scale: { duration: 0.65, ease: [0.22, 1.2, 0.36, 1] as const },
      opacity: { duration: 0.22 },
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      scale: { duration: 0.4, ease: [0.55, 0, 0.75, 0.2] as const },
      opacity: { duration: 0.26, delay: 0.08 },
    },
  },
};

const cardVariants: Variants = {
  initial: { maxWidth: 0, opacity: 0 },
  animate: {
    maxWidth: 320,
    opacity: 1,
    transition: {
      maxWidth: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as const },
      opacity: { duration: 0.38, delay: 0.18 },
    },
  },
  exit: {
    maxWidth: 0,
    opacity: 0,
    transition: {
      maxWidth: { duration: 0.55, ease: [0.55, 0, 0.75, 0.2] as const },
      opacity: { duration: 0.32 },
    },
  },
};

interface DaySessionWidgetProps {
  locationId?: string;
}

export function DaySessionWidget({ locationId }: DaySessionWidgetProps) {
  const { toast } = useToast();
  const currency = useLocationCurrency();
  const [summary, setSummary] = useState<DaySessionSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    setExpanded(window.localStorage.getItem(EXPANDED_STORAGE_KEY) === "true");
    setMinimized(window.localStorage.getItem(MINIMIZED_STORAGE_KEY) === "true");
  }, []);

  const persistExpanded = (value: boolean) => {
    setExpanded(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(EXPANDED_STORAGE_KEY, String(value));
    }
    // Opening the card is the one moment the totals are actually being
    // read, and they only refresh on metrics events while it's open —
    // so pull once here rather than show up to a poll-interval stale.
    if (value) void loadRef.current();
  };

  const persistMinimized = (value: boolean) => {
    setMinimized(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MINIMIZED_STORAGE_KEY, String(value));
    }
  };

  // When the last summary landed — drives the "is it stale?" decision on
  // becoming visible and the totals throttle. Stamped on entry so two
  // triggers firing together can't both slip past the throttle.
  const lastLoadAtRef = useRef(0);
  // An event (or a poll) that fell in a hidden window. Flushed on show.
  const missedWhileHiddenRef = useRef(false);
  const coalesceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * The server's view of the day, into state and back to the caller.
   *
   * <p>Returns {@code null} when the READ failed — distinct from a clean
   * {@code {session: null}}, which is the server positively saying the day
   * is closed. The open / close handlers depend on that difference: they
   * must never treat "couldn't ask" as "it's closed".
   */
  const fetchSummary =
    useCallback(async (): Promise<DaySessionSummary | null> => {
      if (!locationId) {
        setSummary(null);
        return null;
      }
      lastLoadAtRef.current = Date.now();
      setLoading(true);
      try {
        // Route Handler instead of server action — a server action call
        // from a client component triggers a full RSC re-render of the
        // layout on every poll, which in turn refires the layout's
        // reference-data fan-out and tips the gateway into 429s.
        const res = await fetch(
          `/api/day-session/summary?locationId=${encodeURIComponent(locationId)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const data = (await res.json()) as DaySessionSummary;
        setSummary(data);
        return data;
      } catch {
        // Network blip — keep whatever we last had rather than flash closed.
        return null;
      } finally {
        setLoading(false);
      }
    }, [locationId]);

  const load = useCallback(async () => {
    await fetchSummary();
  }, [fetchSummary]);

  // Latest `load` reachable from listeners without re-subscribing them.
  const loadRef = useRef(load);
  loadRef.current = load;

  /** Reload now, or remember to once the tab comes back. */
  const requestLoad = useCallback(() => {
    if (typeof document !== "undefined" && document.hidden) {
      missedWhileHiddenRef.current = true;
      return;
    }
    void loadRef.current();
  }, []);

  const status = useRealtimeStatus();
  const socketDown = status === "fallback" || status === "disconnected";
  const pollIntervalMs = socketDown
    ? DEGRADED_REFRESH_INTERVAL_MS
    : REFRESH_INTERVAL_MS;

  // ── First load + in-app mutations (open / close / extend elsewhere) ──
  useEffect(() => {
    // `requestLoad`, not `load` — a session restored with twenty
    // background tabs shouldn't fire twenty summary fetches nobody is
    // looking at. Each flushes when its tab is actually shown.
    requestLoad();
    if (!locationId) return;
    // Every surface that changes the day fires this — including our own
    // handlers, which have just read the server twice. Skip the echo.
    const onChange = () => {
      if (Date.now() - lastLoadAtRef.current < 2_000) return;
      void load();
    };
    window.addEventListener(DAY_SESSION_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(DAY_SESSION_CHANGED_EVENT, onChange);
    };
  }, [load, locationId, requestLoad]);

  // ── Backstop poll, paused while the tab is hidden ────────────────────
  useEffect(() => {
    if (!locationId || typeof document === "undefined") return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => { void loadRef.current(); }, pollIntervalMs);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.hidden) {
        // A hidden tab makes no requests at all — not the poll, not an
        // event-driven reload. Whatever happened is caught up on show.
        missedWhileHiddenRef.current = true;
        stop();
        return;
      }
      const stale = Date.now() - lastLoadAtRef.current >= pollIntervalMs;
      if (missedWhileHiddenRef.current || stale) {
        missedWhileHiddenRef.current = false;
        void loadRef.current();
      }
      start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [locationId, pollIntervalMs]);

  // ── Gateway events ───────────────────────────────────────────────────
  // Totals only matter while the expanded card is on screen; the pill and
  // the dot render lifecycle alone, so a metrics event is worth nothing
  // to them.
  const showsTotals = expanded && !minimized;
  const showsTotalsRef = useRef(showsTotals);
  showsTotalsRef.current = showsTotals;

  const handleRealtimeEvent = useCallback(
    (msg: WsMessage) => {
      const type = msg.type ?? "";
      // The gateway fans the unified LOCATION_DAY_SESSION topic out into
      // DAY_SESSION_OPENED / CLOSED / EXTENDED / DELETED / MERGED.
      if (type.startsWith("DAY_SESSION_")) {
        if (coalesceRef.current) clearTimeout(coalesceRef.current);
        coalesceRef.current = setTimeout(() => {
          coalesceRef.current = null;
          requestLoad();
        }, EVENT_COALESCE_MS);
        return;
      }
      if (type !== "DAILY_LOCATION_METRICS_UPDATED") return;
      if (!showsTotalsRef.current) return;
      if (Date.now() - lastLoadAtRef.current < TOTALS_MIN_INTERVAL_MS) return;
      requestLoad();
    },
    [requestLoad],
  );

  useRealtimeChannel(
    useMemo(
      () =>
        locationId
          ? [
              `location:${locationId}:day-sessions`,
              `location:${locationId}:reports`,
            ]
          : [],
      [locationId],
    ),
    handleRealtimeEvent,
  );

  // USER sessions get no server-side replay, so anything that changed
  // while the socket was down is invisible until something else happens.
  useRealtimeReconnect(requestLoad);

  useEffect(() => {
    return () => {
      if (coalesceRef.current) clearTimeout(coalesceRef.current);
    };
  }, []);

  const announceChange = () => {
    window.dispatchEvent(new CustomEvent(DAY_SESSION_CHANGED_EVENT));
  };

  const unreachableToast = (action: "start" | "close") =>
    toast({
      variant: "destructive",
      title: `Could not ${action} the day`,
      description:
        "The business day couldn't be read, so nothing was changed. Check the connection and try again.",
    });

  const unverifiedToast = (action: "started" | "closed") =>
    toast({
      variant: "warning",
      title: "Couldn't confirm the business day",
      description: `The day may have ${action} — the widget will update as soon as the server answers.`,
    });

  /**
   * Read → act → read. Never optimistic, in either direction.
   *
   * <p>The widget's own state can be minutes old and the tills act on the
   * same location, so the pre-read decides whether the action is even
   * applicable: "start" on a day a till already opened is not a failure,
   * it's a stale screen, and it used to surface as a red error because
   * Accounts reports the conflict as a generic {@code INVALID_STATE}
   * (see {@code lib/day-sessions/conflicts}). The post-read is what
   * decides the message — the mutation's own "success" is never enough
   * to claim the day started, which is how the widget came to flash
   * started and then fall back to closed.
   */
  const handleStart = () => {
    if (!locationId) return;
    startTransition(async () => {
      const before = await fetchSummary();
      if (!before) {
        unreachableToast("start");
        return;
      }
      if (before.session) {
        toast({
          variant: "info",
          title: "A business day is already open",
          description: "The widget is now showing the open session.",
        });
        announceChange();
        return;
      }

      const result = await openDaySession(locationId);
      const after = await fetchSummary();
      if (!after) {
        unverifiedToast("started");
        announceChange();
        return;
      }
      if (after.session) {
        toast({ variant: "success", title: "Business day started" });
        announceChange();
        return;
      }
      toast({
        variant: "destructive",
        title: "Could not start the day",
        description:
          result.responseType === "error"
            ? result.message
            : "The server still reports no open business day.",
      });
    });
  };

  const handleClose = () => {
    if (!locationId) return;
    if (typeof window !== "undefined" && !window.confirm(
      "Close the business day? Trailing payments will still settle on this session."
    )) return;
    startTransition(async () => {
      const before = await fetchSummary();
      if (!before) {
        unreachableToast("close");
        return;
      }
      if (!before.session) {
        toast({
          variant: "info",
          title: "The business day is already closed",
          description: "Nothing to close — the widget is now up to date.",
        });
        announceChange();
        return;
      }

      const result = await closeDaySession(locationId);
      const after = await fetchSummary();
      if (!after) {
        unverifiedToast("closed");
        announceChange();
        return;
      }
      if (!after.session) {
        toast({ variant: "success", title: "Business day closed" });
        announceChange();
        return;
      }
      // Still open. Most likely: open orders in flight — surface the
      // server's reason so the operator can settle them or force-close
      // from the close-day page.
      toast({
        variant: "destructive",
        title: "Could not close the day",
        description:
          result.responseType === "error"
            ? result.message
            : "The server still reports the business day as open.",
      });
    });
  };

  const handleExtend = (minutes: number) => {
    if (!locationId || !summary?.session?.id) return;
    startTransition(async () => {
      const result = await extendDaySession(
        locationId,
        summary.session!.id,
        minutes,
      );
      if (result.responseType === "success") {
        toast({ variant: "success", title: `Session extended by ${minutes} minutes` });
        await load();
        announceChange();
      } else {
        toast({
          variant: "destructive",
          title: "Could not extend the session",
          description: result.message,
        });
      }
    });
  };

  if (!locationId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex justify-end">
      <AnimatePresence mode="popLayout">
        {summary === null ? (
          minimized ? (
            <motion.div
              key="loading-dot"
              variants={dotVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ transformOrigin: "right center" }}
              className="flex items-center justify-center h-10 w-10 rounded-full shadow-lg border border-border bg-card"
              aria-label="Checking day session status"
            >
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
            </motion.div>
          ) : (
            <motion.div
              key="loading-pill"
              variants={pillVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex items-center justify-end gap-3 bg-card border border-border rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap"
            >
              <LoadingPillContent onMinimize={() => persistMinimized(true)} />
            </motion.div>
          )
        ) : minimized ? (
          <motion.button
            key="minimized-dot"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={{ scale: 1.15, rotate: summary.session ? 12 : -12 }}
            whileTap={{ scale: 0.88, rotate: summary.session ? -8 : 8 }}
            onClick={() => persistMinimized(false)}
            aria-label={summary.session ? "Show day session summary" : "Business day is closed"}
            style={{ transformOrigin: "right center" }}
            className={cn(
              "flex items-center justify-center h-10 w-10 rounded-full shadow-lg border bg-card",
              summary.session ? "border-green-300" : "border-amber-300",
            )}
          >
            {summary.session ? <LiveDot size="md" /> : <WiggleAlert />}
          </motion.button>
        ) : !summary.session ? (
          <motion.div
            key="closed-pill"
            variants={pillVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center justify-end gap-3 bg-card border border-amber-300 rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap"
          >
            <ClosedPillContent
              onStart={handleStart}
              pending={pending}
              onMinimize={() => persistMinimized(true)}
            />
          </motion.div>
        ) : expanded ? (
          <motion.div
            key="open-card"
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex justify-end bg-card border border-border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="w-80 shrink-0">
              <OpenCardContent
                summary={summary}
                currency={currency}
                loading={loading}
                pending={pending}
                onRefresh={load}
                onCollapse={() => persistExpanded(false)}
                onMinimize={() => persistMinimized(true)}
                onClose={handleClose}
                onExtend={handleExtend}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="open-pill"
            variants={pillVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover={{ y: -3 }}
            className="flex items-center justify-end gap-3 bg-card border border-border rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap hover:shadow-xl"
          >
            <OpenPillContent
              summary={summary}
              currency={currency}
              onExpand={() => persistExpanded(true)}
              onMinimize={() => persistMinimized(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Live indicator (orbit + breath — replaces pulse) ──────────────────

function LiveDot({ size = "sm" }: { size?: "sm" | "md" }) {
  const isMd = size === "md";
  const box = isMd ? 14 : 10;
  const core = isMd ? 7 : 5;
  const sat = isMd ? 3 : 2;

  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: box, height: box }}
    >
      <motion.span
        className="absolute rounded-full bg-green-500"
        style={{
          width: core,
          height: core,
          left: "50%",
          top: "50%",
          marginLeft: -core / 2,
          marginTop: -core / 2,
        }}
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
      >
        <span
          className="absolute rounded-full bg-emerald-300"
          style={{
            width: sat,
            height: sat,
            right: 0,
            top: "50%",
            marginTop: -sat / 2,
            boxShadow: "0 0 3px rgba(110, 231, 183, 0.9)",
          }}
        />
      </motion.span>
    </span>
  );
}

// ─── Inner content (no outer shape — that lives on the motion element) ─

function LoadingPillContent({ onMinimize }: { onMinimize: () => void }) {
  return (
    <>
      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground shrink-0">Checking day status…</span>
      <MinimizeButton onClick={onMinimize} />
    </>
  );
}

function ClosedPillContent({
  onStart,
  pending,
  onMinimize,
}: {
  onStart: () => void;
  pending: boolean;
  onMinimize: () => void;
}) {
  return (
    <>
      <WiggleAlert />
      <span className="text-sm font-medium shrink-0">Day closed</span>
      <motion.div
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 420, damping: 14 }}
        className="shrink-0"
      >
        <Button
          size="sm"
          onClick={onStart}
          disabled={pending}
          className="h-7 rounded-full"
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <PlayCircle className="w-3 h-3 mr-1" />
              Start day
            </>
          )}
        </Button>
      </motion.div>
      <MinimizeButton onClick={onMinimize} />
    </>
  );
}

function OpenPillContent({
  summary,
  currency,
  onExpand,
  onMinimize,
}: {
  summary: DaySessionSummary;
  currency: string;
  onExpand: () => void;
  onMinimize: () => void;
}) {
  const { session, report } = summary;
  const duration = useDuration(session?.openedAt ?? "");
  if (!session) return null;

  return (
    <>
      <button
        onClick={onExpand}
        aria-label="Expand day session summary"
        className="flex items-center gap-3 group shrink-0"
      >
        <LiveDot />
        <span className="text-sm font-medium">{session.identifier}</span>
        <span className="text-xs text-muted-foreground">{duration}</span>
        {report && (
          <span className="flex items-center gap-3 text-xs border-l border-gray-200 dark:border-gray-700 pl-3">
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-muted-foreground" />
              {report.orderCount}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              {formatCompactMoney(
                report.sales.netCollected ?? report.sales.net,
                currency,
              )}
            </span>
          </span>
        )}
        <motion.span
          className="inline-flex"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-ink-2" />
        </motion.span>
      </button>
      <MinimizeButton onClick={onMinimize} />
    </>
  );
}

function OpenCardContent({
  summary,
  currency,
  loading,
  pending,
  onRefresh,
  onCollapse,
  onMinimize,
  onClose,
  onExtend,
}: {
  summary: DaySessionSummary;
  currency: string;
  loading: boolean;
  pending: boolean;
  onRefresh: () => void;
  onCollapse: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onExtend: (minutes: number) => void;
}) {
  const { session, report } = summary;
  const duration = useDuration(session?.openedAt ?? "");
  if (!session) return null;

  // Backend sets extensionAllowed=true only inside the grace window.
  // Hide the button entirely outside it — operator can't extend yet
  // anyway, surfacing it disabled would just invite "why?".
  const extensionAllowed = session.extensionAllowed === true;
  const extensionCount = session.extensionCount ?? 0;
  const effectiveCloseAt = session.effectiveCloseAt ?? session.extendedUntil ?? null;

  return (
    <>
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <LiveDot size="md" />
            <span className="text-sm font-semibold">{session.identifier}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {session.businessDate} · open {duration}
          </div>
          {effectiveCloseAt && (
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Auto-closes {formatTime(effectiveCloseAt)}</span>
              {extensionCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  · extended ×{extensionCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <motion.button
            onClick={onRefresh}
            aria-label="Refresh"
            disabled={loading}
            whileHover={loading ? undefined : { rotate: 45 }}
            whileTap={loading ? undefined : { rotate: 180, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-ink-3 disabled:opacity-60"
          >
            <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </motion.button>
          <motion.button
            onClick={onCollapse}
            aria-label="Collapse to pill"
            whileHover={{ y: 2 }}
            whileTap={{ scale: 0.85, y: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-ink-3"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.button>
          <MinimizeButton onClick={onMinimize} size="md" />
        </div>
      </div>

      {report ? (
        <div className="px-4 py-3 space-y-1.5">
          <Row label="Orders" value={report.orderCount.toLocaleString()} />
          <Row label="Gross sales" value={formatMoney(report.sales.gross, currency)} />
          {report.sales.discounts > 0 && (
            <Row label="Discounts" value={`-${formatMoney(report.sales.discounts, currency)}`} tone="muted" />
          )}
          {/* Comps close their bill as paid, so they sit inside sales.net and
              come back out of netCollected — show the deduction, or "Net sales"
              silently reads lower than gross less discounts. */}
          {(report.complimentaryAmount ?? 0) > 0 && (
            <Row
              label="In-house / comps"
              value={`-${formatMoney(report.complimentaryAmount ?? 0, currency)}`}
              tone="muted"
            />
          )}
          <Row
            label="Net sales"
            value={formatMoney(report.sales.netCollected ?? report.sales.net, currency)}
            strong
          />
          {report.sales.tips > 0 && (
            <Row label="Tips" value={formatMoney(report.sales.tips, currency)} />
          )}
          {report.refunds.count > 0 && (
            <Row
              label={`Refunds (${report.refunds.count})`}
              value={`-${formatMoney(report.refunds.amount, currency)}`}
              tone="danger"
            />
          )}
          <div className="pt-1">
            <Row label="Cash in drawer" value={formatMoney(report.cashNet, currency)} strong />
          </div>

          {report.paymentsByMethod.length > 0 && (
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
                Payments
              </div>
              {report.paymentsByMethod.map((p) => (
                <Row
                  key={p.paymentMethodId}
                  label={`${p.paymentMethodName} (${p.count})`}
                  value={formatMoney(p.amount, currency)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-6 text-xs text-muted-foreground text-center">
          {loading ? "Loading summary…" : "No metrics yet for this session."}
        </div>
      )}

      <div className="flex gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-muted/50">
        {extensionAllowed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExtend(30)}
            disabled={pending}
            className="h-8 flex-1 rounded-md"
            title="Push the auto-close back by 30 minutes"
          >
            {pending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <PlusCircle className="w-3 h-3 mr-1.5" />
                +30 min
              </>
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="default"
          onClick={onClose}
          disabled={pending}
          className={cn("h-8 rounded-md", extensionAllowed ? "flex-1" : "w-full")}
        >
          {pending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <LockKeyhole className="w-3 h-3 mr-1.5" />
              Close day
            </>
          )}
        </Button>
      </div>
    </>
  );
}

// ─── Small shared bits ─────────────────────────────────────────────────

function WiggleAlert() {
  return (
    <motion.span
      className="inline-flex shrink-0"
      animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        repeatDelay: 3.2,
        ease: "easeInOut",
      }}
    >
      <AlertCircle className="w-4 h-4 text-amber-500" />
    </motion.span>
  );
}

function MinimizeButton({
  onClick,
  size = "sm",
}: {
  onClick: () => void;
  size?: "sm" | "md";
}) {
  const isMd = size === "md";
  return (
    <motion.button
      onClick={onClick}
      aria-label="Minimize widget"
      whileHover={{ scale: 1.2, rotate: -90 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 420, damping: 14 }}
      className={cn(
        "rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-ink-3 hover:text-ink-2 shrink-0",
        isMd ? "p-1.5" : "ml-1 p-1",
      )}
    >
      <Minus className={isMd ? "w-3.5 h-3.5" : "w-3 h-3"} />
    </motion.button>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

type RowProps = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "muted" | "danger";
};

function Row({ label, value, strong, tone }: RowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          strong && "font-semibold",
          tone === "muted" && "text-muted-foreground",
          tone === "danger" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function useDuration(openedAt: string): string {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return useMemo(
    () => (openedAt ? formatDuration(new Date(openedAt)) : ""),
    [openedAt],
  );
}

function formatDuration(openedAt: Date): string {
  const ms = Date.now() - openedAt.getTime();
  if (ms < 0) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  const days = Math.floor(hours / 24);
  const hrem = hours % 24;
  return hrem === 0 ? `${days}d` : `${days}d ${hrem}h`;
}

function formatMoney(value: number, currency: string): string {
  const n = Number(value) || 0;
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Wall-clock time of an ISO-8601 instant in the operator's locale —
 * "Auto-closes 22:30". Day boundary skipped for legibility (a session
 * scheduled to close in <24h almost never crosses two date boundaries
 * worth showing).
 */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatCompactMoney(value: number, currency: string): string {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return `${currency} ${n.toFixed(0)}`;
}

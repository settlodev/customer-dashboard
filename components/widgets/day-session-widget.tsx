"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  PlayCircle,
  RotateCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocationCurrency } from "@/hooks/use-location-currency";
import {
  DaySessionSummary,
  getDaySessionSummary,
} from "@/lib/actions/day-session-summary-actions";
import { openDaySession } from "@/lib/actions/location-day-sessions-actions";

const REFRESH_INTERVAL_MS = 60_000;
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
  };

  const persistMinimized = (value: boolean) => {
    setMinimized(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MINIMIZED_STORAGE_KEY, String(value));
    }
  };

  const load = useCallback(async () => {
    if (!locationId) {
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getDaySessionSummary(locationId);
      setSummary(data);
    } catch {
      // Network blip — keep whatever we last had rather than flash closed.
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
    if (!locationId) return;
    const id = setInterval(load, REFRESH_INTERVAL_MS);
    const onChange = () => { load(); };
    window.addEventListener(DAY_SESSION_CHANGED_EVENT, onChange);
    return () => {
      clearInterval(id);
      window.removeEventListener(DAY_SESSION_CHANGED_EVENT, onChange);
    };
  }, [load, locationId]);

  const handleStart = () => {
    if (!locationId) return;
    startTransition(async () => {
      const result = await openDaySession(locationId);
      if (result.responseType === "success") {
        toast({ variant: "success", title: "Business day started" });
        await load();
        window.dispatchEvent(new CustomEvent(DAY_SESSION_CHANGED_EVENT));
      } else {
        toast({
          variant: "destructive",
          title: "Could not start the day",
          description: result.message,
        });
      }
    });
  };

  if (!locationId) return null;

  return (
    <div className="fixed bottom-6 right-[5rem] z-40 flex justify-end">
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
              className="flex items-center justify-center h-10 w-10 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              aria-label="Checking day session status"
            >
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />
            </motion.div>
          ) : (
            <motion.div
              key="loading-pill"
              variants={pillVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex items-center justify-end gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap"
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
              "flex items-center justify-center h-10 w-10 rounded-full shadow-lg border bg-white dark:bg-gray-900",
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
            className="flex items-center justify-end gap-3 bg-white dark:bg-gray-900 border border-amber-300 rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap"
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
            className="flex justify-end bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="w-80 shrink-0">
              <OpenCardContent
                summary={summary}
                currency={currency}
                loading={loading}
                onRefresh={load}
                onCollapse={() => persistExpanded(false)}
                onMinimize={() => persistMinimized(true)}
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
            className="flex items-center justify-end gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg pl-4 pr-2 py-2 overflow-hidden whitespace-nowrap hover:shadow-xl"
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
      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 shrink-0" />
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
              {formatCompactMoney(report.sales.net, currency)}
            </span>
          </span>
        )}
        <motion.span
          className="inline-flex"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronUp className="w-3 h-3 text-muted-foreground group-hover:text-gray-600" />
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
  onRefresh,
  onCollapse,
  onMinimize,
}: {
  summary: DaySessionSummary;
  currency: string;
  loading: boolean;
  onRefresh: () => void;
  onCollapse: () => void;
  onMinimize: () => void;
}) {
  const { session, report } = summary;
  const duration = useDuration(session?.openedAt ?? "");
  if (!session) return null;

  return (
    <>
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <LiveDot size="md" />
            <span className="text-sm font-semibold">{session.identifier}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {session.businessDate} · open {duration}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={onRefresh}
            aria-label="Refresh"
            disabled={loading}
            whileHover={loading ? undefined : { rotate: 45 }}
            whileTap={loading ? undefined : { rotate: 180, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 disabled:opacity-60"
          >
            <RotateCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </motion.button>
          <motion.button
            onClick={onCollapse}
            aria-label="Collapse to pill"
            whileHover={{ y: 2 }}
            whileTap={{ scale: 0.85, y: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
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
          <Row label="Net sales" value={formatMoney(report.sales.net, currency)} strong />
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
          {report.expenses.count > 0 && (
            <Row
              label={`Expenses (${report.expenses.count})`}
              value={`-${formatMoney(report.expenses.amount, currency)}`}
              tone="muted"
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
        "rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 shrink-0",
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

function formatCompactMoney(value: number, currency: string): string {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return `${currency} ${n.toFixed(0)}`;
}

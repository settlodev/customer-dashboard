"use client";

import {
  Ban,
  Bell,
  CheckCheck,
  ChevronRight,
  Inbox,
  Package,
  Receipt,
  RotateCcw,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useNotifications } from "@/context/notificationContext";
import { cn } from "@/lib/utils";
import type { OwnerNotification } from "@/types/notification";

/**
 * Sidebar notifications bell + flyout.
 *
 * The flyout is portaled to <body> and anchored to the bell via fixed
 * coordinates — NOT absolutely positioned. The desktop sidebar shell is
 * `overflow-hidden rounded-2xl w-[296px]` (see DashboardSidebarShell), so an
 * absolutely-positioned panel (the old approach, w-80) was clipped by the
 * sidebar's rounded mask and overflowed its 296px width. Portaling escapes the
 * clip and lets us clamp to the viewport — the same pattern the account menu
 * popover uses for the same reason.
 *
 * `open` lives in the notification context (so the realtime bridge can refresh
 * an already-open list). Two bells are mounted at once — the mobile top-bar one
 * and the desktop sidebar one — and they share that single `open` flag. Only
 * the viewport-visible bell is ever measurable; the hidden one's button reports
 * a zero-size rect, so we bail out of rendering its panel. That keeps a stray
 * second flyout from appearing for the off-screen instance.
 */

const PANEL_WIDTH = 380;
// Keep the flyout a compact, scrollable card even on tall monitors — the list
// scrolls once its content exceeds this.
const PANEL_MAX_HEIGHT = 520;

interface Anchor {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

// ── Visual language ─────────────────────────────────────────────────────────
// The feed's `type` is always "NORMAL" — it's the FCM delivery kind, not the
// domain event (the comms service drops the source event when it serializes the
// payload), so it can't drive the icon. We classify off the human-readable
// title instead, with the `data` keys as a backstop. Each match yields an icon
// + a tinted chip from the shared token palette.
type ChipTone = "primary" | "pos" | "warn" | "neg" | "muted";

const CHIP_TONE: Record<ChipTone, string> = {
  primary: "bg-primary/10 text-primary",
  pos: "bg-pos-tint text-pos",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-canvas text-muted-foreground",
};

function notificationVisual(
  title: string | null,
  body: string | null,
  data: Record<string, unknown> | null,
): { Icon: LucideIcon; chip: string } {
  const text = `${title ?? ""} ${body ?? ""}`.toLowerCase();
  const has = (k: string) => !!data && k in data;

  let Icon: LucideIcon = Bell;
  let tone: ChipTone = "muted";

  if (/refund/.test(text) || has("refundAmount")) {
    Icon = RotateCcw;
    tone = "neg";
  } else if (/void/.test(text) || has("voidReason")) {
    Icon = Ban;
    tone = "warn";
  } else if (/cancel/.test(text)) {
    Icon = XCircle;
    tone = "neg";
  } else if (/payment|paid/.test(text) || has("paymentMethod")) {
    Icon = Receipt;
    tone = "pos";
  } else if (
    /stock|inventory|expiry|reorder|overstock/.test(text) ||
    has("variantName") ||
    has("sku") ||
    has("threshold")
  ) {
    Icon = Package;
    tone = "warn";
  } else if (/order/.test(text) || has("orderId") || has("orderNumber")) {
    Icon = ShoppingBag;
    tone = "primary";
  }

  return { Icon, chip: CHIP_TONE[tone] };
}

// ── Relative time ───────────────────────────────────────────────────────────
// Lightweight, dependency-free "2h ago" formatter. Kept local so the flyout
// doesn't pull date-fns just for one label; the full timestamp rides the row's
// `title` attribute for anyone who needs the exact moment.
function relativeTime(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "Just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return new Date(then).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: Date.now() - then > 1000 * 60 * 60 * 24 * 330 ? "numeric" : undefined,
  });
}

function fullTimestamp(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : new Date(t).toLocaleString();
}

// The notification `data` blob is a free-form JSON string set by the backend.
function parseData(data: string | null): Record<string, unknown> | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data) as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null; // not JSON
  }
}

// UUID guard — only deep-link when `data` carries a real order id, so a
// malformed/foreign payload degrades to a non-clickable row instead of a link
// to /orders/<garbage> (the detail page would otherwise 404).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a click destination from a notification's `data` payload.
 *
 *   1. An explicit in-app path the backend embedded
 *      (`link`/`url`/`route`/`path`/`href`/`deeplink`, must start with "/").
 *      Absolute / off-app URLs are ignored on purpose.
 *   2. Otherwise, an order notification → `/orders/{orderId}`. The comms
 *      service flattens each event's payload into `data`, so every order alert
 *      (closed, cancelled, item-voided, refund, large-payment) carries the
 *      order UUID at top-level `orderId`. The feed's `type` is always "NORMAL",
 *      so the order id — not the type — is the signal. (`large_payment` not tied
 *      to an order sends `orderId: "null"`, which the UUID guard rejects.)
 *
 * Returns null when nothing safe resolves (the row stays non-navigable).
 */
function resolveLink(data: Record<string, unknown> | null): string | null {
  if (!data) return null;

  const explicit =
    data.link ?? data.url ?? data.route ?? data.path ?? data.href ?? data.deeplink;
  if (typeof explicit === "string" && explicit.startsWith("/")) return explicit;

  const orderId = data.orderId ?? data.order_id;
  if (typeof orderId === "string" && UUID_RE.test(orderId)) {
    return `/orders/${orderId}`;
  }

  return null;
}

export function NotificationBell({ className }: { className?: string }) {
  const {
    unreadCount,
    items,
    loading,
    open,
    setOpen,
    loadList,
    markOneRead,
    markAllRead,
  } = useNotifications();
  const router = useRouter();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const measure = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return setAnchor(null);
    const r = btn.getBoundingClientRect();
    // Hidden (display:none) instance — the off-viewport bell. Don't render.
    if (r.width === 0 && r.height === 0) return setAnchor(null);

    const margin = 8;
    const width = Math.min(PANEL_WIDTH, window.innerWidth - margin * 2);
    // Right-align the panel to the bell, then clamp inside the viewport.
    let left = r.right - width;
    left = Math.min(left, window.innerWidth - width - margin);
    left = Math.max(margin, left);
    const top = r.bottom + 8;
    const maxHeight = Math.max(
      220,
      Math.min(PANEL_MAX_HEIGHT, window.innerHeight - top - 12),
    );
    setAnchor({ left, top, width, maxHeight });
  }, []);

  // Measure on open, and keep the anchor pinned to the bell as the page
  // scrolls or resizes underneath the fixed panel.
  useEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Dismiss on outside-click / Escape. Only the visible instance (anchor set)
  // attaches these — otherwise the hidden bell would close the visible one's
  // panel on the very click that opened it.
  useEffect(() => {
    if (!open || !anchor) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, anchor, setOpen]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadList();
  };

  const handleItemClick = (n: OwnerNotification) => {
    if (!n.read) void markOneRead(n.id);
    const link = resolveLink(parseData(n.data));
    if (link) {
      setOpen(false);
      router.push(link);
    }
  };

  const panel = anchor && (
    <div
      ref={popRef}
      role="menu"
      aria-label="Notifications"
      style={{
        position: "fixed",
        left: anchor.left,
        top: anchor.top,
        width: anchor.width,
        maxHeight: anchor.maxHeight,
        pointerEvents: "auto",
      }}
      className="z-[1100] flex origin-top-right flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-[0_1px_0_rgba(20,17,12,0.04),0_24px_60px_-16px_rgba(20,17,12,0.28),0_6px_16px_-6px_rgba(20,17,12,0.10)] duration-150 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold tracking-tight text-ink">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide text-primary">
              {unreadCount > 99 ? "99+" : unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-ink-3 transition-colors hover:bg-canvas hover:text-ink"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading && items.length === 0 ? (
          <NotificationSkeleton />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-line" role="none">
            {items.map((n) => {
              const data = parseData(n.data);
              const link = resolveLink(data);
              const { Icon, chip } = notificationVisual(n.title, n.body, data);
              const rel = relativeTime(n.createdAt);
              return (
                <li key={n.id} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleItemClick(n)}
                    className={cn(
                      "group relative flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas",
                      !n.read && "bg-primary/[0.04]",
                    )}
                  >
                    {/* Unread accent rail */}
                    {!n.read && (
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-primary" />
                    )}

                    {/* Type chip */}
                    <span
                      className={cn(
                        "mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl",
                        chip,
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </span>

                    {/* Content */}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "line-clamp-1 text-[13px] leading-snug text-ink",
                            n.read ? "font-medium" : "font-semibold",
                          )}
                        >
                          {n.title ?? "Notification"}
                        </span>
                        {!n.read && (
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        )}
                      </span>

                      {n.body && (
                        <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink-3">
                          {n.body}
                        </span>
                      )}

                      <span className="mt-1 flex items-center gap-1.5">
                        <span
                          className="text-[11px] text-muted-foreground"
                          title={fullTimestamp(n.createdAt)}
                        >
                          {rel}
                        </span>
                        {link && (
                          <ChevronRight className="h-3 w-3 text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={cn(
          "relative grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-canvas hover:text-ink",
          open && "bg-canvas text-ink",
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        anchor &&
        typeof document !== "undefined" &&
        createPortal(panel, document.body)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-muted-2">
        <Inbox className="h-6 w-6" strokeWidth={1.7} />
      </span>
      <p className="text-[13px] font-medium text-ink">You&apos;re all caught up</p>
      <p className="max-w-[15rem] text-[12px] leading-snug text-muted-foreground">
        New alerts about orders, stock and payments will show up here.
      </p>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex gap-3 px-4 py-3">
          <span className="h-9 w-9 flex-shrink-0 animate-pulse rounded-xl bg-canvas" />
          <span className="min-w-0 flex-1 space-y-2 py-0.5">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-canvas" />
            <span className="block h-2.5 w-11/12 animate-pulse rounded bg-canvas" />
            <span className="block h-2 w-16 animate-pulse rounded bg-canvas" />
          </span>
        </li>
      ))}
    </ul>
  );
}

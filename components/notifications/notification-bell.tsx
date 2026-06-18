"use client";

import { Bell } from "lucide-react";

import ClickOutside from "@/components/ClickOutside";
import { useNotifications } from "@/context/notificationContext";
import { cn } from "@/lib/utils";

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

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadList();
  };

  return (
    <ClickOutside onClick={() => setOpen(false)} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-ink hover:bg-card"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 max-h-[28rem] w-80 overflow-y-auto rounded-lg border border-line bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold text-ink">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-ink/70 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-ink/60">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink/60">
              No notifications yet
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={n.read ? undefined : () => void markOneRead(n.id)}
                    className={cn(
                      "flex w-full flex-col gap-1 border-t border-line px-4 py-3 text-left hover:bg-canvas",
                      !n.read && "bg-canvas/60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      {!n.read && (
                        <span className="h-2 w-2 flex-shrink-0 rounded-full bg-danger" />
                      )}
                      {n.title ?? "Notification"}
                    </span>
                    {n.body && <span className="text-xs text-ink/70">{n.body}</span>}
                    <span className="text-[11px] text-ink/50">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </ClickOutside>
  );
}

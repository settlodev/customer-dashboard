import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * One entry on a document's audit rail. Callers pass display-ready strings:
 * humanising the event key and formatting the timestamp stay with the screen
 * that owns them, because the rules differ (orders pin the business timezone,
 * invoicing formats in the viewer's locale).
 */
export interface TimelineItem {
  key: string;
  /** Human label for what happened, e.g. "Payment recorded". */
  title: string;
  /** Already-formatted timestamp. */
  timestamp: string;
  /** Optional detail line under the title. */
  message?: string | null;
  /** Optional "by <name>" attribution. */
  actor?: string | null;
  /** `neg` marks the dot red — cancellations, refunds, voids. */
  tone?: "default" | "neg";
}

/**
 * The dashboard's audit rail: a dotted spine with newest at the top.
 *
 * Lifted out of the order detail view so every document timeline reads the
 * same. Invoices and proformas previously drew their own version with boxed
 * icons, a raw uppercase event key as the heading, and the timestamp last,
 * which made the same underlying history look like a different feature
 * depending on which screen you opened.
 *
 * Ordering is the caller's: pass items in the order they should appear.
 */
export function EventTimeline({
  items,
  className,
  emptyLabel = "No events yet.",
}: {
  items: TimelineItem[];
  className?: string;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <div
            key={item.key}
            className="grid grid-cols-[auto_1fr] gap-3.5 pb-5 last:pb-0"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card",
                  item.tone === "neg" ? "bg-neg" : "bg-primary",
                )}
              />
              {!last && <span className="mt-1 w-0.5 flex-1 bg-line-2" />}
            </div>
            <div className="pb-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <b className="text-[13.5px] font-semibold tracking-tight text-ink">
                  {item.title}
                </b>
                <time className="font-mono text-[10.5px] text-muted-foreground">
                  {item.timestamp}
                </time>
              </div>
              {item.message && (
                <div className="mt-1 text-[12.5px] text-ink-3">{item.message}</div>
              )}
              {item.actor && (
                <div className="mt-1 font-mono text-[10.5px] text-muted-foreground">
                  by {item.actor}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** `SOME_EVENT_KEY` → `Some event key`. */
export function humanizeEventKey(event: string): string {
  return event
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

/** Events that should read as a reversal rather than progress. */
export const NEGATIVE_EVENT_RE = /CANCEL|REFUND|VOID|REVERS|REJECT|FAIL/i;

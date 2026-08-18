import { formatDistanceToNowStrict } from "date-fns";

import type { OwnerNotification } from "@/types/notification";

/**
 * A single row in the dashboard's Recent-activity feed, derived server-side
 * from an owner notification. It is presentational-ready (relative time already
 * formatted into a string) so the card component stays a pure renderer with no
 * clock access — which avoids any SSR/client hydration split on the timestamps.
 *
 * The owner feed's `type` is always "NORMAL" (the FCM delivery kind), so we
 * classify by `title`; `data` is the flattened event payload (JSON string) with
 * top-level `orderId` / `amount` / `refundAmount`. See
 * project_owner_notification_feed_shape.
 */
export interface ActivityItem {
  id: string;
  kind: "sale" | "payment" | "refund" | "void" | "cancelled" | "stock" | "other";
  /** Main line (the notification title, or a fallback). */
  text: string;
  /** Sub line: body snippet + relative time. */
  meta: string;
  /** Formatted signed amount, e.g. "+34,500" / "−68,000" (absent when none). */
  amount?: string;
  amountTone?: "pos" | "neg";
  /** Deep link (e.g. /orders/{uuid}) when the payload carries a valid id. */
  href?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmtAmt = (n: number) =>
  Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(Math.abs(n));

function classify(title: string): ActivityItem["kind"] {
  const t = title.toLowerCase();
  if (t.startsWith("refund")) return "refund";
  if (t.includes("void")) return "void";
  if (t.startsWith("order cancelled")) return "cancelled";
  if (t.startsWith("order closed")) return "sale";
  if (t.startsWith("large payment")) return "payment";
  if (
    t.includes("stock") ||
    t.includes("reorder") ||
    t.includes("expiry") ||
    t.includes("expiring")
  )
    return "stock";
  return "other";
}

function parseData(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

/**
 * Map the latest owner notifications into feed rows. Runs server-side (relative
 * time is stamped at render), returns at most `limit` items.
 */
export function toActivityItems(
  notifications: OwnerNotification[],
  limit = 6,
): ActivityItem[] {
  return notifications.slice(0, limit).map((n) => {
    const title = (n.title ?? "").trim();
    const body = (n.body ?? "").trim();
    const kind = classify(title);
    const data = parseData(n.data);

    const rel = n.createdAt
      ? formatDistanceToNowStrict(new Date(n.createdAt), { addSuffix: true })
      : "";
    const meta = [body, rel].filter(Boolean).join(" · ");

    const amt = num(data.refundAmount) ?? num(data.amount);
    let amount: string | undefined;
    let amountTone: ActivityItem["amountTone"];
    if (amt != null && amt !== 0) {
      if (kind === "refund" || kind === "void" || kind === "cancelled") {
        amount = `−${fmtAmt(amt)}`;
        amountTone = "neg";
      } else if (kind === "sale" || kind === "payment") {
        amount = `+${fmtAmt(amt)}`;
        amountTone = "pos";
      } else {
        amount = fmtAmt(amt);
      }
    }

    const orderId =
      typeof data.orderId === "string" && UUID_RE.test(data.orderId)
        ? data.orderId
        : null;

    return {
      id: n.id,
      kind,
      text: title || body || "Activity",
      meta,
      amount,
      amountTone,
      href: orderId ? `/orders/${orderId}` : undefined,
    };
  });
}

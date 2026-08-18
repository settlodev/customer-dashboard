import { cn } from "@/lib/utils";
import type { SubscriptionItemStatus } from "@/types/admin/billing";

type StatusTone = "pos" | "blue" | "warn" | "neg" | "muted";

const STATUS_TONE: Record<StatusTone, string> = {
  pos: "bg-pos-tint text-pos",
  blue: "bg-[#2563EB]/10 text-[#2563EB]",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-black/[0.05] text-ink-3 dark:bg-white/[0.06]",
};

const ITEM_STATUS_META: Record<
  SubscriptionItemStatus,
  { label: string; tone: StatusTone }
> = {
  ACTIVE: { label: "Active", tone: "pos" },
  PAST_DUE: { label: "Past due", tone: "warn" },
  EXPIRED: { label: "Expired", tone: "neg" },
  SUSPENDED: { label: "Suspended", tone: "neg" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  REMOVED: { label: "Removed", tone: "muted" },
};

export function SubscriptionItemStatusBadge({
  status,
  small,
}: {
  status: SubscriptionItemStatus | null;
  small?: boolean;
}) {
  const meta = status
    ? (ITEM_STATUS_META[status] ?? { label: status, tone: "muted" as StatusTone })
    : { label: "No subscription", tone: "muted" as StatusTone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold",
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12.5px]",
        STATUS_TONE[meta.tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

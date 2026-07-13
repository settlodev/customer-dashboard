import Link from "next/link";
import {
  Activity,
  Ban,
  Clock,
  CreditCard,
  Package,
  RotateCcw,
  ShoppingCart,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/dashboard/recent-activity";

/**
 * Recent activity — right half of the "top selling + recent activity" row
 * (design §6). A feed of the latest owner-notification events (orders, refunds,
 * voids, stock alerts), classified by kind into an icon + tone. Rows with a
 * resolved order id deep-link to the order. Data is mapped server-side into
 * {@link ActivityItem}s, so this stays a pure renderer.
 */

const KIND: Record<ActivityItem["kind"], { Icon: LucideIcon; box: string }> = {
  sale: { Icon: ShoppingCart, box: "bg-pos-tint text-pos" },
  payment: { Icon: CreditCard, box: "bg-pos-tint text-pos" },
  refund: { Icon: RotateCcw, box: "bg-neg-tint text-neg" },
  void: { Icon: XCircle, box: "bg-warn-tint text-warn" },
  cancelled: { Icon: Ban, box: "bg-warn-tint text-warn" },
  stock: {
    Icon: Package,
    box: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  other: { Icon: Activity, box: "bg-muted text-muted-foreground" },
};

const ROW = "flex items-start gap-3 border-b border-line py-2.5 last:border-b-0";

function Row({ item }: { item: ActivityItem }) {
  const { Icon, box } = KIND[item.kind];
  const inner = (
    <>
      <span
        className={cn(
          "grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px]",
          box,
        )}
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium tracking-[-0.01em] text-ink">
          {item.text}
        </div>
        {item.meta && (
          <div className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground">
            {item.meta}
          </div>
        )}
      </div>
      {item.amount && (
        <span
          className={cn(
            "flex-none whitespace-nowrap font-mono text-[12.5px] font-semibold tabular-nums",
            item.amountTone === "pos"
              ? "text-pos"
              : item.amountTone === "neg"
                ? "text-neg"
                : "text-ink",
          )}
        >
          {item.amount}
        </span>
      )}
    </>
  );

  return item.href ? (
    <Link
      href={item.href}
      className={cn(ROW, "transition-colors hover:bg-canvas")}
    >
      {inner}
    </Link>
  ) : (
    <div className={ROW}>{inner}</div>
  );
}

export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="flex h-full flex-col p-5 shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
          <Clock className="h-4 w-4 text-primary" strokeWidth={1.8} />
          Recent activity
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.03em] text-muted-foreground">
          Latest
        </span>
      </div>

      {items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center font-mono text-[12px] text-muted-foreground">
          No recent activity
        </p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <Row key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default RecentActivityCard;

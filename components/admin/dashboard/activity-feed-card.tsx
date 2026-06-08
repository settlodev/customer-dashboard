import {
  AlertTriangle,
  ArrowUp,
  Briefcase,
  CircleDollarSign,
  Plus,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { ActivityItem, ActivityKind } from "@/types/admin/dashboard";

/**
 * Recent activity feed — account & billing events with a tinted glyph,
 * bold lead entity, timestamp and an optional signed amount.
 */

const KIND_CONFIG: Record<
  ActivityKind,
  { icon: LucideIcon; className: string }
> = {
  signup: { icon: Plus, className: "bg-pos-tint text-pos" },
  upgrade: { icon: ArrowUp, className: "bg-primary/12 text-[#C25E26]" },
  payment: { icon: CircleDollarSign, className: "bg-pos-tint text-pos" },
  business: { icon: Briefcase, className: "bg-[#2563EB]/10 text-[#2563EB]" },
  failed: { icon: AlertTriangle, className: "bg-warn-tint text-warn" },
  refund: { icon: RotateCcw, className: "bg-black/5 text-ink-3 dark:bg-white/5" },
};

const AMOUNT_TONE = {
  pos: "text-pos",
  neg: "text-neg",
  dim: "text-muted-2",
} as const;

export function ActivityFeedCard({
  items,
  stub,
}: {
  items: ActivityItem[];
  stub?: boolean;
}) {
  return (
    <SectionCard
      title="Recent activity"
      subtitle="Account & billing events"
      stub={stub}
    >
      <div className="flex flex-col">
        {items.map((item) => {
          const { icon: Icon, className } = KIND_CONFIG[item.kind];
          return (
            <div
              key={item.id}
              className="flex gap-3 border-b border-line py-3 last:border-b-0"
            >
              <span
                className={cn(
                  "grid h-8 w-8 flex-shrink-0 place-items-center rounded-[9px]",
                  className,
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-snug text-ink-2">
                  {item.lead && <b className="font-semibold text-ink">{item.lead}</b>}
                  {item.text}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                  {item.time}
                </div>
              </div>
              {item.amount && (
                <span
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap font-mono text-[12.5px] font-semibold tabular-nums",
                    item.amountTone
                      ? AMOUNT_TONE[item.amountTone]
                      : "text-ink",
                  )}
                >
                  {item.amount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

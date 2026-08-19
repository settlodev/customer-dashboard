import Link from "next/link";
import { Boxes, ChevronRight, MapPin, Store } from "lucide-react";

import { PlanBadge } from "@/components/admin/shared/plan-badge";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import type { AccountEntityNode } from "@/types/admin/account-structure";

/**
 * A single location/warehouse/store row within a business's unit list (name,
 * plan, status), used by the "Businesses at a glance" card on the account
 * Overview tab. Every row drills into its own detail page.
 */
export function EntityRow({ node }: { node: AccountEntityNode }) {
  const Icon =
    node.entityType === "WAREHOUSE" ? Boxes : node.entityType === "STORE" ? Store : MapPin;
  const typeLabel = node.entityType.charAt(0) + node.entityType.slice(1).toLowerCase();
  const inner = (
    <>
      <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-primary/12 text-[#C25E26]">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-ink">{node.name}</div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          {[typeLabel, node.meta].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {node.planLabel && node.planTier ? (
          <PlanBadge tier={node.planTier} label={node.planLabel} />
        ) : (
          <span className="font-mono text-[10.5px] text-muted-2">no plan</span>
        )}
        <SubscriptionItemStatusBadge status={node.status} small />
        {node.href && <ChevronRight className="h-4 w-4 text-muted-2" />}
      </div>
    </>
  );
  return node.href ? (
    <Link
      href={node.href}
      className="flex items-center gap-3 border-t border-line py-3 pl-5 pr-4 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-3 border-t border-line py-3 pl-5 pr-4">{inner}</div>
  );
}

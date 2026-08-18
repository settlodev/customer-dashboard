import Link from "next/link";
import { Boxes, ChevronRight, MapPin, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { Monogram } from "@/components/admin/shared/monogram";
import { PlanBadge } from "@/components/admin/shared/plan-badge";
import { SubscriptionItemStatusBadge } from "@/components/admin/shared/subscription-item-status-badge";
import type {
  AccountBusinessNode,
  AccountInsights,
} from "@/types/admin/account-insights";
import type {
  AccountEntityNode,
  AccountStructure,
} from "@/types/admin/account-structure";

/**
 * Account → business → entity hierarchy. The business spine (name + status)
 * comes from the Reports insights rollup; each business's billable units
 * (locations / warehouses / stores, with plan + per-item status) come from the
 * authoritative `AccountStructure` join. Location rows drill into their detail
 * page; warehouse/store detail pages land in Phase 4 (non-clickable for now).
 */

const STATUS_TONE: Record<AccountBusinessNode["statusTone"], string> = {
  pos: "bg-pos-tint text-pos",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
};

function EntityRow({ node }: { node: AccountEntityNode }) {
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

export function BusinessesLocationsCard({
  businesses,
  structure,
  href = "/businesses",
  stub,
}: {
  businesses: AccountInsights["businesses"];
  structure: AccountStructure;
  href?: string;
  stub?: boolean;
}) {
  const subtitle = `${businesses.count} business${businesses.count === 1 ? "" : "es"} · each unit billed on its own plan`;

  return (
    <SectionCard
      title="Businesses & units"
      subtitle={subtitle}
      linkLabel="View businesses"
      linkHref={href}
      stub={stub}
    >
      <div className="space-y-3">
        {businesses.items.map((biz) => {
          const s = structure[biz.id];
          const nodes: AccountEntityNode[] = s
            ? [...s.locations, ...s.warehouses, ...s.stores]
            : [];
          return (
            <div
              key={biz.id}
              className="overflow-hidden rounded-[14px] border border-line"
            >
              <div className="flex items-center gap-3 bg-surface px-4 py-3.5">
                <Monogram name={biz.name} color={biz.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-ink">
                    {biz.name}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {[biz.code, biz.industry, `${nodes.length} unit${nodes.length === 1 ? "" : "s"}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                    STATUS_TONE[biz.statusTone],
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {biz.statusLabel}
                </span>
              </div>

              {nodes.length === 0 ? (
                <div className="border-t border-line py-3 pl-5 pr-4 text-[12.5px] text-muted-2">
                  No billable units.
                </div>
              ) : (
                nodes.map((node) => <EntityRow key={node.id} node={node} />)
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

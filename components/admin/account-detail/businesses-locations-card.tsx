import { MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/admin/shared/section-card";
import { Monogram } from "@/components/admin/shared/monogram";
import { PlanBadge } from "@/components/admin/shared/plan-badge";
import {
  AccountBusinessNode,
  AccountInsights,
} from "@/types/admin/account-insights";

/**
 * Businesses & locations — the account → business → location hierarchy, with
 * the location flagged as the billable unit. Each business header carries a
 * status pill; each location row shows its plan and trial state.
 */

const STATUS_TONE: Record<AccountBusinessNode["statusTone"], string> = {
  pos: "bg-pos-tint text-pos",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
};

export function BusinessesLocationsCard({
  businesses,
  href = "/businesses",
  stub,
}: {
  businesses: AccountInsights["businesses"];
  href?: string;
  stub?: boolean;
}) {
  const subtitle = `${businesses.count} business${businesses.count === 1 ? "" : "es"} · ${businesses.locationCount} location${businesses.locationCount === 1 ? "" : "s"} · each unit billed separately`;

  return (
    <SectionCard
      title="Businesses & locations"
      subtitle={subtitle}
      linkLabel="View businesses"
      linkHref={href}
      stub={stub}
    >
      <div className="space-y-3">
        {businesses.items.map((biz) => (
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
                  {[
                    biz.code,
                    biz.industry,
                    `${biz.locationCount} location${biz.locationCount === 1 ? "" : "s"}`,
                  ]
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

            {biz.locations.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center gap-3 border-t border-line py-3 pl-5 pr-4"
              >
                <span className="grid h-[30px] w-[30px] flex-shrink-0 place-items-center rounded-lg bg-primary/12 text-[#C25E26]">
                  <MapPin className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium text-ink">
                    {loc.name}
                  </div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">
                    {[loc.code, loc.region, loc.terminals]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <PlanBadge tier={loc.planTier} label={loc.planLabel} />
                  {loc.trialLabel && (
                    <div className="mt-1 font-mono text-[10.5px] text-warn">
                      {loc.trialLabel}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

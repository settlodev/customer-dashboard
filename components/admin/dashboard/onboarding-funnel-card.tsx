import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard, CardLink } from "@/components/admin/shared/section-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { OnboardingFunnel } from "@/types/admin/dashboard";

/**
 * Onboarding funnel — the account → business → location activation path as a
 * set of decreasing share bars with drop-off annotations. Links into the
 * accounts list for triage.
 */

const NOTE_TONE = {
  warn: "text-warn",
  ok: "text-pos",
  dim: "text-muted-2",
} as const;

const STAGE_TOOLTIP: Record<string, string> = {
  account: "Every account that has signed up, regardless of onboarding progress. The 100% baseline for this funnel.",
  email: "Accounts that confirmed their email address — the first activation step after signup.",
  business: "Accounts that created at least one business profile after verifying their email.",
  location: "Accounts with a live, billable location — the point at which they become a paying/active customer.",
};

export function OnboardingFunnelCard({
  funnel,
  href = "/accounts",
  stub,
}: {
  funnel: OnboardingFunnel;
  href?: string;
  stub?: boolean;
}) {
  return (
    <SectionCard
      title="Onboarding funnel"
      subtitle="Account → business → location · activation path"
      tooltip="Tracks how newly signed-up accounts progress through activation, from account creation to a live billable location. Each stage shows the share and drop-off from the stage before it."
      linkLabel="Triage accounts"
      linkHref={href}
      stub={stub}
    >
      <div className="flex flex-col">
        {funnel.stages.map((stage) => (
          <div
            key={stage.key}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line py-3 last:border-b-0 sm:grid-cols-[180px_1fr_auto]"
          >
            <div className="flex items-center gap-2.5 text-[13.5px] font-medium tracking-[-0.01em] text-ink-2">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-[3px]"
                style={{ backgroundColor: stage.color }}
              />
              <span className="inline-flex items-center gap-1">
                {stage.label}
                {stage.qualifier && (
                  <span className="font-mono text-[10.5px] font-normal text-muted-2">
                    {stage.qualifier}
                  </span>
                )}
                {STAGE_TOOLTIP[stage.key] && (
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex flex-shrink-0 text-muted-foreground/70 hover:text-muted-foreground focus:outline-none"
                          aria-label={`About ${stage.label}`}
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-[240px] text-xs font-normal">
                        {STAGE_TOOLTIP[stage.key]}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </div>

            <div className="order-last col-span-2 h-3 min-w-[90px] overflow-hidden rounded-full bg-canvas sm:order-none sm:col-span-1">
              <div
                className="h-full rounded-full"
                style={{ width: `${stage.pct}%`, backgroundColor: stage.color }}
              />
            </div>

            <div className="flex items-center justify-end gap-3.5">
              <span className="w-8 text-right font-mono text-[14px] font-bold tracking-[-0.01em] text-ink tabular-nums">
                {stage.count}
              </span>
              <span className="w-10 text-right font-mono text-[12px] text-muted-foreground tabular-nums">
                {stage.pct}%
              </span>
              <span
                className={cn(
                  "hidden w-[138px] text-right font-mono text-[11.5px] sm:inline",
                  NOTE_TONE[stage.noteTone],
                )}
              >
                {stage.note}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
        <p className="text-[12.5px] text-ink-3">{funnel.summary}</p>
        <CardLink href={href}>Review</CardLink>
      </div>
    </SectionCard>
  );
}

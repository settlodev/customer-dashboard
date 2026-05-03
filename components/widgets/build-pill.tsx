"use client";

/**
 * Floating build-info pill, shown in the dashboard's bottom-right
 * corner. Hairline-bordered chip with a tone-coloured presence dot
 * (green/amber/muted depending on environment) and the 7-char commit
 * SHA — same micro-typography voice the rest of the dashboard uses
 * for IDs and timestamps. Hover reveals full Build / Env / Branch
 * detail.
 *
 * Sits at z-30 so transient toast notifications (z-100) take priority
 * when they appear; the pill briefly hides behind a stack of toasts,
 * which is fine because it's ambient information, not an action.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getBuildInfo } from "@/lib/utils";

export function BuildPill({ className }: { className?: string }) {
  const buildInfo = getBuildInfo();
  const sha = buildInfo.buildId?.slice(0, 7) ?? "—";
  const env = buildInfo.environment ?? "development";
  const dotTone =
    env === "production"
      ? "bg-pos"
      : env === "preview"
        ? "bg-warn"
        : "bg-muted-2";
  const envLabel =
    env === "production"
      ? "Production"
      : env === "preview"
        ? "Preview"
        : "Development";

  return (
    <div
      className={cn(
        "pointer-events-none fixed top-3 right-3 z-30",
        className,
      )}
    >
      <TooltipProvider delayDuration={120}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Build ${sha} · ${envLabel}`}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-card/95 px-2 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground shadow-[0_1px_2px_rgba(20,17,12,0.06)] backdrop-blur-sm transition-colors hover:border-line-2 hover:text-ink"
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", dotTone)} />
              <span className="text-[9px] uppercase">{envLabel.charAt(0)}</span>
              <span className="opacity-50">·</span>
              <span>{sha}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end" className="max-w-[260px]">
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-medium tracking-tight">
                Build information
              </p>
              <div className="flex flex-col gap-0.5 font-mono text-[10.5px] tracking-wider text-muted-foreground">
                <p>
                  <span className="text-ink-3">Commit</span>{" "}
                  <span className="text-ink">{buildInfo.buildId}</span>
                </p>
                <p>
                  <span className="text-ink-3">Env</span>{" "}
                  <span className="text-ink">{envLabel}</span>
                </p>
                {buildInfo.buildNumber && (
                  <p>
                    <span className="text-ink-3">Branch</span>{" "}
                    <span className="text-ink">{buildInfo.buildNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default BuildPill;

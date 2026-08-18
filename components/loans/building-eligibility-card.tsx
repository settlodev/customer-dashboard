import Link from "next/link";
import { Check, Clock, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatTzsShort,
  type BuildProgressItem,
  type LoanEligibility,
} from "@/types/loans/type";

// Soft orange glow bleeding from the top-right corner — mirrors
// EligibilityHero's `.hxd::after` so the two cards read as one family (the
// eligibility slot on business-overview only ever renders one of them).
const GLOW: React.CSSProperties = {
  background:
    "radial-gradient(circle at 80% 25%, hsl(var(--primary) / 0.13), transparent 62%)",
};

const ghostClass =
  "inline-flex h-[46px] flex-shrink-0 items-center gap-2 rounded-xl border border-line bg-canvas px-5 text-[15px] font-bold tracking-[-0.01em] text-ink-2 transition hover:bg-card hover:text-ink";

function statusIconClasses(state: BuildProgressItem["state"]): string {
  switch (state) {
    case "done":
      return "bg-pos-tint text-pos";
    case "prog":
      return "bg-warn-tint text-warn";
    default:
      return "border border-line-2 bg-card text-muted-foreground";
  }
}

function StatusIcon({ state }: { state: BuildProgressItem["state"] }) {
  const Icon = state === "done" ? Check : state === "prog" ? Clock : Plus;
  return (
    <span
      className={cn(
        "grid h-8 w-8 flex-shrink-0 place-items-center rounded-full",
        statusIconClasses(state),
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function ChecklistRow({ item }: { item: BuildProgressItem }) {
  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-line bg-canvas px-4 py-3">
      <StatusIcon state={item.state} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">
          {item.label}
        </div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {item.detail}
        </div>
      </div>
      {item.state === "prog" && (
        <span className="flex-shrink-0 font-mono text-[12px] font-semibold text-warn">
          {item.pct}%
        </span>
      )}
    </div>
  );
}

/**
 * Building-eligibility card — rendered instead of {@link EligibilityHero}
 * when `eligibility.eligibilityStatus === "BUILDING"`: the merchant isn't
 * pre-qualified yet but is actively accruing toward it. Same shell / radii /
 * borders / type scale as the hero so the two read as one family; the
 * headline amount is deliberately neutral (not deep-orange) since nothing is
 * available to borrow yet, and a "Building eligibility" (blue) pill replaces
 * the hero's "Pre-qualified" (orange) one.
 */
export function BuildingEligibilityCard({
  eligibility,
}: {
  eligibility: LoanEligibility;
}) {
  const { building } = eligibility;
  if (!building) return null;

  const currency = eligibility.currencyCode;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-line bg-card px-5 pb-6 pt-7 sm:px-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[30%] -right-[8%] h-[150%] w-[44%]"
        style={GLOW}
      />

      <div className="relative z-[1] grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* Left: badge, projected limit, progress, description, actions */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-[5px] text-xs font-semibold text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Building eligibility
            </span>
            <span className="truncate font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
              Keep trading to unlock financing
            </span>
          </div>

          <div className="mt-[18px] font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Projected limit
            {building.daysToTarget != null &&
              ` · ~${building.daysToTarget} active days to go`}
          </div>

          {building.projectedLimit != null ? (
            <div className="mt-2 text-[40px] font-bold leading-[0.95] tracking-[-0.035em] text-ink sm:text-[52px] lg:text-[58px]">
              {currency} {formatTzsShort(building.projectedLimit)}
              <span className="ml-2.5 text-[19px] font-semibold tracking-[-0.01em] text-muted-foreground">
                est.
              </span>
            </div>
          ) : (
            <div className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-muted-foreground">
              —
            </div>
          )}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${building.eligibilityPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] tracking-[0.02em] text-muted-foreground">
            <span>Eligibility {building.eligibilityPct}%</span>
            <span>Target 100%</span>
          </div>

          <p className="mt-4 max-w-[50ch] text-[13.5px] leading-relaxed text-ink-3">
            Not quite there yet — keep selling on Settlo. Your limit grows
            automatically as we see steady daily sales and verified digital
            payments. No application needed while you build.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/loans" className={ghostClass}>
              How financing works →
            </Link>
            <Link
              href="/loans"
              className="text-sm font-semibold text-primary-dark hover:text-primary"
            >
              See eligibility criteria
            </Link>
          </div>
        </div>

        {/* Right: checklist */}
        <div className="flex flex-col gap-2">
          {building.checklist.map((item) => (
            <ChecklistRow key={item.key} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}

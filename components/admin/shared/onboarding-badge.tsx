import { cn } from "@/lib/utils";
import { OnboardingState } from "@/types/admin/account";

/**
 * OnboardingBadge — pill that encodes an account's onboarding state with a
 * leading status dot. Shared between the accounts table and the account
 * detail header so the colour language stays consistent:
 *   COMPLETE            → green   (fully registered)
 *   EMAIL_UNVERIFIED    → red     (email unverified)
 *   BUSINESS_INCOMPLETE → amber   (business pending)
 *   LOCATION_INCOMPLETE → blue    (location pending)
 */

const STATE_CONFIG: Record<
  OnboardingState,
  { label: string; className: string }
> = {
  COMPLETE: { label: "Fully registered", className: "bg-pos-tint text-pos" },
  EMAIL_UNVERIFIED: {
    label: "Email unverified",
    className: "bg-neg-tint text-neg",
  },
  BUSINESS_INCOMPLETE: {
    label: "Business pending",
    className: "bg-warn-tint text-warn",
  },
  LOCATION_INCOMPLETE: {
    label: "Location pending",
    className: "bg-[#2563EB]/10 text-[#2563EB]",
  },
};

export const ONBOARDING_DOT: Record<OnboardingState, string> = {
  COMPLETE: "hsl(var(--pos))",
  EMAIL_UNVERIFIED: "hsl(var(--neg))",
  BUSINESS_INCOMPLETE: "hsl(var(--warn))",
  LOCATION_INCOMPLETE: "#2563EB",
};

export function OnboardingBadge({
  state,
  className,
}: {
  state: OnboardingState | null | undefined;
  className?: string;
}) {
  if (!state) {
    return <span className="text-[12.5px] text-muted-foreground">—</span>;
  }
  const { label, className: tone } = STATE_CONFIG[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold",
        tone,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

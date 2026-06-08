import { cn } from "@/lib/utils";

/**
 * PlanBadge — the small mono plan chip (Starter / Growth / Pro / Enterprise)
 * used in the dashboard tables and the account-detail location tree.
 */

export type PlanTier = "starter" | "growth" | "pro" | "enterprise";

const PLAN_TONE: Record<PlanTier, string> = {
  starter: "bg-black/5 text-ink-3 dark:bg-white/10",
  growth: "bg-[#2563EB]/10 text-[#2563EB]",
  pro: "bg-primary/12 text-[#C25E26]",
  enterprise: "bg-ink text-white",
};

export function planTier(value: string | null | undefined): PlanTier {
  const v = (value ?? "").toLowerCase();
  if (v.includes("enterprise")) return "enterprise";
  if (v.includes("pro")) return "pro";
  if (v.includes("growth")) return "growth";
  return "starter";
}

export function PlanBadge({
  tier,
  label,
  className,
}: {
  tier: PlanTier;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.03em]",
        PLAN_TONE[tier],
        className,
      )}
    >
      {label ?? tier}
    </span>
  );
}

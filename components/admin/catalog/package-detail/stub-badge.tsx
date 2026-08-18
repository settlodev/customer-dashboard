import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface StubBadgeProps {
  className?: string;
  /** Override the default label when the panel needs more context. */
  label?: string;
}

/**
 * Tiny marker shown on analytics panels whose data pipeline isn't live
 * yet. Keeps the UI honest — every chart that says "Live data pending"
 * is using placeholder numbers so reviewers don't act on them.
 */
export function StubBadge({ className, label = "Live data pending" }: StubBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.05em] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" />
      {label}
    </span>
  );
}

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/85",
        outline: "border-line-2 text-ink-2",
        // Status badges — use these for pos/neg/warn UX cues (e.g.
        // stock states, payment outcomes). Keeps semantic colour out
        // of ad-hoc utility soup at the call site.
        pos: "border-transparent bg-pos-tint text-pos",
        neg: "border-transparent bg-neg-tint text-neg",
        warn: "border-transparent bg-warn-tint text-warn",
        // Soft — neutral chip for counts, tags, mono labels.
        soft: "border-line bg-canvas text-ink-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type BadgeTone = "ok" | "open" | "warn" | "neg" | "muted" | "primary";

// Dot-pill tone vocabulary — the `.od-badge` treatment. Distinct from the
// `variant` prop above: `tone` is additive and, when set, takes over
// rendering entirely (see `Badge` below), so every existing `variant`-based
// call site keeps working unchanged.
const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  ok: "bg-pos-tint text-pos",
  open: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  warn: "bg-warn-tint text-warn",
  neg: "bg-neg-tint text-neg",
  muted: "bg-canvas text-ink-3",
  primary: "bg-primary/10 text-primary-dark dark:text-primary",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders the `.od-badge` dot-pill treatment instead of `variant`, using
   *  the design's tone vocabulary. Takes precedence over `variant` when set. */
  tone?: BadgeTone;
  /** Leading status dot — only meaningful together with `tone`. */
  dot?: boolean;
}

function Badge({ className, variant, tone, dot, children, ...props }: BadgeProps) {
  if (tone) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold leading-none",
          BADGE_TONE_CLASSES[tone],
          className,
        )}
        {...props}
      >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        {children}
      </div>
    )
  }
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

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

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

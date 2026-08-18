import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variants — mapped 1-to-1 from the prototype's `dashboard.css`
 * rules so the whole app reads from one vocabulary.
 *
 *   default       → `.btn-secondary` / `.btn-accent`
 *                   primary brand fill (orange) for the most common
 *                   action. Hover deepens to --primary-dark.
 *   accent        → `.btn-primary`
 *                   ink-on-card primary CTA (Linear/Vercel-style).
 *                   Use for the form's "Create product"-style buttons.
 *   outline       → `.btn`
 *                   neutral white-bg / hairline-border / ink text.
 *                   The most common look in the design's data tables
 *                   and toolbars.
 *   ghost         → `.btn-ghost`
 *                   transparent → canvas hover, for tertiary actions.
 *   destructive   → red, dialog "Delete" actions.
 *   success       → pos green, confirm-style actions.
 *   secondary     → shadcn neutral light gray (legacy, rarely used).
 *   link          → underline-only.
 *
 * Base shape (h-9 / 36px / 13px / weight 500 / rounded-md / 6px gap)
 * matches the design's `.btn` definition with one tweak: a 3px primary
 * focus ring at 15% opacity (consistent with Input/Select/etc.).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium tracking-tight transition-[background-color,border-color,color] duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[hsl(var(--primary-dark))] hover:text-primary-foreground",
        accent: "bg-ink text-card shadow-sm hover:bg-ink-2",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        success: "bg-pos text-card shadow-sm hover:bg-pos/90",
        outline:
          "border border-line-2 bg-card text-ink shadow-sm hover:bg-canvas",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "text-ink-2 hover:bg-canvas hover:text-ink",
        link: "h-auto p-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-2",
        xs: "h-7 rounded-md px-2.5 text-[12px]",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        // Square icon-only — matches the design's `.btn-icon` (28×28).
        // Slightly smaller `iconSm` for in-table row actions.
        icon: "h-9 w-9 px-0",
        iconSm: "h-7 w-7 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

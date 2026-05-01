"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion"

import { cn } from "@/lib/utils"

/**
 * Inline alert — page-level persistent message. Distinct from toasts
 * (transient) and the notice bar (fixed top).
 *
 * Visual contract (matches the design's `.alert` rules):
 *   - Layout: 22 px tinted icon disc · body · optional close, in a
 *     CSS grid so multi-line bodies don't push the icon down.
 *   - Tone is set on the wrapper via CSS variables (`--tone`,
 *     `--tone-tint`, `--tone-tint-strong`) so children read the
 *     correct colour without prop drilling.
 *   - Variants: soft (tinted bg, default), outline (border + ink
 *     left stripe, on the canvas), solid (saturated, for emphasis).
 *
 * Tones map cleanly to the rest of the design system — same palette
 * the toast and notice bar use.
 *
 * Usage:
 *
 *   <Alert tone="warning">
 *     <AlertIcon><AlertTriangle className="h-3.5 w-3.5" /></AlertIcon>
 *     <AlertBody>
 *       <AlertTitle>Heads up</AlertTitle>
 *       <AlertDescription>Backup window in 5 minutes.</AlertDescription>
 *     </AlertBody>
 *   </Alert>
 *
 * Backwards-compat: the previous `variant="default" | "destructive"`
 * shape still renders. `destructive` maps to `tone="danger"
 * variant="soft"` so existing call sites pick up the new visual.
 */

// CSS-variable bindings per tone — same trick the toast uses. Each
// children block (icon, tag, action, etc.) just references --tone.
const TONE_STYLES = {
  default:
    "[--tone:hsl(var(--ink))] [--tone-tint:hsl(var(--canvas))] [--tone-tint-strong:hsl(var(--canvas))]",
  success:
    "[--tone:hsl(var(--pos))] [--tone-tint:hsl(var(--pos)/0.10)] [--tone-tint-strong:hsl(var(--pos)/0.16)]",
  info: "[--tone:#4F46E5] [--tone-tint:rgb(79_70_229_/_0.06)] [--tone-tint-strong:rgb(79_70_229_/_0.14)]",
  warning:
    "[--tone:hsl(var(--warn))] [--tone-tint:hsl(var(--warn)/0.12)] [--tone-tint-strong:hsl(var(--warn)/0.18)]",
  danger:
    "[--tone:hsl(var(--neg))] [--tone-tint:hsl(var(--neg)/0.10)] [--tone-tint-strong:hsl(var(--neg)/0.16)]",
} as const

const VARIANT_STYLES = {
  soft: "alert-soft bg-[var(--tone-tint)] border border-[color-mix(in_oklab,var(--tone)_16%,transparent)]",
  outline:
    "alert-outline border border-[color-mix(in_oklab,var(--tone)_28%,hsl(var(--line)))] border-l-[3px] border-l-[var(--tone)] bg-card rounded-lg",
  solid: "alert-solid border border-[var(--tone)] bg-[var(--tone)] text-white",
} as const

const alertVariants = cva(
  // Base shape: 3-col grid (icon | body | close) so the icon sits at
  // the top of the body even when the body wraps to multiple lines.
  [
    "relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-3",
    "rounded-[10px] px-3.5 py-3 text-[13px] leading-snug",
  ].join(" "),
  {
    variants: {
      tone: TONE_STYLES,
      variant: VARIANT_STYLES,
    },
    defaultVariants: {
      tone: "default",
      variant: "soft",
    },
  },
)

type AlertTone = keyof typeof TONE_STYLES
type AlertVariant = keyof typeof VARIANT_STYLES

interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "className">,
    Omit<VariantProps<typeof alertVariants>, "variant"> {
  /**
   * Visual variant. Accepts the new design vocabulary
   * (`soft` / `outline` / `solid`) and the legacy shadcn names
   * (`default` / `destructive`) for backwards-compat.
   */
  variant?: AlertVariant | "default" | "destructive"
  className?: string
}

// Subtle entrance: tiny downward drift + fade. Quick enough that the
// alert reads as "appearing" rather than "animating in". Reduced-motion
// users get an instant render — no transform, no opacity ramp.
const ALERT_ENTER = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const }

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, tone, variant, ...props }, ref) => {
    const reduce = useReducedMotion()
    // Map legacy variant names onto the new shape.
    const isLegacyDestructive = variant === "destructive"
    const resolvedVariant: AlertVariant =
      variant === "soft" || variant === "outline" || variant === "solid"
        ? variant
        : "soft"
    const resolvedTone: AlertTone =
      tone ?? (isLegacyDestructive ? "danger" : "default")

    return (
      <motion.div
        ref={ref}
        role="alert"
        initial={reduce ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : ALERT_ENTER}
        className={cn(
          alertVariants({ tone: resolvedTone, variant: resolvedVariant }),
          className,
        )}
        {...(props as HTMLMotionProps<"div">)}
      />
    )
  },
)
Alert.displayName = "Alert"

/**
 * Tinted icon disc. Pass any 14-px lucide icon as a child.
 * The disc inherits `--tone` from the parent `<Alert>`.
 */
const AlertIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden
    className={cn(
      "mt-0.5 grid h-[22px] w-[22px] place-items-center rounded-full",
      "bg-[var(--tone-tint-strong)] text-[var(--tone)]",
      // Outline variant: border instead of fill on the disc.
      "[.alert-outline_&]:border [.alert-outline_&]:border-[color-mix(in_oklab,var(--tone)_30%,transparent)] [.alert-outline_&]:bg-transparent",
      // Solid variant: white fill, tone-coloured glyph.
      "[.alert-solid_&]:bg-white [.alert-solid_&]:text-[var(--tone)]",
      className,
    )}
    {...props}
  />
))
AlertIcon.displayName = "AlertIcon"

/**
 * Body wrapper — keeps the title, message, list, and actions stacked
 * with consistent spacing. Drop `<AlertTitle>` + `<AlertDescription>`
 * inside.
 */
const AlertBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
AlertBody.displayName = "AlertBody"

/**
 * Mono uppercase tone tag (e.g. "All set", "Heads up", "Action needed").
 * Optional — pair with the title for a more emphatic alert.
 */
const AlertTag = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex flex-shrink-0 items-center rounded-[3px] bg-[var(--tone-tint-strong)] px-1.5 py-px font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-[var(--tone)]",
      "[.alert-solid_&]:bg-white/15 [.alert-solid_&]:text-white",
      className,
    )}
    {...props}
  />
))
AlertTag.displayName = "AlertTag"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "text-[13.5px] font-medium leading-tight tracking-[-0.005em] text-ink",
      "[.alert-solid_&]:text-white",
      className,
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[13px] leading-snug text-ink-2 text-pretty",
      "[.alert-solid_&]:text-white/90",
      "[&_p]:leading-relaxed",
      className,
    )}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

/**
 * Mono uppercase action button — design's `.alert-action`. Renders in
 * the tone colour. Use a regular `<button>` since the alert action is
 * lightweight and doesn't need the full `<Button>` chrome.
 */
const AlertAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "inline-flex shrink-0 items-center rounded-md px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.04em]",
      "border border-[color-mix(in_oklab,var(--tone)_30%,transparent)] bg-[var(--tone-tint-strong)] text-[var(--tone)]",
      "hover:bg-[color-mix(in_oklab,var(--tone)_14%,hsl(var(--card)))] hover:border-[color-mix(in_oklab,var(--tone)_50%,transparent)]",
      "transition-colors focus:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/15",
      "[.alert-solid_&]:bg-white [.alert-solid_&]:border-white [.alert-solid_&]:text-[var(--tone)]",
      className,
    )}
    {...props}
  />
))
AlertAction.displayName = "AlertAction"

/**
 * Dismiss button. Tucks neatly in the third grid column.
 */
const AlertClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="Dismiss"
    className={cn(
      "grid h-[22px] w-[22px] -mt-0.5 place-items-center rounded-md text-muted-2 transition-colors hover:bg-black/5 hover:text-ink",
      "[.alert-solid_&]:text-white/70 [.alert-solid_&]:hover:bg-white/10 [.alert-solid_&]:hover:text-white",
      className,
    )}
    {...props}
  >
    {children ?? (
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path
          d="M2 2l8 8M10 2l-8 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    )}
  </button>
))
AlertClose.displayName = "AlertClose"

export {
  Alert,
  AlertIcon,
  AlertBody,
  AlertTag,
  AlertTitle,
  AlertDescription,
  AlertAction,
  AlertClose,
}

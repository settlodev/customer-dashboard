"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      // Bottom-right stack matching the design's `.toaster` rule.
      "fixed bottom-5 right-5 z-[100] flex max-h-screen w-full flex-col items-end gap-2.5",
      "max-w-[calc(100vw-44px)] sm:max-w-[420px]",
      // On phones the stack hugs both edges so toasts span the screen.
      "max-sm:left-3 max-sm:right-3 max-sm:bottom-3 max-sm:items-stretch",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

/**
 * Toast root — a 380px card with:
 *   - 4px left stripe in tone colour
 *   - tinted icon disc on the left
 *   - mono uppercase tag + ink title + muted message
 *   - close button top-right
 *   - drain bar absolutely positioned at the bottom (rendered separately
 *     by ToastProgress because Radix needs to know the duration)
 *
 * Tone colour rides on the CSS custom property `--tone`, set per
 * variant below. The shared base markup references it for the stripe,
 * icon disc, tag colour, etc. — same trick the design's CSS uses.
 */
const toastVariants = cva(
  [
    "group pointer-events-auto relative grid w-[380px] max-w-full",
    "grid-cols-[26px_1fr_auto] items-start gap-3 overflow-hidden",
    "rounded-xl border bg-card pl-[18px] pr-3.5 py-3",
    "shadow-[0_1px_0_rgba(20,17,12,0.02),0_14px_36px_-14px_rgba(20,17,12,0.18),0_4px_10px_-4px_rgba(20,17,12,0.06)]",
    "before:pointer-events-none before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--tone)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "[--tone:hsl(var(--ink))] [--tone-tint:hsl(var(--canvas))] border-line",
        success:
          "[--tone:hsl(var(--pos))] [--tone-tint:hsl(var(--pos)/0.10)] border-line",
        destructive:
          "[--tone:hsl(var(--neg))] [--tone-tint:hsl(var(--neg)/0.10)] border-[hsl(var(--neg)/0.18)]",
        warning:
          "[--tone:hsl(var(--warn))] [--tone-tint:hsl(var(--warn)/0.12)] border-line",
        info:
          "[--tone:hsl(var(--ink))] [--tone-tint:hsl(var(--canvas))] border-line",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const toastIconMap = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

// Mono uppercase tag rendered next to the title (matches design's
// `.toast-tag` — "Success", "Heads up", "Warning", "Action failed").
const TOAST_TAG_LABEL = {
  default: "Note",
  success: "Success",
  info: "Heads up",
  warning: "Warning",
  destructive: "Action failed",
} as const;

type ToastVariant = "default" | "success" | "destructive" | "warning" | "info";

// Motion config: a quick, slightly-damped spring. Tuned to feel responsive
// without bouncing — business apps should feel confident, not playful.
const toastMotionProps: HTMLMotionProps<"li"> = {
  layout: true,
  initial: { opacity: 0, y: -12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: 0.15, ease: "easeIn" },
  },
  transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.8 },
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
  // `children` must be pulled out of `...props` — otherwise the JSX child
  // (motion.li) overrides `props.children` on Root, and the actual toast
  // content (icon, title, description, close, progress bar) is dropped.
  return (
    <ToastPrimitives.Root ref={ref} asChild {...props}>
      <motion.li
        {...toastMotionProps}
        className={cn(toastVariants({ variant }), className)}
      >
        {children}
      </motion.li>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastIcon = ({ variant }: { variant?: ToastVariant | null }) => {
  const key = variant || "default";
  const Icon = toastIconMap[key];
  if (!Icon) return null;
  return (
    <div
      className={cn(
        "mt-0.5 grid h-[26px] w-[26px] place-items-center rounded-full",
        // The disc inherits the tone via the CSS variables set on the
        // `Toast` root, so it doesn't need to know about the variant.
        "bg-[var(--tone-tint)] text-[var(--tone)]",
      )}
      aria-hidden
    >
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
};

/**
 * Thin progress bar showing auto-dismiss countdown. Uses a CSS transform
 * animation (not framer-motion) because it's a long linear tween — no need
 * to keep it on the JS thread.
 */
const ToastProgress = ({
  duration,
}: {
  duration: number;
  /** Reserved for future per-variant overrides — currently the bar
   *  reads the tone via the parent's `--tone` CSS variable. */
  variant?: ToastVariant | null;
}) => {
  return (
    // Drain bar — sits flush at the bottom, picks up the tone via CSS var
    // so it stays visually tied to the stripe + icon disc + tag.
    <div className="pointer-events-none absolute bottom-0 left-1 right-0 h-[2px]">
      <div
        className="h-full origin-left bg-[var(--tone)] opacity-35"
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // Mono uppercase pill matching the design's `.toast-action`. Picks
      // up tone colour from the parent variant via CSS variables.
      "mt-1.5 inline-flex h-7 shrink-0 items-center justify-center self-start rounded-md px-2.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.04em] transition-colors",
      "border border-[hsl(var(--tone)/0.30)] bg-[var(--tone-tint)] text-[var(--tone)]",
      "hover:bg-[hsl(var(--tone)/0.14)] hover:border-[hsl(var(--tone)/0.50)]",
      "focus:outline-none focus:ring-[3px] focus:ring-primary/15",
      "disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "grid h-[22px] w-[22px] -mt-0.5 place-items-center rounded-md text-muted-2 transition-colors hover:bg-canvas hover:text-ink focus:outline-none focus:ring-[3px] focus:ring-primary/15",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-2.5 w-2.5" strokeWidth={2} />
    <span className="sr-only">Close</span>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

/**
 * Toast title — design has the title sitting next to a small mono
 * uppercase tag (Success / Heads up / Warning / Action failed). The
 * `tag` prop lets the parent (Toaster) choose to render it.
 */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title> & {
    tag?: React.ReactNode;
  }
>(({ className, children, tag, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-2 text-[13.5px] font-medium leading-tight tracking-[-0.005em] text-ink",
      className,
    )}
    {...props}
  >
    {tag && (
      <span className="inline-flex shrink-0 items-center rounded-[3px] bg-[var(--tone-tint)] px-1.5 py-px font-mono text-[9.5px] font-normal uppercase tracking-[0.1em] text-[var(--tone)]">
        {tag}
      </span>
    )}
    {children}
  </ToastPrimitives.Title>
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "mt-1 text-[12.5px] leading-snug text-muted-foreground text-pretty",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  type ToastVariant,
  TOAST_TAG_LABEL,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastIcon,
  ToastProgress,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

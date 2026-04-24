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
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:top-auto sm:bottom-20 md:max-w-[440px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

// Base styles: we disable Radix's built-in CSS animations because framer-motion
// handles mount/unmount instead. Variants set both a tinted background and a
// saturated text color so status toasts read at a glance.
const toastVariants = cva(
  [
    "group pointer-events-auto relative flex w-full items-start gap-3",
    "overflow-hidden rounded-lg border p-4 pr-10",
    "shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
    "backdrop-blur-sm",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success:
          "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-50",
        destructive:
          "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-50",
        warning:
          "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-50",
        info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const toastIconMap = {
  default: null,
  success: CheckCircle2,
  destructive: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const toastIconColorMap = {
  default: "",
  success: "text-emerald-600 dark:text-emerald-400",
  destructive: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
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
    <div className="flex-shrink-0 mt-0.5">
      <Icon className={cn("h-5 w-5", toastIconColorMap[key])} aria-hidden />
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
  variant,
}: {
  duration: number;
  variant?: ToastVariant | null;
}) => {
  const key = variant || "default";
  const colorMap: Record<ToastVariant, string> = {
    default: "bg-foreground/30",
    success: "bg-emerald-500",
    destructive: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-current/[0.08]">
      <div
        className={cn("h-full origin-left", colorMap[key])}
        style={{
          animation: `toast-progress ${duration}ms linear forwards`,
        }}
      />
      {/* Keyframes are scoped inline so consumers don't need to touch tailwind config */}
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
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
      "absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-current opacity-60 transition-all hover:bg-current/10 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
    <span className="sr-only">Close</span>
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold leading-tight tracking-tight",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-sm opacity-80 leading-relaxed mt-1",
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

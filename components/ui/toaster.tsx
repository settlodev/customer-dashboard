"use client";

import { AnimatePresence } from "framer-motion";

import { useToast } from "@/hooks/use-toast";
import {
  TOAST_TAG_LABEL,
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProgress,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastVariant,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      <AnimatePresence mode="popLayout" initial={false}>
        {toasts.map(function ({
          id,
          title,
          description,
          action,
          variant,
          duration,
          open,
          ...props
        }) {
          // Only show the progress bar for auto-dismissing toasts that
          // are currently open — otherwise it would restart on dismiss.
          const showProgress =
            open &&
            typeof duration === "number" &&
            duration > 0 &&
            duration !== Infinity;

          const toastVariant = (variant ?? "default") as ToastVariant;
          const tag = TOAST_TAG_LABEL[toastVariant];

          return (
            <Toast
              key={id}
              variant={variant}
              open={open}
              duration={duration}
              {...props}
            >
              <ToastIcon variant={toastVariant} />
              <div className="flex min-w-0 flex-col gap-0.5">
                {title && <ToastTitle tag={tag}>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
                {action}
              </div>
              <ToastClose />
              {showProgress && (
                <ToastProgress duration={duration!} variant={toastVariant} />
              )}
            </Toast>
          );
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}

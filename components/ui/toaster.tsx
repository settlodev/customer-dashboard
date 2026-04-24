"use client";

import { AnimatePresence } from "framer-motion";

import { useToast } from "@/hooks/use-toast";
import {
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
          // Only show the progress bar for auto-dismissing toasts that are
          // currently open — otherwise it would restart on dismiss.
          const showProgress =
            open &&
            typeof duration === "number" &&
            duration > 0 &&
            duration !== Infinity;

          return (
            <Toast
              key={id}
              variant={variant}
              open={open}
              duration={duration}
              {...props}
            >
              <ToastIcon variant={variant as ToastVariant} />
              <div className="grid gap-0.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>
                    {typeof description === "string"
                      ? description
                      : description}
                  </ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
              {showProgress && (
                <ToastProgress
                  duration={duration!}
                  variant={variant as ToastVariant}
                />
              )}
            </Toast>
          );
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}

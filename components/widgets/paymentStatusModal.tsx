"use client";

import React from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentStatusModalProps {
  isOpen: boolean;
  status?:
    | "INITIATING"
    | "PENDING"
    | "PROCESSING"
    | "FAILED"
    | "SUCCESS"
    | null;
  onClose: () => void;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  INITIATING: {
    title: "Initiating Payment",
    description: "Please wait while we prepare your payment request.",
    progress: 20,
    icon: CreditCard,
    iconClass: "text-blue-500",
    iconBg: "bg-blue-50",
    ringClass: "ring-blue-100",
    progressClass: "bg-blue-500",
    showClose: false,
    closable: false,
  },
  PENDING: {
    title: "Awaiting Confirmation",
    description: "Check your phone and complete the M-Pesa prompt to proceed.",
    progress: 45,
    icon: Loader2,
    iconClass: "text-amber-500 animate-spin",
    iconBg: "bg-amber-50",
    ringClass: "ring-amber-100",
    progressClass: "bg-amber-500",
    showClose: false,
    closable: false,
  },
  PROCESSING: {
    title: "Verifying Payment",
    description: "Your payment is being verified. This may take a moment.",
    progress: 75,
    icon: Loader2,
    iconClass: "text-blue-500 animate-spin",
    iconBg: "bg-blue-50",
    ringClass: "ring-blue-100",
    progressClass: "bg-blue-500",
    showClose: false,
    closable: false,
  },
  SUCCESS: {
    title: "Payment Successful",
    description: "Your subscription has been activated. You're all set!",
    progress: 100,
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    iconBg: "bg-emerald-50",
    ringClass: "ring-emerald-100",
    progressClass: "bg-emerald-500",
    showClose: true,
    closable: true,
    closeLabel: "Continue",
    closeClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  FAILED: {
    title: "Payment Failed",
    description: "Something went wrong. Please try again or contact support.",
    progress: 100,
    icon: XCircle,
    iconClass: "text-red-500",
    iconBg: "bg-red-50",
    ringClass: "ring-red-100",
    progressClass: "bg-red-500",
    showClose: true,
    closable: true,
    closeLabel: "Try Again",
    closeClass: "bg-red-600 hover:bg-red-700 text-white",
  },
} as const;

// ─── Animated progress bar ────────────────────────────────────────────────────

function ProgressBar({
  value,
  colorClass,
  indeterminate,
}: {
  value: number;
  colorClass: string;
  indeterminate?: boolean;
}) {
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      {indeterminate ? (
        // Indeterminate — sliding animation for processing states
        <div
          className={cn(
            "h-full w-1/3 rounded-full",
            colorClass,
            "animate-[slide_1.4s_ease-in-out_infinite]",
          )}
          style={{
            animation: "slide 1.4s ease-in-out infinite",
          }}
        />
      ) : (
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colorClass,
          )}
          style={{ width: `${value}%` }}
        />
      )}
    </div>
  );
}

// ─── Step dots ────────────────────────────────────────────────────────────────

const STEPS = ["Initiate", "Pending", "Verify", "Complete"] as const;
const STEP_MAP: Record<string, number> = {
  INITIATING: 0,
  PENDING: 1,
  PROCESSING: 2,
  SUCCESS: 3,
  FAILED: 3,
};

function StepIndicator({
  status,
  isFailed,
}: {
  status: string;
  isFailed: boolean;
}) {
  const activeStep = STEP_MAP[status] ?? 0;

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const isComplete = i < activeStep;
        const isActive = i === activeStep;
        const isFail = isFailed && i === activeStep;

        return (
          <React.Fragment key={step}>
            {/* Dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  isFail
                    ? "bg-red-500 ring-4 ring-red-100"
                    : isActive
                      ? "bg-blue-500 ring-4 ring-blue-100 scale-125"
                      : isComplete
                        ? "bg-emerald-500"
                        : "bg-gray-200",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium whitespace-nowrap",
                  isFail
                    ? "text-red-500"
                    : isActive
                      ? "text-gray-700"
                      : isComplete
                        ? "text-emerald-600"
                        : "text-gray-300",
                )}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-10 sm:w-14 mb-3.5 transition-all duration-500",
                  i < activeStep ? "bg-emerald-400" : "bg-gray-200",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  isOpen,
  status,
  onClose,
}) => {
  if (!isOpen) return null;

  const cfg =
    STATUS_CONFIG[status ?? "INITIATING"] ?? STATUS_CONFIG["INITIATING"];
  const Icon = cfg.icon;
  const isTerminal = status === "SUCCESS" || status === "FAILED";
  const isFailed = status === "FAILED";

  return (
    <>
      {/* Inline keyframes for the indeterminate bar */}
      <style>{`
        @keyframes slide {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        aria-modal="true"
        role="dialog"
      >
        {/* Blurred dark overlay */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={isTerminal ? onClose : undefined}
        />

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
          {/* Top accent bar */}
          <div
            className={cn(
              "h-1 w-full transition-all duration-700",
              isFailed
                ? "bg-red-500"
                : status === "SUCCESS"
                  ? "bg-emerald-500"
                  : "bg-blue-500",
            )}
          />

          <div className="px-6 pt-7 pb-6 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl ring-8",
                  cfg.iconBg,
                  cfg.ringClass,
                )}
              >
                <Icon className={cn("h-7 w-7", cfg.iconClass)} />
              </div>
            </div>

            {/* Title + description */}
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-gray-900">{cfg.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {cfg.description}
              </p>
            </div>

            {/* Step indicator */}
            <StepIndicator
              status={status ?? "INITIATING"}
              isFailed={isFailed}
            />

            {/* Progress bar */}
            <ProgressBar
              value={cfg.progress}
              colorClass={cfg.progressClass}
              indeterminate={!isTerminal}
            />

            {/* Processing hint */}
            {!isTerminal && (
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure payment — do not close this window
              </p>
            )}

            {/* Close / action button */}
            {isTerminal && "closeLabel" in cfg && (
              <button
                onClick={onClose}
                className={cn(
                  "w-full h-10 rounded-xl text-sm font-semibold transition-all",
                  cfg.closeClass,
                )}
              >
                {cfg.closeLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentStatusModal;

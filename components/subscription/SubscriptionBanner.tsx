"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEntitlements } from "@/context/entitlementContext";
import { cn } from "@/lib/utils";

/**
 * Notice bar at the very top of the protected layout.
 *
 * Visual: 36 px tall fixed strip with three tones, lifted from the
 * design's `.notice-bar` rules:
 *   - `trial`  — dark ink + cream text + orange tag/CTA (most common
 *                 state; a friendly, persistent reminder)
 *   - `warn`   — cream/amber wash for non-blocking concerns (active
 *                expiring, past-due grace)
 *   - `danger` — rosy/red wash for hard-block states (expired,
 *                suspended)
 *
 * Layout: [icon] [uppercase mono tag] [bold message] | [mono meta] · spacer · [CTA] [×]
 *
 * States (priority order — unchanged):
 *   1. SUSPENDED  — hard block, contact support               → danger
 *   2. EXPIRED    — renew now                                  → danger
 *   3. PAST_DUE   — grace period, payment overdue countdown   → warn
 *   4. ACTIVE, expiring ≤ 5 days — renewal reminder           → warn
 *   5. TRIAL, expiring ≤ 3 days  — trial ending soon          → warn
 *   6. TRIAL      — always shown, days remaining              → trial
 *   7. ACTIVE (healthy) — no banner
 */

// How many days before expiry to start warning
const ACTIVE_WARNING_DAYS = 5;
const TRIAL_URGENT_DAYS = 3;

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

function formatTimeRemaining(dateStr: string): string {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return "now";

  const dayMs = 1000 * 60 * 60 * 24;

  if (diff >= dayMs) {
    const days = Math.ceil(diff / dayMs);
    return days === 1 ? "1 day" : `${days} days`;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return hours === 1 ? "1 hour" : `${hours} hours`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} min`;
}

type BannerTone = "trial" | "warn" | "danger";

type BannerVariant = {
  tone: BannerTone;
  icon: React.ReactNode;
  /** Mono uppercase tag rendered next to the message. */
  tag: string;
  /** Plain-language message (max ~80 chars to avoid truncation). */
  message: string;
  /** Mono countdown / context line ("Expires in 2 days"). */
  meta?: string;
  actionLabel?: string;
  actionHref?: string;
  dismissible: boolean;
};

const TONE_STYLES: Record<
  BannerTone,
  {
    bar: string;
    tag: string;
    icon: string;
    cta: string;
    close: string;
  }
> = {
  trial: {
    bar: "bg-[#1A1815] text-[#F7F3E8] border-line",
    tag: "bg-white/10 text-[#F7F3E8]",
    icon: "text-primary",
    cta: "bg-primary text-white hover:bg-[hsl(var(--primary-dark))]",
    close: "hover:bg-white/10",
  },
  warn: {
    bar: "bg-[#FBF1DC] text-[#5A4218] border-[hsl(var(--warn)/0.25)]",
    tag: "bg-[hsl(var(--warn)/0.20)] text-[#6B4F1F]",
    icon: "text-warn",
    cta: "bg-warn text-white hover:bg-[#A6741F]",
    close: "hover:bg-black/10",
  },
  danger: {
    bar: "bg-[#FBE7E2] text-[#6B2516] border-[hsl(var(--neg)/0.30)]",
    tag: "bg-[hsl(var(--neg)/0.18)] text-[#8C2D1B]",
    icon: "text-neg",
    cta: "bg-neg text-white hover:bg-[#A53520]",
    close: "hover:bg-black/10",
  },
};

export function SubscriptionBanner() {
  const {
    subscriptionStatus,
    isTrial,
    isExpired,
    isSuspended,
    isPastDue,
    paidThrough,
    trialEndDate,
    loading,
  } = useEntitlements();

  const [, setTick] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Tick every 60 seconds to update the countdown
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Reset dismissed state when subscription status changes
  useEffect(() => {
    setDismissed(false);
  }, [subscriptionStatus]);

  // Compute variant up-front so we can publish the banner height to a
  // CSS variable (`--banner-h`) before the conditional return below.
  // React requires hooks to be called unconditionally, so the variable
  // useEffect has to live above any `return null`.
  // For trial states use trialEndDate as the countdown target (the primary
  // trial signal); for all other states fall back to paidThrough.
  const trialCountdownDate = isTrial ? (trialEndDate ?? paidThrough) : null;
  const nonTrialCountdownDate = !isTrial ? paidThrough : null;

  const daysLeft = trialCountdownDate
    ? getDaysUntil(trialCountdownDate)
    : nonTrialCountdownDate
      ? getDaysUntil(nonTrialCountdownDate)
      : null;
  const timeLeft = trialCountdownDate
    ? formatTimeRemaining(trialCountdownDate)
    : nonTrialCountdownDate
      ? formatTimeRemaining(nonTrialCountdownDate)
      : null;

  let variant: BannerVariant | null = null;

  if (isSuspended) {
    variant = {
      tone: "danger",
      icon: <ShieldAlert className="h-3.5 w-3.5" />,
      tag: "Account suspended",
      message:
        "Your subscription has been suspended. Contact support to reactivate.",
      dismissible: false,
    };
  } else if (isExpired) {
    variant = {
      tone: "danger",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tag: "Expired",
      message: "Your subscription has expired — renew to keep making changes.",
      actionLabel: "Renew now",
      actionHref: "/billing",
      dismissible: false,
    };
  } else if (isPastDue) {
    variant = {
      tone: "warn",
      icon: <Clock className="h-3.5 w-3.5" />,
      tag: "Payment overdue",
      message: "Update your billing to avoid interruption.",
      meta: timeLeft ? `Service stops in ${timeLeft}` : undefined,
      actionLabel: "Update billing",
      actionHref: "/billing",
      dismissible: false,
    };
  } else if (
    subscriptionStatus === "ACTIVE" &&
    daysLeft !== null &&
    daysLeft <= ACTIVE_WARNING_DAYS
  ) {
    variant = {
      tone: "warn",
      icon: <Clock className="h-3.5 w-3.5" />,
      tag: "Expiring soon",
      message: "Renew to avoid interruption.",
      meta: timeLeft ? `Expires in ${timeLeft}` : undefined,
      actionLabel: "Renew",
      actionHref: "/billing",
      dismissible: true,
    };
  } else if (isTrial && daysLeft !== null && daysLeft <= TRIAL_URGENT_DAYS) {
    variant = {
      tone: "warn",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      tag: "Trial ending",
      message: "Subscribe now to keep access to all features.",
      meta: timeLeft ? `Ends in ${timeLeft}` : undefined,
      actionLabel: "Subscribe now",
      actionHref: "/billing",
      dismissible: false,
    };
  } else if (isTrial) {
    variant = {
      tone: "trial",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      tag: "Free trial",
      message: "Explore every feature — subscribe when ready.",
      meta: timeLeft ? `${timeLeft} remaining` : undefined,
      actionLabel: "View plans",
      actionHref: "/billing",
      dismissible: true,
    };
  }

  // Publish banner height as a CSS variable so other layout pieces can
  // reserve space (e.g., the mobile sidebar Sheet uses it for its
  // `top` so it starts below the banner instead of being clipped by
  // it). Resets to 0 when the banner isn't shown.
  const isShowing = !loading && !dismissed && variant !== null;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--banner-h", isShowing ? "36px" : "0px");
    return () => {
      root.style.setProperty("--banner-h", "0px");
    };
  }, [isShowing]);

  if (!isShowing || !variant) return null;

  const styles = TONE_STYLES[variant.tone];

  return (
    <div
      role={variant.tone === "danger" ? "alert" : "status"}
      className={cn(
        "relative z-[60] flex h-9 items-stretch border-b text-[12.5px]",
        styles.bar,
      )}
    >
      <div className="flex flex-1 items-center gap-2.5 px-4 min-w-0">
        <span className={cn("inline-grid place-items-center flex-shrink-0", styles.icon)}>
          {variant.icon}
        </span>
        <span
          className={cn(
            "inline-flex flex-shrink-0 items-center rounded-[3px] px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.1em]",
            styles.tag,
          )}
        >
          {variant.tag}
        </span>
        <span className="truncate font-medium">{variant.message}</span>
        {variant.meta && (
          <span className="hidden truncate font-mono text-[11px] opacity-70 sm:inline border-l border-current/25 pl-2.5">
            {variant.meta}
          </span>
        )}
        <span className="flex-1" />

        {variant.actionLabel && variant.actionHref && (
          <Link
            href={variant.actionHref}
            className={cn(
              "flex-shrink-0 rounded-md px-3 py-1 text-[12px] font-medium tracking-[-0.005em] transition-colors",
              styles.cta,
            )}
          >
            {variant.actionLabel}
          </Link>
        )}
        {variant.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className={cn(
              "ml-0.5 grid h-5.5 w-5.5 flex-shrink-0 place-items-center rounded-md opacity-55 transition-[opacity,background-color] hover:opacity-100",
              styles.close,
            )}
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

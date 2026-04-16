"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useEntitlements } from "@/context/entitlementContext";

/**
 * Context-aware subscription banner displayed at the top of the dashboard.
 *
 * States (in priority order):
 *   1. SUSPENDED  — hard block, contact support
 *   2. EXPIRED    — renew now
 *   3. PAST_DUE   — grace period, payment overdue with countdown
 *   4. ACTIVE, expiring within 5 days — renewal reminder with countdown
 *   5. TRIAL, expiring within 3 days — trial ending soon with countdown
 *   6. TRIAL      — always shown, days remaining
 *   7. ACTIVE (healthy) — no banner
 *
 * The countdown updates every minute for real-time display.
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

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 1) return `${days} days`;
  if (days === 1) return `1 day, ${hours}h`;
  if (hours > 0) return `${hours} hours`;

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} min`;
}

type BannerVariant = {
  bg: string;
  border: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  dismissible: boolean;
};

export function SubscriptionBanner() {
  const {
    subscriptionStatus,
    isTrial,
    isExpired,
    isSuspended,
    isPastDue,
    paidThrough,
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

  if (loading || dismissed) return null;

  const daysLeft = paidThrough ? getDaysUntil(paidThrough) : null;
  const timeLeft = paidThrough ? formatTimeRemaining(paidThrough) : null;

  let variant: BannerVariant | null = null;

  if (isSuspended) {
    variant = {
      bg: "bg-red-600",
      border: "border-red-700",
      icon: <ShieldAlert className="h-4 w-4" />,
      title: "Account Suspended",
      message: "Your subscription has been suspended. Please contact support to reactivate your account.",
      dismissible: false,
    };
  } else if (isExpired) {
    variant = {
      bg: "bg-red-500",
      border: "border-red-600",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Subscription Expired",
      message: "Your subscription has expired. Renew now to continue making changes.",
      actionLabel: "Renew Now",
      actionHref: "/renew-subscription",
      dismissible: false,
    };
  } else if (isPastDue) {
    variant = {
      bg: "bg-amber-500",
      border: "border-amber-600",
      icon: <Clock className="h-4 w-4" />,
      title: "Payment Overdue",
      message: daysLeft !== null
        ? `Your payment is overdue. Service will be interrupted in ${timeLeft}. Please update your billing.`
        : "Your payment is overdue. Please update your billing to avoid interruption.",
      actionLabel: "Update Billing",
      actionHref: "/renew-subscription",
      dismissible: false,
    };
  } else if (subscriptionStatus === "ACTIVE" && daysLeft !== null && daysLeft <= ACTIVE_WARNING_DAYS) {
    variant = {
      bg: "bg-amber-500",
      border: "border-amber-600",
      icon: <Clock className="h-4 w-4" />,
      title: "Subscription Expiring Soon",
      message: `Your subscription expires in ${timeLeft}. Renew now to avoid interruption.`,
      actionLabel: "Renew",
      actionHref: "/renew-subscription",
      dismissible: true,
    };
  } else if (isTrial && daysLeft !== null && daysLeft <= TRIAL_URGENT_DAYS) {
    variant = {
      bg: "bg-orange-500",
      border: "border-orange-600",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Trial Ending Soon",
      message: `Your free trial ends in ${timeLeft}. Subscribe now to keep access to all features.`,
      actionLabel: "Subscribe Now",
      actionHref: "/renew-subscription",
      dismissible: false,
    };
  } else if (isTrial) {
    variant = {
      bg: "bg-blue-500",
      border: "border-blue-600",
      icon: <Sparkles className="h-4 w-4" />,
      title: "Free Trial",
      message: daysLeft !== null
        ? `You have ${timeLeft} left on your free trial. Explore all features and subscribe when ready.`
        : "You are on a free trial. Subscribe to keep access after it ends.",
      actionLabel: "View Plans",
      actionHref: "/renew-subscription",
      dismissible: true,
    };
  }

  if (!variant) return null;

  return (
    <div
      className={`${variant.bg} ${variant.border} border-b text-white text-sm`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex-shrink-0">{variant.icon}</span>
          <span className="font-medium flex-shrink-0">{variant.title}</span>
          <span className="hidden sm:inline text-white/90 truncate">
            &mdash; {variant.message}
          </span>
          <span className="sm:hidden text-white/90 truncate">
            {variant.message}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {variant.actionLabel && variant.actionHref && (
            <Link
              href={variant.actionHref}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              {variant.actionLabel}
            </Link>
          )}
          {variant.dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

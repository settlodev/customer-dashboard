"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/context/entitlementContext";

/**
 * Full-page upgrade prompt shown when a user navigates to a feature
 * their current plan doesn't include. Designed to entice, not block.
 */
export function UpgradePagePrompt({
  feature,
  title,
  description,
  benefits,
}: {
  feature: string;
  title: string;
  description: string;
  benefits?: string[];
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 min-h-[60vh]">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 text-left space-y-3">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="space-y-3">
          <Link href="/renew-subscription">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              Upgrade Your Plan
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Unlock {feature} and more with a plan upgrade
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline upgrade badge shown next to menu items or buttons
 * for features not in the current plan.
 */
export function UpgradeBadge({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-400 ${className ?? ""}`}
    >
      <Sparkles className="h-2.5 w-2.5" />
      PRO
    </span>
  );
}

/**
 * Small inline lock icon with tooltip for locked features.
 */
export function FeatureLock() {
  return (
    <Lock className="h-3 w-3 text-amber-500 dark:text-amber-400 flex-shrink-0" />
  );
}

/**
 * Wrapper that checks entitlements for the current entity.
 * If the feature is available, renders children.
 * If not, renders the upgrade prompt instead.
 */
export function FeatureGate({
  children,
  entityId,
  featureKey,
  featureTitle,
  featureDescription,
  benefits,
}: {
  children: React.ReactNode;
  entityId: string;
  featureKey: string;
  featureTitle: string;
  featureDescription: string;
  benefits?: string[];
}) {
  const { hasFeature, loading } = useEntitlements();

  // While loading or if no entitlement data, show the feature (permissive)
  if (loading) return <>{children}</>;

  if (!hasFeature(entityId, featureKey)) {
    return (
      <UpgradePagePrompt
        feature={featureTitle}
        title={`Unlock ${featureTitle}`}
        description={featureDescription}
        benefits={benefits}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Limit gate — shows upgrade prompt when a limit is reached.
 * Renders children normally if within limit.
 */
export function LimitGate({
  children,
  entityId,
  limitKey,
  currentCount,
  limitLabel,
  upgradeChildren,
}: {
  children: React.ReactNode;
  entityId: string;
  limitKey: string;
  currentCount: number;
  limitLabel: string;
  upgradeChildren?: React.ReactNode;
}) {
  const { isWithinLimit, loading, getEntityItem } = useEntitlements();

  if (loading) return <>{children}</>;

  if (!isWithinLimit(entityId, limitKey, currentCount)) {
    const item = getEntityItem(entityId);
    const limit = item?.limits[limitKey];

    if (upgradeChildren) return <>{upgradeChildren}</>;

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
        <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {limitLabel} limit reached ({limit})
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Upgrade your plan to add more
          </p>
        </div>
        <Link href="/renew-subscription">
          <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

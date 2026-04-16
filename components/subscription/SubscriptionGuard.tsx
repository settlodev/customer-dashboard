"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEntitlements } from "@/context/entitlementContext";
import { getFeatureMeta, type FeatureKey } from "@/lib/features";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  /** The entitlement feature key to check (from lib/features.ts) */
  featureKey: FeatureKey;
  /** Entity ID (location/warehouse/store) to check. If omitted, checks aggregated features. */
  entityId?: string;
  /** Custom fallback when feature is locked */
  fallback?: React.ReactNode;
  /** Show the upgrade prompt (default true) */
  showUpgradePrompt?: boolean;
}

export function SubscriptionGuard({
  children,
  featureKey,
  entityId,
  fallback,
  showUpgradePrompt = true,
}: SubscriptionGuardProps) {
  const { entitlements, hasFeature, loading } = useEntitlements();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-600">Checking access...</span>
      </div>
    );
  }

  // Permissive when no entitlement data (billing service not configured)
  if (!entitlements) {
    return <>{children}</>;
  }

  // Check feature: either per-entity or aggregated
  const hasAccess = entityId
    ? hasFeature(entityId, featureKey)
    : entitlements.features[featureKey] === true;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Feature is locked
  if (fallback) return <>{fallback}</>;

  const meta = getFeatureMeta(featureKey);
  const title = meta?.title ?? featureKey;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-orange-500" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {meta?.description && (
            <p className="mt-2 text-sm text-gray-600">{meta.description}</p>
          )}
        </div>

        {meta?.benefits && meta.benefits.length > 0 && (
          <ul className="text-left space-y-2">
            {meta.benefits.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        {showUpgradePrompt && (
          <Alert className="bg-orange-50 border-orange-200">
            <AlertDescription className="text-sm text-orange-800">
              This feature is not included in your current plan.
              <div className="mt-3">
                <Link href="/renew-subscription">
                  <Button size="sm" className="bg-primary hover:bg-orange-600 text-white">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

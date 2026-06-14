"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EntitlementResponse, EntitlementItem } from "@/lib/actions/entitlement-actions";
import type { SubscriptionStatus } from "@/types/types";
import { isInTrial } from "@/components/billing/shared";

interface EntitlementContextType {
  entitlements: EntitlementResponse | null;
  loading: boolean;
  /** Get the entitlement item for a specific entity (location/warehouse/store) */
  getEntityItem: (entityId: string) => EntitlementItem | null;
  /** Check if the current entity has a feature. Returns true if no entitlement data (permissive). */
  hasFeature: (entityId: string, featureKey: string) => boolean;
  /** Check if within a limit. -1 = unlimited. Returns true if no entitlement data. */
  isWithinLimit: (entityId: string, limitKey: string, currentCount: number) => boolean;
  /** Get the package name for an entity */
  getPackageName: (entityId: string) => string | null;

  // Subscription status helpers
  subscriptionStatus: SubscriptionStatus;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isPastDue: boolean;
  /** Date the subscription is paid through (ISO string or null) */
  paidThrough: string | null;
  /** Date the business trial ends (ISO string or null). Non-null + future = actively trialing. */
  trialEndDate: string | null;
}

const EntitlementContext = createContext<EntitlementContextType>({
  entitlements: null,
  loading: true,
  getEntityItem: () => null,
  hasFeature: () => true,
  isWithinLimit: () => true,
  getPackageName: () => null,
  subscriptionStatus: null,
  isActive: true,
  isTrial: false,
  isExpired: false,
  isSuspended: false,
  isPastDue: false,
  paidThrough: null,
  trialEndDate: null,
});

export function EntitlementProvider({
  children,
  initialEntitlements = null,
}: {
  children: React.ReactNode;
  initialEntitlements?: EntitlementResponse | null;
}) {
  const [entitlements, setEntitlements] = useState<EntitlementResponse | null>(initialEntitlements);
  const [loading, setLoading] = useState(!initialEntitlements);

  useEffect(() => {
    if (initialEntitlements) {
      setEntitlements(initialEntitlements);
      setLoading(false);
    }
  }, [initialEntitlements]);

  const getEntityItem = (entityId: string): EntitlementItem | null => {
    if (!entitlements) return null;
    return entitlements.items.find((item) => item.entityId === entityId) ?? null;
  };

  const hasFeature = (entityId: string, featureKey: string): boolean => {
    const item = getEntityItem(entityId);
    if (!item) return true; // permissive when no data
    return item.features[featureKey] === true;
  };

  const isWithinLimit = (entityId: string, limitKey: string, currentCount: number): boolean => {
    const item = getEntityItem(entityId);
    if (!item) return true;
    const limit = item.limits[limitKey];
    if (limit === undefined || limit === -1) return true;
    return currentCount < limit;
  };

  const getPackageName = (entityId: string): string | null => {
    const item = getEntityItem(entityId);
    return item?.packageName ?? null;
  };

  // Derive status from entitlements.
  // Primary trial signal: a future trialEndDate on the entitlement response.
  // Fallback: status === "TRIAL" from the subscription header (retained for
  // backends that haven't yet surfaced trialEndDate on the entitlement endpoint).
  const status = entitlements?.subscriptionStatus ?? null;
  const trialEndDate = entitlements?.trialEndDate ?? null;
  const isTrial = isInTrial(trialEndDate) || status === "TRIAL";
  const isActive = status === "ACTIVE" || status === "PAST_DUE" || isTrial || status === null;
  const isExpired = status === "EXPIRED";
  const isSuspended = status === "SUSPENDED";
  const isPastDue = status === "PAST_DUE";
  const paidThrough = entitlements?.paidThrough ?? null;

  return (
    <EntitlementContext.Provider
      value={{
        entitlements,
        loading,
        getEntityItem,
        hasFeature,
        isWithinLimit,
        getPackageName,
        subscriptionStatus: status,
        isActive,
        isTrial,
        isExpired,
        isSuspended,
        isPastDue,
        paidThrough,
        trialEndDate,
      }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementContext);
}

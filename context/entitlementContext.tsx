"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { EntitlementResponse, EntitlementItem } from "@/lib/actions/entitlement-actions";

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
}

const EntitlementContext = createContext<EntitlementContextType>({
  entitlements: null,
  loading: true,
  getEntityItem: () => null,
  hasFeature: () => true,
  isWithinLimit: () => true,
  getPackageName: () => null,
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

  return (
    <EntitlementContext.Provider
      value={{ entitlements, loading, getEntityItem, hasFeature, isWithinLimit, getPackageName }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlements() {
  return useContext(EntitlementContext);
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentSubscription, getPackages } from "@/lib/actions/billing-actions";
import type { Subscription, Package } from "@/types/billing/types";

export function useSubscriptionData() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sub, pkgs] = await Promise.all([
        getCurrentSubscription(),
        getPackages(),
      ]);
      setSubscription(sub);
      setPackages(pkgs);
    } catch {
      // Permissive — if billing service is down, show empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { subscription, packages, isLoading, refetch: fetch };
}

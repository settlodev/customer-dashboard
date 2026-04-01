"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { SubscriptionStatus } from "@/types/types";

interface SubscriptionContextType {
  status: SubscriptionStatus;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isPastDue: boolean;
  isReadOnly: boolean;
  setStatus: (status: SubscriptionStatus) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  status: null,
  isActive: true,
  isTrial: false,
  isExpired: false,
  isSuspended: false,
  isPastDue: false,
  isReadOnly: false,
  setStatus: () => {},
});

export function SubscriptionProvider({
  children,
  initialStatus = null,
}: {
  children: React.ReactNode;
  initialStatus?: SubscriptionStatus;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(initialStatus);

  useEffect(() => {
    if (initialStatus !== undefined) {
      setStatus(initialStatus);
    }
  }, [initialStatus]);

  const isActive = status === "ACTIVE" || status === "TRIAL" || status === "PAST_DUE" || status === null;
  const isTrial = status === "TRIAL";
  const isExpired = status === "EXPIRED";
  const isSuspended = status === "SUSPENDED";
  const isPastDue = status === "PAST_DUE";
  // EXPIRED = read-only (can view but not create/edit), SUSPENDED = fully locked
  const isReadOnly = status === "EXPIRED";

  return (
    <SubscriptionContext.Provider
      value={{ status, isActive, isTrial, isExpired, isSuspended, isPastDue, isReadOnly, setStatus }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}

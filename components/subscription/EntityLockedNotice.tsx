"use client";

import React from "react";
import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Per-entity access paywall. Shown in place of an entity's operational content when that entity's
 * OWN subscription blocks access — either it has lapsed (`expired`) or it is a new pay-first store
 * still awaiting its first payment (`unpaid`). Each entity (location/warehouse/store) expires
 * separately, so this is scoped to one entity's view, not the whole dashboard.
 */
export function EntityLockedNotice({
  entityType,
  reason,
  onSetup,
}: {
  entityType: "LOCATION" | "WAREHOUSE" | "STORE";
  reason: "expired" | "unpaid";
  onSetup?: () => void;
}) {
  const label = entityType.toLowerCase();
  const title =
    reason === "unpaid"
      ? `Activate this ${label}`
      : `This ${label}'s subscription has expired`;
  const body =
    reason === "unpaid"
      ? `This ${label} is locked until its subscription is paid. Complete the payment to start using it.`
      : `Access is locked until the subscription is renewed. Pay the outstanding invoice to restore access.`;
  const cta = reason === "unpaid" ? "Set up subscription" : "Renew subscription";

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <Lock className="h-8 w-8 text-orange-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        </div>
        {onSetup && (
          <Button onClick={onSetup} className="bg-primary text-white hover:bg-orange-600">
            <CreditCard className="mr-2 h-4 w-4" />
            {cta}
          </Button>
        )}
      </div>
    </div>
  );
}

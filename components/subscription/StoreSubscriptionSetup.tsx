"use client";

import EntitySubscriptionSetup from "@/components/subscription/EntitySubscriptionSetup";

interface StoreSubscriptionSetupProps {
  storeId: string;
  storeName: string;
  businessId: string;
  locationId: string;
}

export default function StoreSubscriptionSetup({
  storeId,
  storeName,
  businessId,
  locationId,
}: StoreSubscriptionSetupProps) {
  return (
    <EntitySubscriptionSetup
      entityType="STORE"
      entityId={storeId}
      entityName={storeName}
      businessId={businessId}
      locationId={locationId}
    />
  );
}

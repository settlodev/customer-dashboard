import type { PlanTier } from "@/components/admin/shared/plan-badge";
import type { SubscriptionItemStatus } from "@/types/admin/billing";

export type AccountEntityType = "LOCATION" | "WAREHOUSE" | "STORE";

export interface AccountEntityNode {
  id: string;
  entityType: AccountEntityType;
  name: string;
  meta: string; // identifier / code · region, etc.
  planLabel: string | null;
  planTier: PlanTier | null;
  status: SubscriptionItemStatus | null;
  trialEndDate: string | null;
  href: string | null; // /locations/[id] for LOCATION; null for WAREHOUSE/STORE (Phase 4)
}

export interface AccountStructureBusiness {
  businessId: string;
  locations: AccountEntityNode[];
  warehouses: AccountEntityNode[];
  stores: AccountEntityNode[];
}

/** Keyed by businessId for O(1) merge into the insights business spine. */
export type AccountStructure = Record<string, AccountStructureBusiness>;

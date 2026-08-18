"use server";

import {
  listAdminBusinessLocations,
  listAdminBusinessWarehouses,
  listAdminBusinessStores,
} from "@/lib/actions/admin/businesses";
import { getBusinessSubscription } from "@/lib/actions/admin/billing";
import { planTier } from "@/components/admin/shared/plan-badge";
import type { SubscriptionItemResponse } from "@/types/admin/billing";
import type {
  AccountEntityNode,
  AccountEntityType,
  AccountStructure,
  AccountStructureBusiness,
} from "@/types/admin/account-structure";

function nodeFrom(
  entityType: AccountEntityType,
  raw: { id: string; name: string; identifier: string; code?: string | null; region?: string | null },
  item: SubscriptionItemResponse | null,
): AccountEntityNode {
  const planLabel = item?.packageInfo?.name ?? null;
  return {
    id: raw.id,
    entityType,
    name: raw.name,
    meta: [raw.code ?? raw.identifier, raw.region ?? null].filter(Boolean).join(" · "),
    planLabel,
    planTier: planLabel ? planTier(planLabel) : null,
    status: item?.status ?? null,
    trialEndDate: item?.trialEndDate ?? null,
    href:
      entityType === "LOCATION"
        ? `/locations/${raw.id}`
        : entityType === "WAREHOUSE"
          ? `/warehouses/${raw.id}`
          : `/stores/${raw.id}`,
  };
}

/**
 * Authoritative per-business entity tree: joins the accounts entity-lists
 * (names) with the billing subscription (plan/status by entityId). Each fetch
 * is resilient (failure -> empty), so a partial outage doesn't blank the tree.
 * NOTE: re-fetches getBusinessSubscription per business (getAccountInsights
 * also fetches it for the rollup) — acceptable; consolidate later if needed.
 */
export async function getAccountStructure(
  businesses: { id: string }[],
): Promise<AccountStructure> {
  const entries = await Promise.all(
    businesses.map(async ({ id: businessId }) => {
      const [locs, whs, sts, sub] = await Promise.all([
        listAdminBusinessLocations(businessId).catch(() => []),
        listAdminBusinessWarehouses(businessId).catch(() => []),
        listAdminBusinessStores(businessId).catch(() => []),
        getBusinessSubscription(businessId).catch(() => null),
      ]);
      const byEntity = new Map<string, SubscriptionItemResponse>();
      for (const it of sub?.items ?? []) {
        if (it.status !== "REMOVED") byEntity.set(it.entityId, it);
      }
      const business: AccountStructureBusiness = {
        businessId,
        locations: locs.map((l) =>
          nodeFrom("LOCATION", { id: l.id, name: l.name, identifier: l.identifier, region: l.region }, byEntity.get(l.id) ?? null),
        ),
        warehouses: whs.map((w) =>
          nodeFrom("WAREHOUSE", { id: w.id, name: w.name, identifier: w.identifier, code: w.code }, byEntity.get(w.id) ?? null),
        ),
        stores: sts.map((s) =>
          nodeFrom("STORE", { id: s.id, name: s.name, identifier: s.identifier, code: s.code }, byEntity.get(s.id) ?? null),
        ),
      };
      return [businessId, business] as const;
    }),
  );
  return Object.fromEntries(entries);
}

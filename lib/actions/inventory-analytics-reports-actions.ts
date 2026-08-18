"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type { InventoryBalanceSummary } from "@/types/inventory-balance/summary-type";
import type { InventorySnapshot } from "@/types/inventory-snapshot/type";
import type { AuditLogPage } from "@/types/audit-log/type";

/**
 * Reports Service wrappers for the inventory read paths the dashboard
 * used to call directly against the Inventory Service.
 *
 * Why this module exists: heavy reporting/analytics queries should not
 * be answered by the transactional Inventory Service. The Reports
 * Service owns the materialised-view layer (ClickHouse fact tables
 * synced via Kafka) and is the right home for read-side aggregation.
 *
 * Mutations (reorder config, threshold writes, balance overrides) keep
 * going through {@code lib/actions/inventory-balance-actions.ts} —
 * the Inventory Service is still the source of truth for those.
 */

const ANALYTICS = "/api/v2/analytics/inventory";

const EMPTY_AUDIT_PAGE: AuditLogPage = {
  content: [],
  number: 0,
  size: 50,
  totalElements: 0,
  totalPages: 0,
  last: true,
};

// ── Live balances (fact_inventory_current) ─────────────────────────

/**
 * Live balance rows for every variant at the location, optionally
 * filtered to a subset of stock variant IDs to keep the response tight
 * when the caller only cares about a handful (e.g. one product's
 * DIRECT-linked variants).
 *
 * Returns the lean {@link InventoryBalanceSummary} shape. Use
 * {@code getBalancesByLocation} from {@code inventory-balance-actions}
 * when you need the full Inventory Service shape with reorder config.
 */
export async function getBalanceSummariesByLocation(
  locationId: string,
  stockVariantIds?: string[],
): Promise<InventoryBalanceSummary[]> {
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ locationId });
    if (stockVariantIds && stockVariantIds.length > 0) {
      // Reports controller binds @RequestParam List<UUID> from repeated
      // ?stockVariantIds=… params (Spring's default array binding).
      stockVariantIds.forEach((id) => params.append("stockVariantIds", id));
    }
    const data = await apiClient.get(
      `${ANALYTICS}/balances?${params.toString()}`,
    );
    return parseStringify(data) as InventoryBalanceSummary[];
  } catch {
    return [];
  }
}

// ── Daily snapshots (fact_inventory_snapshot_daily) ────────────────

/**
 * One stock variant's daily snapshots over a date range. Replaces the
 * Inventory Service variant of the same name — same wire shape, same
 * call signature.
 */
export async function getVariantSnapshotHistory(
  stockVariantId: string,
  from: string,
  to: string,
): Promise<InventorySnapshot[]> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(
      `${ANALYTICS}/snapshots/variant/${stockVariantId}?from=${from}&to=${to}`,
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as InventorySnapshot[]) : [];
  } catch {
    return [];
  }
}

/**
 * Bundle: snapshots for many stock variants in one round-trip. The
 * product detail page uses this so a multi-variant product fetches
 * its full chart history with a single request instead of N parallel
 * ones.
 */
export async function getVariantsSnapshotHistory(
  stockVariantIds: string[],
  from: string,
  to: string,
): Promise<InventorySnapshot[]> {
  if (stockVariantIds.length === 0) return [];
  try {
    const apiClient = new ApiClient("reports");
    const params = new URLSearchParams({ from, to });
    stockVariantIds.forEach((id) => params.append("stockVariantIds", id));
    const data = await apiClient.get(
      `${ANALYTICS}/snapshots?${params.toString()}`,
    );
    const parsed = parseStringify(data);
    return Array.isArray(parsed) ? (parsed as InventorySnapshot[]) : [];
  } catch {
    return [];
  }
}

// ── Audit log (stub on the Reports side until ingestion lands) ─────

/**
 * Entity-scoped audit trail. The Reports Service owns the read path;
 * the Inventory Service still writes the canonical Postgres rows.
 *
 * Returns an empty page until the Reports Service's audit ingestion
 * pipeline is wired — the endpoint exists so the dashboard can be
 * migrated off the Inventory Service today and start showing real data
 * the moment the backing fact is populated.
 */
export async function getAuditLogByEntity(
  entityType: string,
  entityId: string,
  page = 0,
  size = 50,
): Promise<AuditLogPage> {
  try {
    const apiClient = new ApiClient("reports");
    const data = await apiClient.get(
      `${ANALYTICS}/audit-log/entities/${encodeURIComponent(entityType)}/${entityId}?page=${page}&size=${size}`,
    );
    return toAuditLogPage(data);
  } catch {
    return EMPTY_AUDIT_PAGE;
  }
}

// Reports Service returns a {@code PageResponse<T>} with a {@code page}
// field; the dashboard's {@link AuditLogPage} mirrors Spring's
// {@code PageImpl} JSON shape (with {@code number}). Translate here so
// existing UI code keeps reading the same field names.
function toAuditLogPage(raw: unknown): AuditLogPage {
  const r = parseStringify(raw) as {
    content?: AuditLogPage["content"];
    page?: number;
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
    last?: boolean;
  };
  return {
    content: r.content ?? [],
    number: r.number ?? r.page ?? 0,
    size: r.size ?? 0,
    totalElements: r.totalElements ?? 0,
    totalPages: r.totalPages ?? 0,
    last: r.last ?? true,
  };
}

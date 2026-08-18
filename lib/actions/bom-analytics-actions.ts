"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  BomCostCascadeRow,
  BomDeductionFailureRow,
  BomMissingRuleSummary,
  BomProductionYieldRow,
  BomRecipeCostTrend,
  BomSubstituteUsageSummary,
} from "@/types/bom/type";

/**
 * BOM analytics wrappers against the Reports Service. The Reports layer runs
 * the heavy aggregation against ClickHouse fact tables seeded by the BOM
 * event ingestion pipeline; all endpoints here are thin pass-throughs that
 * push params in and fall back to empty arrays on failure.
 */

const ANALYTICS = "/api/v2/analytics/bom";

export interface RsPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export async function getRecipeCostTrend(params: {
  businessId: string;
  locationId?: string;
  bomRuleId?: string;
  costMethod?: string;
  startDate: string;
  endDate?: string;
}): Promise<BomRecipeCostTrend[]> {
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/recipe-cost-trend?${qs}`);
    return parseStringify(data) as BomRecipeCostTrend[];
  } catch {
    return [];
  }
}

export async function getSubstituteUsage(params: {
  businessId: string;
  locationId?: string;
  bomRuleId?: string;
  startDate: string;
  endDate?: string;
}): Promise<BomSubstituteUsageSummary[]> {
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/substitute-usage?${qs}`);
    return parseStringify(data) as BomSubstituteUsageSummary[];
  } catch {
    return [];
  }
}

export async function getMissingRules(params: {
  businessId: string;
  locationId?: string;
  startDate: string;
  endDate?: string;
}): Promise<BomMissingRuleSummary[]> {
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/missing-rules?${qs}`);
    return parseStringify(data) as BomMissingRuleSummary[];
  } catch {
    return [];
  }
}

export async function getDeductionFailures(params: {
  businessId: string;
  locationId?: string;
  reason?: string;
  startDate: string;
  endDate?: string;
  page?: number;
  size?: number;
}): Promise<RsPageResponse<BomDeductionFailureRow>> {
  const empty: RsPageResponse<BomDeductionFailureRow> = {
    content: [],
    page: 0,
    size: params.size ?? 50,
    totalElements: 0,
    totalPages: 0,
    last: true,
  };
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/deduction-failures?${qs}`);
    return parseStringify(data) as RsPageResponse<BomDeductionFailureRow>;
  } catch {
    return empty;
  }
}

export async function getProductionYield(params: {
  businessId: string;
  locationId?: string;
  bomRuleId?: string;
  startDate: string;
  endDate?: string;
}): Promise<BomProductionYieldRow[]> {
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/production/yield?${qs}`);
    return parseStringify(data) as BomProductionYieldRow[];
  } catch {
    return [];
  }
}

export async function getCostCascades(params: {
  businessId: string;
  locationId?: string;
  startDate: string;
  endDate?: string;
  minRules?: number;
}): Promise<BomCostCascadeRow[]> {
  try {
    const apiClient = new ApiClient("reports");
    const qs = toQueryString(params);
    const data = await apiClient.get(`${ANALYTICS}/cost-cascades?${qs}`);
    return parseStringify(data) as BomCostCascadeRow[];
  } catch {
    return [];
  }
}

function toQueryString(params: Record<string, unknown>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  return qs.toString();
}

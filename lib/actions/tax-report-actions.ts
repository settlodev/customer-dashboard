"use server";

import ApiClient from "@/lib/settlo-api-client";
import { getCurrentLocation } from "@/lib/actions/business/get-current-business";
import { parseStringify } from "@/lib/utils";
import type { TaxReport, TaxReportBreakdown, TaxReportPeriod } from "@/types/reports/tax";

const EMPTY: TaxReport = {
  locationId: "",
  startDate: "",
  endDate: "",
  period: "day",
  breakdown: null,
  totalTaxableAmount: 0,
  totalTaxAmount: 0,
  totalsByCurrency: [],
  byTaxCode: [],
  rows: [],
};

/**
 * Sales-tax report: totals + per-tax-code split + period rows, optionally
 * broken down by product. Sourced from Reports Service's order facts —
 * tax on sales as charged (see the endpoint's own doc for the ledger-based
 * filing report this does not replace).
 */
export async function getTaxReport(
  startDate: string,
  endDate: string,
  period: TaxReportPeriod = "day",
  breakdown?: TaxReportBreakdown,
): Promise<TaxReport> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return EMPTY;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<TaxReport>(`/api/v2/analytics/orders/tax`, {
      params: {
        locationId: location.id,
        startDate,
        endDate,
        period,
        breakdown,
      },
    });
    return parseStringify(data ?? EMPTY);
  } catch (error) {
    console.error("[getTaxReport] request failed", error);
    return EMPTY;
  }
}

"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";
import type { PaymentMethodBreakdown } from "@/types/reports/payment-methods";

export interface PaymentMethodBreakdownParams {
  /** ISO date (yyyy-MM-dd). Lower bound (inclusive) on businessDate. */
  startDate: string;
  /** ISO date (yyyy-MM-dd). Upper bound (inclusive). Defaults to startDate server-side. */
  endDate?: string;
}

/**
 * Payment-method breakdown for the active location over a date range.
 *
 * Backed by `GET /api/v2/analytics/transactions/by-payment-method`. This is
 * the authoritative breakdown — unlike the `paymentMethodBreakdown` array
 * embedded in the overview response, which the dashboard previously read and
 * which comes back empty in some deployments. Returns an empty list on any
 * failure so the card can render its own empty state.
 */
export async function getPaymentMethodBreakdown(
  params: PaymentMethodBreakdownParams,
): Promise<PaymentMethodBreakdown[]> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return [];

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<PaymentMethodBreakdown[]>(
      `/api/v2/analytics/transactions/by-payment-method`,
      {
        params: {
          locationId: location.id,
          startDate: params.startDate,
          endDate: params.endDate,
        },
      },
    );
    return parseStringify(data) ?? [];
  } catch (error) {
    console.error("[getPaymentMethodBreakdown] request failed", error);
    return [];
  }
}

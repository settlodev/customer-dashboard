"use server";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { getCurrentLocation } from "./business/get-current-business";
import type {
  CashflowExpenseList,
  CashflowRefundList,
  CashflowTransactionList,
} from "@/types/reports/cashflow";

/**
 * Line-item feeds for the cashflow report's "Transaction detail" section.
 * All three are Reports Service (ClickHouse) reads whose filters reconcile
 * with the screen's KPIs: transactions mirror the by-payment-method
 * breakdown (`is_refund = 0`, complimentary included), refunds and expenses
 * mirror the overview's refund/expense totals. Each returns `null` on
 * failure — distinct from an empty page — so the section can show a retry
 * state instead of a false "no activity".
 */

const ANALYTICS = "/api/v2/analytics";

export interface CashflowDetailParams {
  /** ISO date (yyyy-MM-dd), inclusive lower bound on businessDate. */
  startDate: string;
  /** ISO date (yyyy-MM-dd), inclusive. Defaults to startDate server-side. */
  endDate?: string;
  /** Zero-based page index. */
  page?: number;
  size?: number;
}

export async function getCashflowTransactions(
  params: CashflowDetailParams & {
    /** `acceptedPaymentMethodType` id from the breakdown; omit for all tenders. */
    paymentMethodTypeId?: string;
  },
): Promise<CashflowTransactionList | null> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<CashflowTransactionList>(
      `${ANALYTICS}/cash-flow/transactions`,
      {
        params: {
          locationId: location.id,
          startDate: params.startDate,
          endDate: params.endDate,
          paymentMethodTypeId: params.paymentMethodTypeId,
          page: params.page ?? 0,
          size: params.size ?? 10,
        },
      },
    );
    return parseStringify(data) ?? null;
  } catch (error) {
    console.error("[getCashflowTransactions] request failed", error);
    return null;
  }
}

export async function getCashflowRefunds(
  params: CashflowDetailParams,
): Promise<CashflowRefundList | null> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<CashflowRefundList>(
      `${ANALYTICS}/refunds/details`,
      {
        params: {
          locationId: location.id,
          startDate: params.startDate,
          endDate: params.endDate,
          page: params.page ?? 0,
          size: params.size ?? 10,
        },
      },
    );
    return parseStringify(data) ?? null;
  } catch (error) {
    console.error("[getCashflowRefunds] request failed", error);
    return null;
  }
}

export async function getCashflowExpenses(
  params: CashflowDetailParams,
): Promise<CashflowExpenseList | null> {
  try {
    const location = await getCurrentLocation();
    if (!location?.id) return null;

    const apiClient = new ApiClient("reports");
    const data = await apiClient.get<CashflowExpenseList>(
      `${ANALYTICS}/expenses`,
      {
        params: {
          locationId: location.id,
          startDate: params.startDate,
          endDate: params.endDate,
          page: params.page ?? 0,
          size: params.size ?? 10,
        },
      },
    );
    return parseStringify(data) ?? null;
  } catch (error) {
    console.error("[getCashflowExpenses] request failed", error);
    return null;
  }
}

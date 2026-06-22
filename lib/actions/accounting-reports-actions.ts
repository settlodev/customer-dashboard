"use server";

import { rethrowIfBoundary } from "@/lib/list-fallback";
import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import type {
  ApAgingReport,
  BalanceSheetReport,
  ExpenseSummaryReport,
  GeneralLedgerReport,
  ProfitAndLossReport,
  TrialBalanceReport,
} from "@/types/reports/type";

import { accountingUrl } from "./accounting-client";

export async function fetchTrialBalance(
  locationId: string,
  asOfDate: string,
): Promise<TrialBalanceReport | null> {
  try {
    const params = new URLSearchParams({ locationId, asOfDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/reports/trial-balance?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchTrialBalance failed", error);
    return null;
  }
}

export async function fetchProfitAndLoss(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<ProfitAndLossReport | null> {
  try {
    const params = new URLSearchParams({ locationId, startDate, endDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/reports/profit-and-loss?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchProfitAndLoss failed", error);
    return null;
  }
}

export async function fetchBalanceSheet(
  locationId: string,
  asOfDate: string,
): Promise<BalanceSheetReport | null> {
  try {
    const params = new URLSearchParams({ locationId, asOfDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/reports/balance-sheet?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchBalanceSheet failed", error);
    return null;
  }
}

export async function fetchGeneralLedger(
  accountId: string,
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<GeneralLedgerReport | null> {
  try {
    const params = new URLSearchParams({ locationId, startDate, endDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/reports/general-ledger/${accountId}?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchGeneralLedger failed", error);
    return null;
  }
}

export async function fetchExpenseSummary(
  locationId: string,
  startDate: string,
  endDate: string,
): Promise<ExpenseSummaryReport | null> {
  try {
    const params = new URLSearchParams({ locationId, startDate, endDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/reports/expense-summary?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchExpenseSummary failed", error);
    return null;
  }
}

export async function fetchApAging(
  locationId: string,
  asOfDate: string,
): Promise<ApAgingReport | null> {
  try {
    const params = new URLSearchParams({ locationId, asOfDate });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(`/api/v1/reports/ap-aging?${params.toString()}`),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("fetchApAging failed", error);
    return null;
  }
}

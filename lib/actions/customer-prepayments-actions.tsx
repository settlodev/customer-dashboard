"use server";

import { revalidatePath } from "next/cache";
import { UUID } from "node:crypto";

import ApiClient from "@/lib/settlo-api-client";
import { parseStringify } from "@/lib/utils";
import { ApiResponse, FormResponse } from "@/types/types";
import type {
  CustomerPrepaymentOverview,
  PrepaymentAvailableBalance,
  PrepaymentInstrument,
  PrepaymentSettings,
  PrepaymentTransaction,
} from "@/types/customer-prepayments/type";

// All endpoints are on the Accounts Service (ApiClient default), relative paths.
const BASE = "/api/v1/customer-prepayments";

const buildError = <T = unknown>(
  fallback: string,
  error: unknown,
): FormResponse<T> => {
  const message =
    (error as { message?: string; details?: { message?: string } })?.message ||
    (error as { details?: { message?: string } })?.details?.message ||
    fallback;
  return {
    responseType: "error",
    message,
    error: error instanceof Error ? error : new Error(String(message)),
  };
};

// ── Top-up ─────────────────────────────────────────────────────────────

export interface TopUpPrepaymentInput {
  customerId: UUID;
  locationId: UUID;
  amount: number;
  paymentMethodId: UUID;
  currency?: string;
  expiresAt?: string;
}

export const topUpCustomerPrepayment = async (
  input: TopUpPrepaymentInput,
): Promise<FormResponse<PrepaymentInstrument>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post<PrepaymentInstrument, unknown>(BASE, {
      locationId: input.locationId,
      amount: input.amount,
      paymentMethodId: input.paymentMethodId,
      customerId: input.customerId,
      currency: input.currency,
      expiresAt: input.expiresAt,
    });
    revalidatePath(`/customers/${input.customerId}`);
    return {
      responseType: "success",
      message: "Top-up recorded",
      data: parseStringify(data),
    };
  } catch (error) {
    return buildError<PrepaymentInstrument>("Failed to record top-up", error);
  }
};

// ── Reads ──────────────────────────────────────────────────────────────

export const getPrepaymentAvailableBalance = async (
  customerId: UUID,
  locationId: UUID,
  currency?: string,
): Promise<PrepaymentAvailableBalance | null> => {
  try {
    const params = new URLSearchParams({ customerId, locationId });
    if (currency) params.set("currency", currency);
    const apiClient = new ApiClient();
    const data = await apiClient.get<PrepaymentAvailableBalance>(
      `${BASE}/available-balance?${params.toString()}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getPrepaymentAvailableBalance failed", error);
    return null;
  }
};

export const listCustomerPrepayments = async (
  customerId: UUID,
): Promise<PrepaymentInstrument[]> => {
  try {
    const params = new URLSearchParams({ customerId, size: "200" });
    const apiClient = new ApiClient();
    const data = await apiClient.get<ApiResponse<PrepaymentInstrument>>(
      `${BASE}/by-customer?${params.toString()}`,
    );
    return parseStringify(data?.content ?? []);
  } catch (error) {
    console.error("listCustomerPrepayments failed", error);
    return [];
  }
};

export const getPrepaymentTransactions = async (
  instrumentId: UUID,
): Promise<PrepaymentTransaction[]> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<PrepaymentTransaction[]>(
      `${BASE}/${instrumentId}/transactions`,
    );
    return parseStringify(data ?? []);
  } catch (error) {
    console.error("getPrepaymentTransactions failed", error);
    return [];
  }
};

/**
 * One round-trip for the Prepaid account tab: available balance + the
 * customer's instruments + a merged, newest-first ledger across them.
 */
export const getCustomerPrepaymentOverview = async (
  customerId: UUID,
  locationId: UUID,
): Promise<CustomerPrepaymentOverview> => {
  const [balance, instruments] = await Promise.all([
    getPrepaymentAvailableBalance(customerId, locationId),
    listCustomerPrepayments(customerId),
  ]);

  const ledgers = await Promise.all(
    instruments.map((i) => getPrepaymentTransactions(i.id)),
  );
  const transactions = ledgers
    .flat()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const currency =
    balance?.currency ?? instruments[0]?.currency ?? "TZS";

  return {
    availableBalance: balance?.availableBalance ?? 0,
    currency,
    instruments,
    transactions,
  };
};

// ── Void ───────────────────────────────────────────────────────────────

export const voidCustomerPrepayment = async (
  instrumentId: UUID,
  reason: string,
  customerId?: UUID,
): Promise<FormResponse<PrepaymentInstrument>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.post<PrepaymentInstrument, unknown>(
      `${BASE}/${instrumentId}/void`,
      { reason },
    );
    if (customerId) revalidatePath(`/customers/${customerId}`);
    return {
      responseType: "success",
      message: "Prepaid balance voided",
      data: parseStringify(data),
    };
  } catch (error) {
    return buildError<PrepaymentInstrument>(
      "Failed to void prepaid balance",
      error,
    );
  }
};

// ── Settings ─────────────────────────────────────────────────────────────

export const getPrepaymentSettings = async (
  locationId: UUID,
): Promise<PrepaymentSettings | null> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.get<PrepaymentSettings>(
      `${BASE}/settings?locationId=${locationId}`,
    );
    return parseStringify(data);
  } catch (error) {
    console.error("getPrepaymentSettings failed", error);
    return null;
  }
};

export interface UpdatePrepaymentSettingsInput {
  enabled?: boolean;
  defaultExpirationDays?: number | null;
  allowBusinessWide?: boolean;
  minTopupAmount?: number;
  maxTopupAmount?: number | null;
}

export const updatePrepaymentSettings = async (
  locationId: UUID,
  input: UpdatePrepaymentSettingsInput,
): Promise<FormResponse<PrepaymentSettings>> => {
  try {
    const apiClient = new ApiClient();
    const data = await apiClient.put<PrepaymentSettings, unknown>(
      `${BASE}/settings?locationId=${locationId}`,
      input,
    );
    return {
      responseType: "success",
      message: "Prepayment settings saved",
      data: parseStringify(data),
    };
  } catch (error) {
    return buildError<PrepaymentSettings>(
      "Failed to save prepayment settings",
      error,
    );
  }
};

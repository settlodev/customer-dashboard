"use server";

import { revalidatePath } from "next/cache";

import ApiClient from "@/lib/settlo-api-client";
import { SettloApiError } from "@/lib/settlo-api-error-handler";
import { parseStringify } from "@/lib/utils";
import type { ApiResponse, FormResponse } from "@/types/types";
import type {
  ArBalanceSummary,
  ArSettlementResponse,
  CustomerArBalance,
  CustomerArSettlementResult,
  CustomerArWriteOffResult,
  OmsCustomerArSettlementResponse,
  OmsCustomerArWriteOffResponse,
} from "@/types/customer-ar/type";

import { accountingUrl } from "./accounting-client";
import { rethrowIfBoundary } from "@/lib/list-fallback";

/**
 * Date range for the debtors screen, scoped to when the debt ORIGINATED
 * (the `oldestUnsettledAt` anchor the aging buckets are measured from).
 * Both ends are optional — omitting them lists every outstanding balance.
 */
export interface ArBalanceRange {
  /** Inclusive start, `yyyy-MM-dd`. */
  from?: string;
  /** Inclusive end, `yyyy-MM-dd`. */
  to?: string;
}

/** Shared query string for the listing and its summary — they must agree. */
function arBalanceParams(minOutstanding: number, range?: ArBalanceRange) {
  const params = new URLSearchParams();
  params.set("minOutstanding", String(minOutstanding));
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  return params;
}

export async function listArBalances(
  locationId: string,
  minOutstanding = 0,
  page = 0,
  size = 20,
  range?: ArBalanceRange,
): Promise<ApiResponse<CustomerArBalance>> {
  try {
    const params = arBalanceParams(minOutstanding, range);
    params.set("page", String(page));
    params.set("size", String(size));
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/ar-balances?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("listArBalances failed", error);
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: page, pageSize: size },
      last: true,
    } as unknown as ApiResponse<CustomerArBalance>;
  }
}

/**
 * Totals across every debtor matching the filter — what the KPI strip shows.
 * Summing the current page instead would understate every figure the moment
 * a location has more debtors than fit on one page.
 */
export async function getArBalanceSummary(
  locationId: string,
  minOutstanding = 0,
  range?: ArBalanceRange,
): Promise<ArBalanceSummary | null> {
  try {
    const params = arBalanceParams(minOutstanding, range);
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/locations/${locationId}/ar-balances/summary?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch (error) {
    rethrowIfBoundary(error);
    console.error("getArBalanceSummary failed", error);
    return null;
  }
}

export async function getCustomerArBalance(
  customerId: string,
  locationId: string,
): Promise<CustomerArBalance | null> {
  try {
    const params = new URLSearchParams({ locationId });
    const apiClient = new ApiClient();
    const data = await apiClient.get(
      accountingUrl(
        `/api/v1/customers/${customerId}/ar-balance?${params.toString()}`,
      ),
    );
    return parseStringify(data);
  } catch {
    return null;
  }
}

// ─── Settlement / write-off routing ─────────────────────────────────
//
// A debtor's balance can be backed by two different things:
//   1. Signed-bill ORDERS in Order Management — settled/written off THROUGH
//      OMS so the orders themselves record the payment (and Accounting hears
//      about each order through the normal payment pipeline).
//   2. Standalone charges with no orders behind them (accounting invoices,
//      migrated history) — handled directly against the Accounting Service.
//
// The split is decided by what OMS says the customer's outstanding signed
// bills add up to. That read MUST NOT fail-soft to zero: silently routing an
// order-backed settlement into Accounting-only is exactly the drift these
// flows were built to eliminate.

/** Sum of the customer's outstanding signed bills in OMS. Throws on failure. */
async function omsOutstandingForCustomer(
  customerId: string,
  locationId: string,
): Promise<number> {
  const oms = new ApiClient("orders");
  const bills = (await oms.get(
    `/api/v1/customers/${customerId}/signed-bills?locationId=${locationId}`,
  )) as Array<{ signedAmount?: number | null }>;
  return (bills ?? []).reduce((sum, b) => sum + (b.signedAmount ?? 0), 0);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface SettlementInput {
  customerId: string;
  locationId: string;
  amount: number;
  paymentMethodId: string;
  note?: string;
}

/**
 * Records a debtor settlement, split across the two backing stores:
 * min(amount, OMS outstanding) settles the customer's signed orders in OMS
 * (oldest first — the orders update and auto-close, and Accounting clears
 * the matching balance via the payment pipeline); any residual settles the
 * standalone portion directly in Accounting.
 */
export async function recordArSettlement(
  input: SettlementInput,
): Promise<FormResponse<CustomerArSettlementResult>> {
  let omsPortion = 0;
  try {
    const omsOutstanding = await omsOutstandingForCustomer(
      input.customerId,
      input.locationId,
    );
    omsPortion = round2(Math.min(input.amount, omsOutstanding));
    const residual = round2(input.amount - omsPortion);

    let omsResult: OmsCustomerArSettlementResponse | null = null;
    if (omsPortion > 0) {
      const oms = new ApiClient("orders");
      omsResult = (await oms.post(
        `/api/v1/locations/${input.locationId}/customers/${input.customerId}/ar-settlements`,
        {
          amount: omsPortion,
          paymentMethodId: input.paymentMethodId,
          note: input.note || undefined,
        },
      )) as OmsCustomerArSettlementResponse;
    }

    let accountingResult: ArSettlementResponse | null = null;
    if (residual > 0) {
      const apiClient = new ApiClient();
      accountingResult = (await apiClient.post(
        accountingUrl(`/api/v1/customers/${input.customerId}/ar-settlements`),
        {
          locationId: input.locationId,
          amount: residual,
          paymentMethodId: input.paymentMethodId,
          note: input.note || undefined,
        },
      )) as ArSettlementResponse;
    }

    revalidatePath("/debtors");
    const settledOrders = omsResult?.orders?.length ?? 0;
    return {
      responseType: "success",
      message:
        settledOrders > 0
          ? `Settlement recorded — ${settledOrders} signed ${settledOrders === 1 ? "bill" : "bills"} settled${residual > 0 ? `, plus ${residual} against the standalone balance` : ""}`
          : "Settlement recorded",
      data: parseStringify({ oms: omsResult, accounting: accountingResult }),
    };
  } catch (error: unknown) {
    console.error("recordArSettlement failed", error);
    const detail =
      error instanceof Error ? error.message : "Failed to record settlement";
    return {
      responseType: "error",
      // If the OMS leg already went through, say so — those orders really
      // were settled; only the standalone remainder needs a retry.
      message:
        omsPortion > 0
          ? `${detail} — note: ${omsPortion} may already be settled against signed bills; check the balance before retrying the remainder`
          : detail,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

interface WriteOffInput {
  customerId: string;
  locationId: string;
  reason: string;
}

/**
 * Writes off a debtor's outstanding balance as bad debt. Routing is
 * mutually exclusive: when the customer has outstanding signed bills in
 * OMS, ONLY those are written off (their events clear the matching
 * Accounting balance asynchronously); only a debtor with no orders behind
 * the balance is written off directly in Accounting. Running both at once
 * would double-expense the order-backed portion while its events are still
 * in flight.
 */
export async function recordArWriteOff(
  input: WriteOffInput,
): Promise<FormResponse<CustomerArWriteOffResult>> {
  try {
    const oms = new ApiClient("orders");
    try {
      const omsResult = (await oms.post(
        `/api/v1/locations/${input.locationId}/customers/${input.customerId}/ar-write-offs`,
        { reason: input.reason },
      )) as OmsCustomerArWriteOffResponse;
      revalidatePath("/debtors");
      const count = omsResult.orders?.length ?? 0;
      return {
        responseType: "success",
        message: `Wrote off ${count} signed ${count === 1 ? "bill" : "bills"} (${omsResult.totalWrittenOff}). Any standalone balance updates shortly — write off again if a remainder persists.`,
        data: parseStringify({ oms: omsResult, accounting: null }),
      };
    } catch (error: unknown) {
      // No signed bills in OMS → this is a standalone (invoice/migrated)
      // balance; fall through to the Accounting-side write-off.
      const code = error instanceof SettloApiError ? error.code : undefined;
      if (code !== "NO_OUTSTANDING_RECEIVABLE") throw error;
    }

    const apiClient = new ApiClient();
    const accountingResult = await apiClient.post(
      accountingUrl(`/api/v1/customers/${input.customerId}/ar-write-offs`),
      { locationId: input.locationId, reason: input.reason },
    );
    revalidatePath("/debtors");
    return {
      responseType: "success",
      message: "Outstanding balance written off as bad debt",
      data: parseStringify({ oms: null, accounting: accountingResult }),
    };
  } catch (error: unknown) {
    console.error("recordArWriteOff failed", error);
    return {
      responseType: "error",
      message:
        error instanceof Error ? error.message : "Failed to write off balance",
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
